import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'
// Prevent Next.js from attempting to pre-render this route
export const dynamic = 'force-dynamic'

const prisma = new PrismaClient()

// GET - Fetch user's available coupons or public coupons for a product
export async function GET(req) {
    try {
        const { authOptions } = await import('@/lib/auth');
        const { searchParams } = new URL(req.url);
        const productId = searchParams.get('productId')
        const publicOnly = searchParams.get('public') === 'true'
        
        // If productId is provided, fetch public coupons for that product
        if (productId || publicOnly) {
            console.log('🎫 Fetching public coupons for product:', productId)

            const now = new Date()
            const where = {
                isActive: true,
                isPublic: true,
                expiresAt: {
                    gt: now
                }
            }

            // If productId provided, filter for product-specific coupons
            if (productId) {
                where.OR = [
                    { applicableProducts: { isEmpty: true } }, // Universal coupons
                    { applicableProducts: { has: productId } }  // Product-specific coupons
                ]
            }

            const coupons = await prisma.coupon.findMany({
                where,
                orderBy: {
                    discount: 'desc'
                }
            })

            console.log(`✅ Found ${coupons.length} public coupons`)

            return Response.json({
                success: true,
                coupons,
                count: coupons.length
            })
        }
        
        // Otherwise, fetch user's personal coupons (requires auth)
        const session = await getCurrentSession()
        
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
        const { authOptions } = await import('@/lib/auth');
        const session = await getCurrentSession();
        
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
        const { authOptions } = await import('@/lib/auth');
        const session = await getCurrentSession();
        
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

