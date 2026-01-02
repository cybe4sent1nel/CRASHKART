import { prisma } from '@/lib/prisma'
import { sendOrderConfirmationWithInvoice } from '@/lib/email'
import { verifyUserToken } from '@/lib/authTokens'

// Prevent Next.js from attempting to pre-render this route
export const dynamic = 'force-dynamic'

export async function PUT(req, { params }) {
    try {
        // Next.js 15: params needs to be awaited
        const resolvedParams = await params;
        const orderId = resolvedParams.orderId;
        
        const authHeader = req.headers.get('authorization')
        
        if (!authHeader?.startsWith('Bearer ')) {
            return Response.json(
                { message: 'Unauthorized' },
                { status: 401 }
            )
        }

        const token = authHeader.slice(7)
        let userId
        
        try {
            const verified = await verifyUserToken(token)
            userId = verified.user.id
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
            where: { id: userId }
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
        const validStatuses = new Set([
            'ORDER_PLACED',
            'PROCESSING',
            'SHIPPED',
            'DELIVERED',
            'PAYMENT_PENDING',
            'CANCELLED',
            'RETURN_ACCEPTED',
            'RETURN_PICKED_UP',
            'REFUND_COMPLETED'
        ])

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

        // Only accept valid enum values for status
        if (status && validStatuses.has(status)) {
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

                // In development, skip dynamic PDF generation to avoid heavy native libs being bundled
                if (process.env.NODE_ENV !== 'production') {
                    console.log('📄 Dev mode: skipping PDF invoice generation and sending confirmation without attachment')
                    try {
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
                            null,
                            updatedOrder.user.name || updatedOrder.address?.name || updatedOrder.user.email.split('@')[0] || 'Customer'
                        )
                    } catch (emailFallbackErr) {
                        console.error('Failed to send order confirmation without invoice:', emailFallbackErr)
                    }
                } else {
                    // Production: generate PDF via Puppeteer invoice generator
                        try {
                            const { generateInvoicePdf } = await import('@/lib/invoicePuppeteer')
                            const pdf = await generateInvoicePdf({
                                orderId: updatedOrder.id,
                                customerName: updatedOrder.user.name || updatedOrder.address?.name || updatedOrder.user.email.split('@')[0] || 'Customer',
                                customerEmail: updatedOrder.user.email,
                                items: updatedOrder.orderItems.map(item => ({ name: item.product?.name || 'Product', quantity: item.quantity, price: item.price, images: item.product?.images || [] })),
                                subtotal: updatedOrder.total,
                                total: updatedOrder.total,
                                paymentMethod: updatedOrder.paymentMethod,
                                address: updatedOrder.address
                            }, { type: 'order' })

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
                                pdf,
                                updatedOrder.user.name || updatedOrder.address?.name || updatedOrder.user.email.split('@')[0] || 'Customer'
                            )
                        } catch (invoiceErr) {
                            console.warn('Could not generate/send PDF invoice (fallback to HTML email):', invoiceErr?.message || invoiceErr)
                            try {
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
                                    null,
                                    updatedOrder.user.name || updatedOrder.user.email.split('@')[0]
                                )
                            } catch (emailFallbackErr) {
                                console.error('Failed to send order confirmation without invoice:', emailFallbackErr)
                            }
                        }
                }
                
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
