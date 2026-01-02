import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { verifyUserToken } from '@/lib/authTokens'

// Prevent Next.js from attempting to pre-render this route
export const dynamic = 'force-dynamic'

export async function GET(req) {
    try {
        const { authOptions } = await import('@/lib/auth')
        // Get user session
        const authHeader = req.headers.get('authorization')
        let session = await getCurrentSession()
        let userEmail = session?.user?.email
        let userId = null

        // Check Bearer token if no NextAuth session
        let user = null

        if (userEmail) {
            user = await prisma.user.findUnique({ where: { email: userEmail } })
            userId = user?.id
        }

        if (!user && authHeader?.startsWith('Bearer ')) {
            try {
                const token = authHeader.slice(7)
                const verified = await verifyUserToken(token)
                user = verified.user
                userId = user.id
                userEmail = user.email
            } catch (err) {
                console.error('JWT verification failed:', err.message)
            }
        }

        if (!user) {
            return Response.json({ message: 'Unauthorized' }, { status: 401 })
        }

        if (!user) {
            return Response.json({ message: 'User not found' }, { status: 404 })
        }

        // Get all rewards for the user
        const rewards = await prisma.crashCashReward.findMany({
            where: { userId: user.id },
            orderBy: { earnedAt: 'desc' }
        })

        // Calculate totals
        const totalEarned = rewards.reduce((sum, r) => sum + r.amount, 0)

        return Response.json({
            rewards,
            totalBalance: user.crashCashBalance,
            totalEarned
        })
    } catch (error) {
        console.error('Error fetching rewards:', error)
        return Response.json(
            { message: 'Internal server error' },
            { status: 500 }
        )
    }
}
