import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(req, { params }) {
    try {
        const session = await getServerSession(authOptions)
        const { orderId } = await params

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

        // If user is authenticated, verify they own this order
        if (session?.user?.email) {
            const user = await prisma.user.findUnique({
                where: { email: session.user.email }
            })

            if (user && order.userId !== user.id) {
                return Response.json(
                    { message: 'Unauthorized' },
                    { status: 403 }
                )
            }
        }

        // Format order for frontend
        const formattedOrder = {
            id: order.id,
            total: order.total,
            subtotal: order.total + (order.coupon ? 50 : 0), // Rough estimate
            discount: 0,
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

        return Response.json({
            success: true,
            order: formattedOrder
        })

    } catch (error) {
        console.error('Get Order Error:', error)
        return Response.json(
            { message: error.message || 'Failed to fetch order' },
            { status: 500 }
        )
    }
}
