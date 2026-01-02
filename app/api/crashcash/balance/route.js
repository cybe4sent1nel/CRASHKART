import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request) {
    try {
        const userId = request.nextUrl.searchParams.get('userId')
        if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

        // Sum active rewards that haven't expired
        const now = new Date()
        const result = await prisma.crashCashReward.aggregate({
            where: { userId, status: 'active', expiresAt: { gt: now } },
            _sum: { amount: true }
        })

        const balance = Number(result._sum.amount || 0)

        return NextResponse.json({ balance })
    } catch (err) {
        console.error('Live balance error:', err)
        return NextResponse.json({ error: 'Internal error' }, { status: 500 })
    }
}
