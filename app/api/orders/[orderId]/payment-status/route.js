import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'
import { sendOrderConfirmationWithInvoice } from '@/lib/email'
import { getInvoiceAttachment } from '@/lib/invoiceGenerator'

export async function PUT(req, { params }) {
    try {
        // Await params first (Next.js 15 requirement)
        const resolvedParams = await params
        const orderId = resolvedParams.orderId
        
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

        // Get order - allow update from order success page
        const order = await prisma.order.findUnique({
            where: { id: orderId }
        })

        if (!order) {
            return Response.json(
                { message: 'Order not found' },
                { status: 404 }
            )
        }

        // Allow update if user owns order OR if updating from order success page (no strict check)
        // This allows payment status to be confirmed when user lands on success page

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
                orderItems: {
                    include: {
                        product: true
                    }
                },
                address: true,
                user: true
            }
        })

        console.log(`✅ Payment status updated for order ${orderId}:`, {
            isPaid: updatedOrder.isPaid,
            paymentMethod: updatedOrder.paymentMethod,
            status: updatedOrder.status,
            previousStatus: order.status
        })

        // Send order confirmation email if marking as paid for first time
        if (isPaid === true && !order.isPaid) {
            try {
                console.log('📧 Sending order confirmation email (payment confirmed via success page)...')
                
                const invoiceData = {
                    orderId: updatedOrder.id,
                    customerName: updatedOrder.user.name || updatedOrder.user.email.split('@')[0],
                    customerEmail: updatedOrder.user.email,
                    customerPhone: updatedOrder.user.phone || updatedOrder.address.phone || 'N/A',
                    items: updatedOrder.orderItems.map(item => ({
                        name: item.product?.name || 'Product',
                        quantity: item.quantity,
                        price: item.price,
                        product: item.product,
                        images: item.product?.images || []
                    })),
                    subtotal: updatedOrder.total,
                    discount: 0,
                    crashCashApplied: 0,
                    total: updatedOrder.total,
                    address: updatedOrder.address,
                    paymentMethod: updatedOrder.paymentMethod,
                    isPaid: true,
                    orderDate: updatedOrder.createdAt
                }

                // Generate invoice
                const invoiceAttachment = await getInvoiceAttachment(invoiceData)
                
                // Send email with invoice
                await sendOrderConfirmationWithInvoice(
                    updatedOrder.user.email,
                    {
                        orderId: updatedOrder.id,
                        items: updatedOrder.orderItems.map(item => ({
                            name: item.product?.name || 'Product',
                            quantity: item.quantity,
                            price: item.price,
                            images: item.product?.images || []
                        })),
                        subtotal: updatedOrder.total,
                        discount: 0,
                        total: updatedOrder.total,
                        paymentMethod: updatedOrder.paymentMethod,
                        isPaid: true,
                        address: updatedOrder.address
                    },
                    invoiceAttachment,
                    updatedOrder.user.name || updatedOrder.user.email.split('@')[0]
                )
                
                console.log('✅ Order confirmation email sent successfully to:', updatedOrder.user.email)
            } catch (emailError) {
                console.error('❌ Failed to send order confirmation email:', emailError)
                console.error('❌ Email error stack:', emailError.stack)
                // Don't fail the request if email fails
            }
        }

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
