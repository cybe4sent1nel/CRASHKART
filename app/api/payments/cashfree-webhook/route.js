import crypto from 'crypto'
import { PrismaClient } from '@prisma/client'
import { sendOrderConfirmationEmail } from '@/lib/email'

const prisma = new PrismaClient()

export async function POST(req) {
    try {
        const body = await req.json()
        
        // Get signature from headers
        const signature = req.headers.get('x-webhook-signature')
        const cashfreeSecretKey = process.env.CASHFREE_SECRET_KEY

        if (!signature || !cashfreeSecretKey) {
            console.warn('Webhook signature missing or secret not configured')
            return Response.json(
                { message: 'Unauthorized' },
                { status: 401 }
            )
        }

        // Verify webhook signature
        const bodyString = JSON.stringify(body)
        const computedSignature = crypto
            .createHmac('sha256', cashfreeSecretKey)
            .update(bodyString)
            .digest('base64')

        if (signature !== computedSignature) {
            console.warn('Webhook signature verification failed')
            return Response.json(
                { message: 'Signature verification failed' },
                { status: 401 }
            )
        }

        // Handle different webhook events
        const eventType = body.type
        const payload = body.data

        console.log(`Processing Cashfree webhook: ${eventType}`, payload)

        if (eventType === 'PAYMENT_SUCCESS') {
             // Payment successful
             const { order_id, payment_id, order_amount } = payload
             
             console.log('💳 Processing PAYMENT_SUCCESS:')
             console.log('  Cashfree Order ID:', order_id)
             console.log('  Payment ID:', payment_id)
             
             // Find the order in our database using the cashfree order ID from notes
             const orders = await prisma.order.findMany({
                 where: {
                     notes: {
                         contains: order_id
                     }
                 },
                 include: {
                     user: true,
                     address: true,
                     orderItems: true
                 }
             })

             console.log(`  Found ${orders.length} matching order(s)`)

             if (orders.length > 0) {
                const order = orders[0]
                
                // Update order to mark as paid
                const updatedOrder = await prisma.order.update({
                    where: { id: order.id },
                    data: {
                        isPaid: true,
                        status: 'ORDER_PLACED',
                        notes: JSON.stringify({
                            ...JSON.parse(order.notes || '{}'),
                            cashfreePaymentId: payment_id,
                            paidAt: new Date().toISOString()
                        })
                    }
                })

                // Send order confirmation email
                try {
                    const trackingLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/track/${order.id}`
                    
                    const orderData = {
                        orderId: order.id,
                        items: order.orderItems.map(item => ({
                            name: item.name || 'Product',
                            quantity: item.quantity,
                            price: item.price
                        })),
                        subtotal: order.total,
                        discount: 0,
                        crashCashApplied: 0,
                        crashCashReward: Math.floor(order.total * 0.1),
                        total: order.total,
                        address: {
                            name: order.address.name,
                            street: order.address.street,
                            city: order.address.city,
                            state: order.address.state,
                            zipCode: order.address.zip,
                            phone: order.address.phone,
                            email: order.user.email
                        },
                        paymentMethod: order.paymentMethod,
                        customerName: order.user.name || order.user.email.split('@')[0],
                        currency: process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '₹',
                        trackingLink: trackingLink
                    }
                    
                    await sendOrderConfirmationEmail(order.user.email, orderData, order.user.name || order.user.email.split('@')[0])
                } catch (emailError) {
                    console.error('Failed to send confirmation email:', emailError)
                    // Don't fail the webhook if email fails
                }

                console.log(`✓ Payment successful for order: ${order.id}, Cashfree ID: ${order_id}, payment: ${payment_id}`)
            } else {
                console.warn(`No order found for Cashfree order ID: ${order_id}`)
            }

        } else if (eventType === 'PAYMENT_FAILED') {
            // Payment failed
            const { order_id, error } = payload
            
            // Find and update the order status
            const orders = await prisma.order.findMany({
                where: {
                    notes: {
                        contains: order_id
                    }
                }
            })

            if (orders.length > 0) {
                const order = orders[0]
                
                await prisma.order.update({
                    where: { id: order.id },
                    data: {
                        status: 'PAYMENT_FAILED',
                        notes: JSON.stringify({
                            ...JSON.parse(order.notes || '{}'),
                            failureReason: error,
                            failedAt: new Date().toISOString()
                        })
                    }
                })

                console.log(`✗ Payment failed for order: ${order.id}`, error)
            }

        } else if (eventType === 'PAYMENT_SETTLED') {
            // Payment settled
            const { order_id, settlement_amount } = payload
            
            // Find and update the order with settlement info
            const orders = await prisma.order.findMany({
                where: {
                    notes: {
                        contains: order_id
                    }
                }
            })

            if (orders.length > 0) {
                const order = orders[0]
                
                await prisma.order.update({
                    where: { id: order.id },
                    data: {
                        notes: JSON.stringify({
                            ...JSON.parse(order.notes || '{}'),
                            settlementAmount: settlement_amount,
                            settledAt: new Date().toISOString()
                        })
                    }
                })

                console.log(`Settlement for order: ${order.id}, amount: ${settlement_amount}`)
            }
        }

        // Return 200 OK to acknowledge receipt
        return Response.json(
            { message: 'Webhook received' },
            { status: 200 }
        )

    } catch (error) {
        console.error('Webhook processing error:', error)
        return Response.json(
            { message: 'Internal server error' },
            { status: 500 }
        )
    }
}
