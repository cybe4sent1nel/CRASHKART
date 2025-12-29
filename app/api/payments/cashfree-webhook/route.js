import crypto from 'crypto'
import { PrismaClient } from '@prisma/client'
import { sendOrderConfirmationWithInvoice } from '@/lib/email'
import { getInvoiceAttachment } from '@/lib/invoiceGenerator'
import { sendOrderPlacedEmail } from '@/lib/emailService'

const prisma = new PrismaClient()

// GET handler for Cashfree webhook testing
export async function GET(req) {
    return Response.json({ 
        status: 'ok', 
        message: 'Cashfree webhook endpoint is active',
        timestamp: new Date().toISOString()
    })
}

export async function POST(req) {
    try {
        const body = await req.json()
        
        console.log('🔔 Webhook received:', JSON.stringify(body, null, 2))
        
        // Handle Cashfree test webhook (they send a test event to verify endpoint)
        if (body.type === 'TEST' || body.event === 'TEST' || !body.data) {
            console.log('✅ Test webhook received - responding OK')
            return Response.json({ 
                success: true,
                message: 'Test webhook received successfully',
                timestamp: new Date().toISOString()
            }, { status: 200 })
        }
        
        // Get signature from headers
        const signature = req.headers.get('x-webhook-signature')
        const cashfreeSecretKey = process.env.CASHFREE_SECRET_KEY

        // For test webhooks, signature might be missing - handle gracefully
        if (!cashfreeSecretKey) {
            console.warn('⚠️ CASHFREE_SECRET_KEY not configured')
            // Still process the webhook in development
            if (process.env.NODE_ENV === 'production') {
                return Response.json({ message: 'Configuration error' }, { status: 500 })
            }
        }

        // Verify webhook signature only if present
        if (signature && cashfreeSecretKey) {
            const bodyString = JSON.stringify(body)
            const computedSignature = crypto
                .createHmac('sha256', cashfreeSecretKey)
                .update(bodyString)
                .digest('base64')

            if (signature !== computedSignature) {
                console.warn('⚠️ Webhook signature verification failed')
                console.warn('  Expected:', computedSignature.substring(0, 20) + '...')
                console.warn('  Received:', signature.substring(0, 20) + '...')
                // Don't reject in development for testing
                if (process.env.NODE_ENV === 'production') {
                    return Response.json({ message: 'Signature verification failed' }, { status: 401 })
                }
            } else {
                console.log('✅ Signature verified')
            }
        } else {
            console.warn('⚠️ No signature provided - proceeding without verification (test mode)')
        }

        // Handle different webhook events
        const eventType = body.type
        const payload = body.data || body

        console.log(`📥 Processing Cashfree webhook: ${eventType}`)
        
        // Extract order_id from payload
        const order_id = payload.order?.order_id || payload.order_id
        
        if (!order_id) {
            console.error('❌ No order_id found in webhook payload')
            console.error('Full payload:', JSON.stringify(payload, null, 2))
            return Response.json({ 
                success: true, 
                message: 'Missing order_id but acknowledged' 
            }, { status: 200 })
        }

        console.log('🔍 Searching for order with Cashfree ID:', order_id)

        if (eventType === 'PAYMENT_SUCCESS' || eventType === 'PAYMENT_SUCCESS_WEBHOOK') {
             // Payment successful - handles Card, UPI, Net Banking, and all Cashfree payment methods
             const { payment_id, order_amount, payment_group } = payload
             
             console.log('💳 Processing PAYMENT_SUCCESS:')
             console.log('  Cashfree Order ID:', order_id)
             console.log('  Payment ID:', payment_id)
             console.log('  Amount:', order_amount)
             console.log('  Payment Method:', payment_group || 'Not specified')
             
             // Find the order in our database using the cashfree order ID from notes
             // Try multiple search strategies
             let orders = []
             
             // Strategy 1: Search in notes field
             try {
                 orders = await prisma.order.findMany({
                     where: {
                         notes: {
                             contains: order_id
                         }
                     },
                     include: {
                         user: true,
                         address: true,
                         orderItems: {
                             include: {
                                 product: true
                             }
                         }
                     }
                 })
                 console.log(`  Strategy 1 (notes contains): Found ${orders.length} order(s)`)
             } catch (e) {
                 console.error('  Strategy 1 failed:', e.message)
             }
             
             // Strategy 2: If no orders found, try direct ID match (in case order_id is our DB ID)
             if (orders.length === 0) {
                 try {
                     const directOrder = await prisma.order.findUnique({
                         where: { id: order_id },
                         include: {
                             user: true,
                             address: true,
                             orderItems: {
                                 include: {
                                     product: true
                                 }
                             }
                         }
                     })
                     if (directOrder) {
                         orders = [directOrder]
                         console.log('  Strategy 2 (direct ID): Found 1 order')
                     }
                 } catch (e) {
                     console.error('  Strategy 2 failed:', e.message)
                 }
             }

             console.log(`  🔍 Total orders found: ${orders.length}`)

             if (orders.length > 0) {
                const order = orders[0]
                console.log('  Updating order:', order.id)
                console.log('  Current payment method:', order.paymentMethod)
                
                // Only mark as paid if it's an online payment (not COD)
                // Cashfree webhook is for online payments: Card, UPI, Net Banking, Wallets
                const shouldMarkPaid = order.paymentMethod !== 'COD'
                
                console.log('  Should mark as paid?', shouldMarkPaid)
                
                // Update order to mark as paid (only for online payments)
                const updatedOrder = await prisma.order.update({
                    where: { id: order.id },
                    data: {
                        isPaid: shouldMarkPaid, // Only mark paid for online payments
                        status: 'ORDER_PLACED',
                        notes: JSON.stringify({
                            ...JSON.parse(order.notes || '{}'),
                            cashfreePaymentId: payment_id,
                            paymentMethod: payment_group || 'online',
                            paidAt: shouldMarkPaid ? new Date().toISOString() : undefined,
                            webhookProcessedAt: new Date().toISOString()
                        })
                    }
                })
                
                console.log('  ✅ Order updated - isPaid:', updatedOrder.isPaid)

                // Calculate and add CrashCash reward to user's account
                try {
                    console.log('  💰 Processing CrashCash reward...')
                    
                    // Get product details to determine min/max CrashCash values
                    const orderItems = await prisma.orderItem.findMany({
                        where: { orderId: order.id },
                        include: {
                            product: true
                        }
                    })
                    
                    let totalCrashCashReward = 0
                    const rewardDetails = []
                    
                    // Calculate reward for each product
                    for (const item of orderItems) {
                        if (item.product) {
                            const min = item.product.crashCashMin || 10
                            const max = item.product.crashCashMax || 240
                            // Generate random reward between min and max
                            const reward = Math.floor(Math.random() * (max - min + 1)) + min
                            totalCrashCashReward += reward * item.quantity
                            
                            rewardDetails.push({
                                productName: item.name,
                                quantity: item.quantity,
                                rewardPerItem: reward,
                                totalReward: reward * item.quantity
                            })
                            
                            console.log(`    - ${item.name}: ₹${reward} x ${item.quantity} = ₹${reward * item.quantity}`)
                        }
                    }
                    
                    if (totalCrashCashReward > 0) {
                        // Update user's CrashCash balance
                        const updatedUser = await prisma.user.update({
                            where: { id: order.userId },
                            data: {
                                crashCashBalance: {
                                    increment: totalCrashCashReward
                                }
                            }
                        })
                        
                        // Create reward records for each product (for rewards page display)
                        for (const detail of rewardDetails) {
                            await prisma.crashCashReward.create({
                                data: {
                                    userId: order.userId,
                                    orderId: order.id,
                                    amount: detail.totalReward,
                                    source: 'order_placed',
                                    productName: detail.productName,
                                    productImage: orderItems.find(i => i.name === detail.productName)?.image || null,
                                    status: 'active',
                                    earnedAt: new Date()
                                }
                            })
                        }
                        
                        // Update order notes with reward details
                        await prisma.order.update({
                            where: { id: order.id },
                            data: {
                                notes: JSON.stringify({
                                    ...JSON.parse(updatedOrder.notes || '{}'),
                                    crashCashReward: totalCrashCashReward,
                                    crashCashRewardDetails: rewardDetails,
                                    crashCashAddedAt: new Date().toISOString()
                                })
                            }
                        })
                        
                        console.log(`  ✅ CrashCash reward added: ₹${totalCrashCashReward}`)
                        console.log(`  💳 User's new balance: ₹${updatedUser.crashCashBalance}`)
                    }
                } catch (crashCashError) {
                    console.error('  ❌ Failed to add CrashCash reward:', crashCashError.message)
                    console.error('  CrashCash error stack:', crashCashError.stack)
                    // Don't fail the webhook if CrashCash fails
                }

                // Send order placed email with beautiful template
                try {
                    console.log('  📧 Attempting to send order placed email...')
                    await sendOrderPlacedEmail({
                        order: updatedOrder,
                        customerEmail: order.user.email,
                        customerName: order.user.name || order.user.email.split('@')[0]
                    })
                    console.log('  ✅ Order placed email sent successfully to:', order.user.email)
                } catch (emailError) {
                    console.error('  ❌ Failed to send order placed email:', emailError.message)
                    console.error('  Email error stack:', emailError.stack)
                    // Don't fail the webhook if email fails
                }

                // Send order confirmation email with invoice
                try {
                    const trackingLink = `${process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')}/track/${order.id}`
                    
                    const orderData = {
                        orderId: order.id,
                        customerName: order.user.name || order.user.email.split('@')[0],
                        customerEmail: order.user.email,
                        customerPhone: order.address.phone,
                        items: order.orderItems.map(item => ({
                            name: item.name || 'Product',
                            quantity: item.quantity,
                            price: item.price,
                            image: item.image
                        })),
                        subtotal: order.total,
                        discount: order.discount || 0,
                        crashCashApplied: order.crashCashUsed || 0,
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
                        orderDate: order.createdAt || new Date(),
                        currency: process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '₹',
                        trackingLink: trackingLink
                    }
                    
                    // Generate invoice attachment
                    const invoiceAttachment = await getInvoiceAttachment(orderData)
                    
                    console.log('📧 Sending order confirmation email to:', order.user.email)
                    await sendOrderConfirmationWithInvoice(
                        order.user.email, 
                        orderData, 
                        invoiceAttachment,
                        order.user.name || order.user.email.split('@')[0]
                    )
                    console.log('✅ Order confirmation email sent successfully')
                } catch (emailError) {
                    console.error('❌ Failed to send confirmation email:', emailError.message)
                    console.error('Email error stack:', emailError.stack)
                    // Don't fail the webhook if email fails
                }

                console.log('🎉 Webhook processing completed successfully for order:', order.id)
                return Response.json({ message: 'Webhook processed successfully', orderId: order.id }, { status: 200 })
            } else {
                console.warn('⚠️ No order found matching Cashfree Order ID:', order_id)
                // Return 200 anyway to acknowledge receipt
                return Response.json({ message: 'Order not found', acknowledged: true }, { status: 200 })
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
            { message: 'Webhook received', acknowledged: true },
            { status: 200 }
        )

    } catch (error) {
        console.error('❌ Webhook processing error:', error)
        console.error('Error stack:', error.stack)
        // Return 200 to prevent Cashfree from retrying
        return Response.json(
            { message: 'Webhook acknowledged', error: error.message },
            { status: 200 }
        )
    }
}
