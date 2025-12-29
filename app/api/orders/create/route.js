import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { triggerOrderConfirmationEmail } from '@/lib/emailTriggerService'
import { sendOrderPlacedEmail } from '@/lib/emailService'
import { sendOrderConfirmationWithInvoice } from '@/lib/email'
import { getInvoiceAttachment } from '@/lib/invoiceGenerator'

const prisma = new PrismaClient()

export async function POST(req) {
    try {
        const session = await getServerSession(authOptions)
        
        if (!session?.user?.email) {
            return Response.json(
                { message: 'Unauthorized' },
                { status: 401 }
            )
        }

        const body = await req.json()
        const {
            paymentMethod,
            paymentDetails,
            items,
            subtotal,
            discount,
            total,
            selectedAddressId,
            mobileNumber,
            appliedCoupon,
            transactionId,
            timestamp
        } = body

        // Validate required fields
        if (!items || items.length === 0) {
            return Response.json(
                { message: 'No items in order' },
                { status: 400 }
            )
        }

        if (!paymentMethod) {
            return Response.json(
                { message: 'Payment method required' },
                { status: 400 }
            )
        }

        // Get user from session
        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        })

        if (!user) {
            return Response.json(
                { message: 'User not found' },
                { status: 404 }
            )
        }

        // Get the selected address
        let addressId = selectedAddressId
        let address = null

        if (selectedAddressId) {
            address = await prisma.address.findUnique({
                where: { id: selectedAddressId }
            })
        }

        if (!address) {
            return Response.json(
                { message: 'Address not found' },
                { status: 404 }
            )
        }

        // Determine payment method enum
        const paymentMethodEnum = paymentMethod.toUpperCase() === 'COD' ? 'COD' : 'CASHFREE'

        // Determine if paid based on payment method
        // CASHFREE payments (Card, UPI, Net Banking) need webhook confirmation, so start as unpaid
        // They will be marked paid when webhook confirms payment
        // COD orders start with isPaid: false (payment on delivery)
        const isPaidInitially = false
        
        console.log(`💳 Payment method: ${paymentMethodEnum}, Initial paid status: ${isPaidInitially}`)

        // Create order in database
        const order = await prisma.order.create({
            data: {
                userId: user.id,
                storeId: items[0].storeId || 'default-store', // Use first item's store or default
                addressId: address.id,
                total: total,
                isPaid: isPaidInitially,
                paymentMethod: paymentMethodEnum,
                status: 'ORDER_PLACED',
                isCouponUsed: !!appliedCoupon,
                coupon: appliedCoupon ? JSON.stringify(appliedCoupon) : null,
                orderItems: {
                    create: items.map(item => ({
                        productId: item.id || item.productId,
                        quantity: item.quantity,
                        price: item.price
                    }))
                }
            },
            include: {
                orderItems: true
            }
        })

        // If coupon was used, mark it as used
        if (appliedCoupon && appliedCoupon.code) {
            try {
                await prisma.userCoupon.updateMany({
                    where: {
                        userId: user.id,
                        couponCode: appliedCoupon.code,
                        isUsed: false
                    },
                    data: {
                        isUsed: true,
                        usedAt: new Date(),
                        usedInOrderId: order.id
                    }
                })
            } catch (err) {
                console.log('Coupon update skipped:', err.message)
            }
        }

        // Clear user's cart
        try {
            await prisma.cartItem.deleteMany({
                where: { userId: user.id }
            })
        } catch (err) {
            console.log('Cart clear skipped:', err.message)
        }

        // Calculate CrashCash reward (10% of order total OR product-specific CrashCash value)
        let totalCrashCashEarned = 0
        
        // Check if items have specific crashCashValue
        for (const item of items) {
            if (item.crashCashValue && item.crashCashValue > 0) {
                // Product-specific CrashCash
                totalCrashCashEarned += item.crashCashValue * item.quantity
            }
        }
        
        // If no product-specific CrashCash, use 10% of order total
        if (totalCrashCashEarned === 0) {
            totalCrashCashEarned = Math.floor(total * 0.1)
        }
        
        // Add CrashCash to user's balance immediately (regardless of scratch card win/loss)
        try {
            console.log(`💰 Calculating CrashCash: ${totalCrashCashEarned} for order ${order.id}`)
            
            const updatedUser = await prisma.user.update({
                where: { id: user.id },
                data: {
                    crashCashBalance: {
                        increment: totalCrashCashEarned
                    }
                }
            })
            
            console.log(`✅ User CrashCash balance updated: ${updatedUser.crashCashBalance}`)
            
            // Create CrashCash reward record with 30-day expiry
            const expiryDate = new Date()
            expiryDate.setDate(expiryDate.getDate() + 30) // 30 days from now
            
            const crashCashReward = await prisma.crashCashReward.create({
                data: {
                    userId: user.id,
                    orderId: order.id,
                    amount: totalCrashCashEarned,
                    source: 'order_placed',
                    status: 'active',
                    expiresAt: expiryDate,
                    earnedAt: new Date()
                }
            })
            
            console.log(`✅ CrashCash reward record created:`, crashCashReward.id)
            console.log(`✅ Added ₹${totalCrashCashEarned} CrashCash to user ${user.email} (expires ${expiryDate.toLocaleDateString()})`)
        } catch (cashError) {
            console.error('❌ Failed to add CrashCash:', cashError.message)
            console.error('❌ CrashCash error stack:', cashError.stack)
            // Don't fail the order if CrashCash update fails
        }

        // Fetch the complete order with relations for email
        const completeOrder = await prisma.order.findUnique({
            where: { id: order.id },
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

        // Send beautiful order placed email with invoice
        // Send for ALL payment methods: COD, Card, UPI, Net Banking
        try {
            console.log(`📧 Sending order confirmation for payment method: ${paymentMethodEnum}`)
            console.log(`📧 Preparing to send order confirmation email to ${user.email}`)
            
            // Prepare invoice data
            const invoiceData = {
                orderId: completeOrder.id,
                customerName: user.name || user.email.split('@')[0],
                customerEmail: user.email,
                customerPhone: user.phone || address.phone || 'N/A',
                items: completeOrder.orderItems.map(item => ({
                    name: item.product?.name || 'Product',
                    quantity: item.quantity,
                    price: item.price,
                    product: item.product,
                    images: item.product?.images || []
                })),
                subtotal: subtotal,
                discount: discount || 0,
                crashCashApplied: 0,
                total: total,
                address: address,
                paymentMethod: paymentMethodEnum,
                isPaid: isPaidInitially,
                orderDate: completeOrder.createdAt
            }

            console.log(`📄 Generating invoice attachment...`)
            // Generate invoice attachment
            const invoiceAttachment = await getInvoiceAttachment(invoiceData)
            console.log(`✅ Invoice attachment generated`)

            console.log(`📨 Sending order confirmation email...`)
            // Send order confirmation email with invoice
            await sendOrderConfirmationWithInvoice(
                user.email,
                {
                    orderId: completeOrder.id,
                    items: completeOrder.orderItems.map(item => ({
                        name: item.product?.name || 'Product',
                        quantity: item.quantity,
                        price: item.price,
                        images: item.product?.images || []
                    })),
                    subtotal: subtotal,
                    discount: discount || 0,
                    total: total,
                    paymentMethod: paymentMethodEnum,
                    isPaid: isPaidInitially,
                    address: address
                },
                invoiceAttachment,
                user.name || user.email.split('@')[0]
            )
            console.log('✅ Order placed email with invoice sent successfully to:', user.email)
            console.log('📧 Email sent for payment method:', paymentMethodEnum)
            if (paymentMethodEnum === 'CASHFREE') {
                console.log('🔔 Waiting for Cashfree webhook to confirm payment (Card/UPI/Net Banking)')
            }
        } catch (emailError) {
            console.error('❌ Failed to send order placed email:', emailError.message)
            console.error('❌ Email error stack:', emailError.stack)
            console.error('❌ Full email error:', emailError)
            // Don't fail the order if email fails
        }

        // Send order confirmation email with tracking link using automated trigger
        try {
            const orderData = {
                items: items.map(item => ({
                    name: item.name,
                    quantity: item.quantity,
                    price: item.price
                })),
                subtotal: subtotal,
                discount: discount || 0,
                crashCashApplied: 0
            }

            await triggerOrderConfirmationEmail(order, user, address, orderData)
        } catch (emailErr) {
            console.error('Email sending failed (non-critical):', emailErr.message)
            // Don't fail the order if email fails
        }

        // Return success
        return Response.json(
            {
                success: true,
                orderId: order.id,
                order: {
                    id: order.id,
                    total: order.total,
                    status: order.status,
                    paymentMethod: order.paymentMethod,
                    createdAt: order.createdAt,
                    itemsCount: order.orderItems.length
                },
                crashCashEarned: totalCrashCashEarned,
                message: 'Order created successfully'
            },
            { status: 200 }
        )

    } catch (error) {
        console.error('Order Creation Error:', error.message)
        return Response.json(
            { message: error.message || 'Failed to create order' },
            { status: 500 }
        )
    }
}
