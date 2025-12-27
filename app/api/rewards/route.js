import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

export async function GET(req) {
    try {
        // Get user session
        const authHeader = req.headers.get('authorization')
        let session = await getServerSession(authOptions)
        let userEmail = session?.user?.email
        let userId = null

        // Check Bearer token if no NextAuth session
        if (!userEmail && authHeader?.startsWith('Bearer ')) {
            const token = authHeader.slice(7)
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key')
                userEmail = decoded?.email
                userId = decoded?.userId
            } catch (err) {
                console.error('JWT verification failed:', err.message)
            }
        }

        if (!userEmail && !userId) {
            return Response.json({ message: 'Unauthorized' }, { status: 401 })
        }

        // Find user
        const user = await prisma.user.findUnique({
            where: userId ? { id: userId } : { email: userEmail }
        })

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
