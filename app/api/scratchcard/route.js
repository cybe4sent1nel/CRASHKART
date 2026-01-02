import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'
// Prevent Next.js from attempting to pre-render this route
export const dynamic = 'force-dynamic'

const prisma = new PrismaClient()

// GET - Fetch user's scratch cards/rewards
export async function GET(req) {
    try {
        const { authOptions } = await import('@/lib/auth');
        const session = await getServerSession(authOptions);
        
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

        const scratchCards = await prisma.scratchCard.findMany({
            where: { userId: user.id }
        })

        return Response.json({
            success: true,
            rewards: scratchCards
        })

    } catch (error) {
        console.error('ScratchCard GET Error:', error)
        return Response.json(
            { message: error.message },
            { status: 500 }
        )
    }
}

// POST - Create/reveal scratch card reward
export async function POST(req) {
    try {
        const { authOptions } = await import('@/lib/auth');
        const session = await getServerSession(authOptions);
        
        if (!session?.user?.email) {
            return Response.json(
                { message: 'Unauthorized' },
                { status: 401 }
            )
        }

        const { rewardType, rewardValue, rewardCode, expiresAt } = await req.json()

        if (!rewardType || !rewardValue) {
            return Response.json(
                { message: 'Missing required fields' },
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

        // Create scratch card reward; default expiry 30 days for scratch/coupon rewards
        const defaultExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        const scratchCard = await prisma.scratchCard.create({
            data: {
                userId: user.id,
                rewardType: rewardType,
                rewardValue: rewardValue,
                rewardCode: rewardCode || null,
                expiresAt: expiresAt ? new Date(expiresAt) : defaultExpiry
            }
        })

        return Response.json({
            success: true,
            reward: scratchCard
        })

    } catch (error) {
        console.error('ScratchCard POST Error:', error)
        return Response.json(
            { message: error.message },
            { status: 500 }
        )
    }
}

// PATCH - Mark scratch card as used
export async function PATCH(req) {
    try {
        const { authOptions } = await import('@/lib/auth');
        const session = await getServerSession(authOptions);
        
        if (!session?.user?.email) {
            return Response.json(
                { message: 'Unauthorized' },
                { status: 401 }
            )
        }

        const { scratchCardId } = await req.json()

        if (!scratchCardId) {
            return Response.json(
                { message: 'Missing scratch card ID' },
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

        // Update scratch card
        const updatedCard = await prisma.scratchCard.update({
            where: { id: scratchCardId },
            data: {
                isUsed: true,
                usedAt: new Date()
            }
        })

        return Response.json({
            success: true,
            reward: updatedCard
        })

    } catch (error) {
        console.error('ScratchCard PATCH Error:', error)
        return Response.json(
            { message: error.message },
            { status: 500 }
        )
    }
}
