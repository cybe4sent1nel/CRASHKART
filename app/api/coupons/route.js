import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const prisma = new PrismaClient()

// GET - Fetch user's available coupons
export async function GET(req) {
    try {
        const session = await getServerSession(authOptions)
        
        if (!session?.user?.email) {
            return Response.json(
                { message: 'Unauthorized' },
                { status: 401 }
            )
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        })

        if (!user) {
            return Response.json(
                { message: 'User not found' },
                { status: 404 }
            )
        }

        // Get unused coupons that haven't expired
        const userCoupons = await prisma.userCoupon.findMany({
            where: {
                userId: user.id,
                isUsed: false,
                expiresAt: {
                    gt: new Date()
                }
            }
        })

        return Response.json({
            success: true,
            coupons: userCoupons
        })

    } catch (error) {
        console.error('Coupon GET Error:', error)
        return Response.json(
            { message: error.message },
            { status: 500 }
        )
    }
}

// POST - Assign coupon to user or apply coupon code
export async function POST(req) {
    try {
        const session = await getServerSession(authOptions)
        
        if (!session?.user?.email) {
            return Response.json(
                { message: 'Unauthorized' },
                { status: 401 }
            )
        }

        const { couponCode, expiresAt } = await req.json()

        if (!couponCode) {
            return Response.json(
                { message: 'Missing coupon code' },
                { status: 400 }
            )
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        })

        if (!user) {
            return Response.json(
                { message: 'User not found' },
                { status: 404 }
            )
        }

        // Check if coupon already assigned
        const existing = await prisma.userCoupon.findUnique({
            where: {
                userId_couponCode: {
                    userId: user.id,
                    couponCode: couponCode
                }
            }
        })

        if (existing) {
            return Response.json(
                { message: 'Coupon already assigned to user' },
                { status: 400 }
            )
        }

        // Verify coupon exists
        const coupon = await prisma.coupon.findUnique({
            where: { code: couponCode }
        })

        if (!coupon) {
            return Response.json(
                { message: 'Invalid coupon code' },
                { status: 404 }
            )
        }

        // Create user coupon
        const userCoupon = await prisma.userCoupon.create({
            data: {
                userId: user.id,
                couponCode: couponCode,
                expiresAt: expiresAt ? new Date(expiresAt) : coupon.expiresAt
            }
        })

        return Response.json({
            success: true,
            coupon: userCoupon
        })

    } catch (error) {
        console.error('Coupon POST Error:', error)
        return Response.json(
            { message: error.message },
            { status: 500 }
        )
    }
}

// PATCH - Mark coupon as used
export async function PATCH(req) {
    try {
        const session = await getServerSession(authOptions)
        
        if (!session?.user?.email) {
            return Response.json(
                { message: 'Unauthorized' },
                { status: 401 }
            )
        }

        const { couponCode, orderId } = await req.json()

        if (!couponCode) {
            return Response.json(
                { message: 'Missing coupon code' },
                { status: 400 }
            )
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        })

        if (!user) {
            return Response.json(
                { message: 'User not found' },
                { status: 404 }
            )
        }

        // Update coupon as used
        const updatedCoupon = await prisma.userCoupon.update({
            where: {
                userId_couponCode: {
                    userId: user.id,
                    couponCode: couponCode
                }
            },
            data: {
                isUsed: true,
                usedAt: new Date(),
                usedInOrderId: orderId || null
            }
        })

        return Response.json({
            success: true,
            coupon: updatedCoupon
        })

    } catch (error) {
        console.error('Coupon PATCH Error:', error)
        return Response.json(
            { message: error.message },
            { status: 500 }
        )
    }
}
