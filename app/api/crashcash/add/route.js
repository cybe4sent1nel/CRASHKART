import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

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

        const { amount, source, orderId } = await req.json()

        if (!amount || amount <= 0) {
            return Response.json(
                { message: 'Invalid amount' },
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

        // Create scratch card for crash cash earned
        const scratchCard = await prisma.scratchCard.create({
            data: {
                userId: user.id,
                rewardType: 'cashback',
                rewardValue: amount,
                rewardCode: `CC-${Date.now()}`,
                expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year expiry
            }
        })

        return Response.json({
            success: true,
            scratchCard: scratchCard,
            message: `Successfully earned ₹${amount} CrashCash`
        })

    } catch (error) {
        console.error('CrashCash Add Error:', error)
        return Response.json(
            { message: error.message || 'Failed to add crash cash' },
            { status: 500 }
        )
    }
}
