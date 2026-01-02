import crypto from 'crypto'
import { PrismaClient } from '@prisma/client'
import { sendOrderConfirmationWithInvoice } from '@/lib/email'
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
                console.log('  Already paid?:', order.isPaid)
                
                // Parse existing notes to check if this is a retry/payment conversion
                let existingNotes = {}
                try {
                    existingNotes = JSON.parse(order.notes || '{}')
                } catch (e) {
                    existingNotes = {}
                }

                // Also check if CrashCash rewards already exist for this order (defensive)
                let existingCrashCashRecords = []
                try {
                    existingCrashCashRecords = await prisma.crashCashReward.findMany({ where: { orderId: order.id } })
                } catch (e) {
                    console.warn('  Could not query crashCashReward records:', e.message)
                    existingCrashCashRecords = []
                }

                const isRetryPayment = !!(
                    existingNotes.retryAt ||
                    existingNotes.crashCashReward ||
                    (existingCrashCashRecords && existingCrashCashRecords.length > 0)
                )

                console.log('  Is retry/payment conversion or already rewarded?:', isRetryPayment)
                
                // Always mark as paid when Cashfree confirms payment
                // This handles both new orders and COD orders converted to online payment
                const updatedOrder = await prisma.order.update({
                    where: { id: order.id },
                    data: {
                        isPaid: true, // Always mark as paid on payment success
                        paymentMethod: order.paymentMethod === 'COD' ? 'CASHFREE' : order.paymentMethod, // Update payment method if converted from COD
                        status: 'ORDER_PLACED',
                        notes: JSON.stringify({
                            ...existingNotes,
                            cashfreePaymentId: payment_id,
                            paymentMethod: payment_group || 'online',
                            paidAt: new Date().toISOString(),
                            webhookProcessedAt: new Date().toISOString(),
                            convertedFromCOD: order.paymentMethod === 'COD',
                            // Mark that payment was received so frontend can avoid showing scratchcards again
                            paymentReceived: true,
                            paymentReceivedAt: new Date().toISOString(),
                            // In case the order originally showed a scratchcard, explicitly mark it so UI will skip
                            scratchCardShown: existingNotes.scratchCardShown || existingNotes.crashCashReward ? true : false,
                            skipScratchCard: existingNotes.scratchCardShown || existingNotes.crashCashReward ? true : false
                        })
                    }
                })
                
                console.log('  ✅ Order updated - isPaid:', updatedOrder.isPaid)

                // Calculate and add CrashCash reward to user's account
                // Skip if this is a retry payment or CrashCash already exists for this order
                if (!isRetryPayment) {
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
                        // Create reward records and increment user's balance using helper
                        const { createCrashCashReward } = await import('@/lib/rewards')
                        for (const detail of rewardDetails) {
                            await createCrashCashReward({
                                userId: order.userId,
                                orderId: order.id,
                                amount: detail.totalReward,
                                source: 'order_placed',
                                productName: detail.productName,
                                productImage: orderItems.find(i => i.name === detail.productName)?.image || null
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
                    }
                    } catch (crashCashError) {
                        console.error('  ❌ Failed to add CrashCash reward:', crashCashError.message)
                        console.error('  CrashCash error stack:', crashCashError.stack)
                        // Don't fail the webhook if CrashCash fails
                    }
                } else {
                    console.log('  ⏭️  Skipping CrashCash reward - already given or this is a repayment/conversion')
                }

                // Send order confirmation email with invoice (single authoritative email to avoid duplicates)
                try {
                    const trackingLink = `${process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')}/track/${order.id}`
                    
                    // Get customer name from user, address, or email
                    const customerName = order.user.name || order.address?.name || order.user.email.split('@')[0]
                    
                    const orderData = {
                        orderId: order.id,
                        customerName: customerName,
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
                    
                // Generate invoice attachment: prefer Puppeteer PDF generator, fall back to existing generators
                let invoiceAttachment = null

                try {
                    const ppMod = await import('@/lib/invoicePuppeteer')
                    const generateInvoicePdf = ppMod?.generateInvoicePdf || ppMod?.default?.generateInvoicePdf || ppMod?.default
                    if (typeof generateInvoicePdf === 'function') {
                        console.log('🖨️ Generating invoice PDF via Puppeteer...')
                        const pdfBuffer = await generateInvoicePdf(orderData, { type: 'order' })
                        if (pdfBuffer) {
                            invoiceAttachment = { filename: `Invoice-${order.id}.pdf`, content: pdfBuffer, contentType: 'application/pdf' }
                            console.log('🖨️ Puppeteer PDF generated')
                        }
                    }
                } catch (ppErr) {
                    console.warn('Puppeteer invoice generation failed or unavailable:', ppErr?.message || ppErr)
                }

                // Fallback to existing generator (PDFKit or HTML) if Puppeteer didn't produce a PDF
                if (!invoiceAttachment) {
                    try {
                        const { getInvoiceAttachment } = await import('@/lib/invoiceGenerator')
                        invoiceAttachment = await getInvoiceAttachment(orderData)
                        console.log('📄 Invoice generated via fallback generator')
                    } catch (genErr) {
                        console.warn('Fallback invoice generator failed:', genErr?.message || genErr)
                    }
                }

                console.log('📧 Sending order confirmation email to:', order.user.email)
                await sendOrderConfirmationWithInvoice(
                    order.user.email,
                    orderData,
                    invoiceAttachment,
                    order.user.name || order.address?.name || order.user.email.split('@')[0] || 'Customer'
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
