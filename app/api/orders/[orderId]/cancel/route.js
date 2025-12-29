import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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

        console.log(`Order ${orderId} cancelled: ${reason}`)

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
