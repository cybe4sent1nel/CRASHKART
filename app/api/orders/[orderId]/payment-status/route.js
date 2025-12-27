import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

export async function PUT(req, { params }) {
    try {
        const authHeader = req.headers.get('authorization')
        
        if (!authHeader?.startsWith('Bearer ')) {
            return Response.json(
                { message: 'Unauthorized' },
                { status: 401 }
            )
        }

        const token = authHeader.slice(7)
        let userEmail
        
        try {
            const decoded = jwt.verify(
                token,
                process.env.JWT_SECRET || 'your-secret-key'
            )
            userEmail = decoded.email
        } catch (err) {
            return Response.json(
                { message: 'Invalid token' },
                { status: 401 }
            )
        }

        const orderId = params.orderId
        const body = await req.json()
        const { isPaid, paymentMethod, status } = body

        console.log(`🔄 Updating payment status for order ${orderId}:`, {
            isPaid,
            paymentMethod,
            status,
            triggeredBy: 'order-success-page'
        })

        // Get user
        const user = await prisma.user.findUnique({
            where: { email: userEmail }
        })

        if (!user) {
            return Response.json(
                { message: 'User not found' },
                { status: 404 }
            )
        }

        // Get order and verify ownership
        const order = await prisma.order.findUnique({
            where: { id: orderId }
        })

        if (!order) {
            return Response.json(
                { message: 'Order not found' },
                { status: 404 }
            )
        }

        if (order.userId !== user.id) {
            return Response.json(
                { message: 'Unauthorized - order belongs to another user' },
                { status: 403 }
            )
        }

        // Update order payment status
        const updateData = {
            isPaid: isPaid === true,
            paymentMethod: paymentMethod || order.paymentMethod,
            notes: JSON.stringify({
                ...JSON.parse(order.notes || '{}'),
                paymentStatusUpdatedAt: new Date().toISOString(),
                paymentStatusUpdatedBy: 'order-success-page',
                previousStatus: order.status
            })
        }

        // Update status if provided
        if (status) {
            updateData.status = status
        }

        const updatedOrder = await prisma.order.update({
            where: { id: orderId },
            data: updateData,
            include: {
                orderItems: true,
                address: true
            }
        })

        console.log(`✅ Payment status updated for order ${orderId}:`, {
            isPaid: updatedOrder.isPaid,
            paymentMethod: updatedOrder.paymentMethod,
            status: updatedOrder.status,
            previousStatus: order.status
        })

        return Response.json({
            success: true,
            message: 'Payment status updated',
            order: {
                id: updatedOrder.id,
                isPaid: updatedOrder.isPaid,
                paymentMethod: updatedOrder.paymentMethod,
                total: updatedOrder.total
            }
        }, { status: 200 })

    } catch (error) {
        console.error('Payment status update error:', error)
        return Response.json(
            { message: error.message || 'Failed to update payment status' },
            { status: 500 }
        )
    }
}
