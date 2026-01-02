import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
// Prevent Next.js from attempting to pre-render this route
export const dynamic = 'force-dynamic'

export async function GET(req, { params }) {
    try {
                const { authOptions } = await import('@/lib/auth')
const session = await getServerSession(authOptions)
        const { orderId } = params

        if (!orderId) {
            return Response.json(
                { message: 'Order ID is required' },
                { status: 400 }
            )
        }

        // Get order with all details
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                orderItems: {
                    include: {
                        product: true
                    }
                },
                address: true
            }
        })

        if (!order) {
            return Response.json(
                { message: 'Order not found' },
                { status: 404 }
            )
        }

        // If user is authenticated, verify they own this order or are admin
        if (session?.user?.email) {
            const user = await prisma.user.findUnique({
                where: { email: session.user.email }
            })

            // Check if user is admin from database (dynamic import)
            const { isAdmin } = await import('@/lib/adminAuth')
            const userIsAdmin = await isAdmin(session.user.email)
            
            // Allow access if user owns the order OR is admin
            if (user && order.userId !== user.id && !userIsAdmin) {
                return Response.json(
                    { message: 'Unauthorized' },
                    { status: 403 }
                )
            }
        }

        // Compute accurate subtotal from items and discount
        const computedSubtotal = order.orderItems.reduce((s, it) => s + ((it.price || 0) * (it.quantity || 1)), 0)
        const discountAmount = Math.max(0, computedSubtotal - (order.total || 0))

        // Parse notes where delivery/fee breakdown may be stored
        let notes = {}
        try {
                    const { authOptions } = await import('@/lib/auth')
notes = JSON.parse(order.notes || '{}')
        } catch (e) {
            notes = {}
        }

        const deliveryCharge = Number(notes.deliveryCharge ?? notes.delivery ?? 0)
        const shippingFee = Number(notes.shippingFee ?? notes.shipping ?? notes.baseShipping ?? 0)
        const convenienceFee = Number(notes.convenienceFee ?? notes.convenience ?? 0)
        const platformFee = Number(notes.platformFee ?? notes.platform ?? 0)
        const originalTotal = Number(notes.originalTotal ?? notes.serverSubtotal ?? computedSubtotal)

        // Format order for frontend
        const formattedOrder = {
            id: order.id,
            total: order.total,
            subtotal: computedSubtotal,
            discount: discountAmount,
            deliveryCharge: deliveryCharge,
            shippingFee: shippingFee,
            convenienceFee: convenienceFee,
            platformFee: platformFee,
            originalTotal: originalTotal,
            status: order.status,
            createdAt: order.createdAt,
            paymentMethod: order.paymentMethod,
            isPaid: order.isPaid,
            items: order.orderItems.map(item => ({
                id: item.id,
                productId: item.productId,
                name: item.product?.name || 'Product',
                price: item.price,
                quantity: item.quantity,
                product: item.product
            })),
            address: order.address ? {
                street: order.address.street,
                city: order.address.city,
                state: order.address.state,
                zip: order.address.zip,
                phone: order.address.phone,
                name: order.address.name
            } : null,
            coupon: order.coupon
        }

        // Calculate CrashCash earned (10% of order total)
        const crashCashEarned = Math.floor(order.total * 0.1)

        return Response.json({
            success: true,
            order: formattedOrder,
            crashCashEarned: crashCashEarned
        })

    } catch (error) {
        console.error('Get Order Error:', error)
        return Response.json(
            { message: error.message || 'Failed to fetch order' },
            { status: 500 }
        )
    }
}
