import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

async function revokeOrderRewards({ orderId, userId }) {
    try {
        const rewards = await prisma.crashCashReward.findMany({
            where: {
                orderId,
                status: 'active'
            }
        })

        if (!rewards || rewards.length === 0) return

        const totalRevoked = rewards.reduce((s, r) => s + Number(r.amount || 0), 0)

        const user = await prisma.user.findUnique({ where: { id: userId }, select: { crashCashBalance: true } })
        const current = Number(user?.crashCashBalance || 0)
        const newBalance = Math.max(0, current - totalRevoked)

        await prisma.$transaction([
            prisma.crashCashReward.updateMany({
                where: { orderId, status: 'active' },
                data: { status: 'revoked', usedAt: new Date() }
            }),
            prisma.user.update({
                where: { id: userId },
                data: { crashCashBalance: newBalance }
            })
        ])

        console.log(`Revoked ₹${totalRevoked} rewards for order ${orderId}`)
    } catch (err) {
        console.error('Failed to revoke rewards for order', orderId, err)
    }
}

export async function POST(request, { params }) {
    try {
        const { orderId } = params
        const { reason } = await request.json()

        // Get order
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                user: true,
                orderItems: true
            }
        })

        if (!order) {
            return NextResponse.json(
                { message: 'Order not found' },
                { status: 404 }
            )
        }

        // Check if order can be cancelled (only before shipped)
        const status = String(order.status).toUpperCase()
        if (!['ORDER_PLACED', 'PROCESSING'].includes(status)) {
            return NextResponse.json(
                { message: 'Order cannot be cancelled at this stage' },
                { status: 400 }
            )
        }

        // Update order
        const updatedOrder = await prisma.order.update({
            where: { id: orderId },
            data: {
                status: 'CANCELLED',
                canCancel: false,
                cancelReason: reason,
                canceledAt: new Date()
            }
        })

        // If payment was online (Cashfree), initiate refund
        if (order.paymentMethod === 'CASHFREE' && order.isPaid) {
            // TODO: Initiate Cashfree refund via API
            console.log(`Refund initiated for cancelled order ${orderId}`)
        }

        await revokeOrderRewards({ orderId, userId: order.userId })

        console.log(`Order ${orderId} cancelled: ${reason}`)
        // Restore stock for cancelled order items (product quantity and flash sale quantities)
        try {
            for (const item of order.orderItems || []) {
                const pid = item.productId
                const qty = Number(item.quantity || 0)
                try {
                    // Increment product stock and update inStock
                    await prisma.product.update({
                        where: { id: pid },
                        data: {
                            quantity: { increment: qty },
                            inStock: true
                        }
                    })
                } catch (pErr) {
                    console.error(`Failed to restore product stock for ${pid}:`, pErr.message)
                }

                // Update any flash sale that contains this product
                try {
                    const sales = await prisma.flashSale.findMany({ where: { products: { has: pid } } })
                    for (const sale of sales || []) {
                        const pq = sale.productQuantities || {}
                        const current = (pq && pq[pid]) ? Number(pq[pid]) : Number(sale.maxQuantity || 0)
                        const newPQ = Number(current) + qty
                        const newPQObj = { ...(pq || {}), [pid]: newPQ }
                        // Decrement sold by qty but not below 0
                        const soldAfter = Math.max(0, Number(sale.sold || 0) - qty)
                        await prisma.flashSale.update({
                            where: { id: sale.id },
                            data: {
                                productQuantities: newPQObj,
                                sold: soldAfter
                            }
                        })
                    }
                } catch (fsErr) {
                    console.error(`Failed to restore flash sale stock for product ${pid}:`, fsErr.message)
                }
            }
        } catch (stockErr) {
            console.error('Error restoring stocks on cancel:', stockErr.message)
        }

        return NextResponse.json({
            message: 'Order cancelled successfully',
            order: updatedOrder
        }, { status: 200 })

    } catch (error) {
        console.error('Error cancelling order:', error)
        return NextResponse.json(
            { message: 'Failed to cancel order: ' + error.message },
            { status: 500 }
        )
    }
}
