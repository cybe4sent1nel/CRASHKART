import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { triggerOrderConfirmationEmail } from '@/lib/emailTriggerService'

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
        // Only CASHFREE payments are marked as paid immediately
        // COD orders start with isPaid: false (payment pending)
        const isPaidInitially = paymentMethodEnum === 'CASHFREE' ? true : false

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

        // Calculate CrashCash reward (10% of order total)
        const crashCashReward = Math.floor(total * 0.1)

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
