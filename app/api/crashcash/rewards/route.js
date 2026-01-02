import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request) {
    try {
        const userId = request.nextUrl.searchParams.get('userId')
        if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

        const now = new Date()

        // Fetch all active rewards including order_placed, scratch_card, etc. (handle null expiresAt)
        const activeRewards = await prisma.crashCashReward.findMany({
            where: { 
                userId, 
                status: 'active', 
                OR: [
                    { expiresAt: { gt: now } },
                    { expiresAt: null }
                ]
            },
            orderBy: { earnedAt: 'desc' }
        })

        const expiredRewards = await prisma.crashCashReward.findMany({
            where: { userId, OR: [{ status: 'expired' }, { expiresAt: { lte: now } }] },
            orderBy: { earnedAt: 'desc' }
        })

        console.log(`💰 Fetched CrashCash rewards for ${userId}: ${activeRewards.length} active (including order rewards), ${expiredRewards.length} expired`)

        return NextResponse.json({ success: true, activeRewards, expiredRewards })
    } catch (err) {
        console.error('Failed to fetch crashcash rewards:', err)
        return NextResponse.json({ error: 'Internal error' }, { status: 500 })
    }
}
