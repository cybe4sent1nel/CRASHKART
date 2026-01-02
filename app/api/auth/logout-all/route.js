import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireUser } from '@/lib/authTokens'

export const dynamic = 'force-dynamic'

export async function POST(request) {
    try {
        const { user } = await requireUser(request)
        const newVersion = (user.sessionVersion ?? 0) + 1

        const updated = await prisma.user.update({
            where: { id: user.id },
            data: { sessionVersion: newVersion },
            select: { sessionVersion: true }
        })

        return NextResponse.json({ success: true, sessionVersion: updated.sessionVersion })
    } catch (error) {
        if (error.name === 'AuthError') {
            return NextResponse.json({ error: error.message, code: error.code }, { status: error.status })
        }
        console.error('Logout-all failed:', error)
        return NextResponse.json({ error: 'Failed to logout from all devices' }, { status: 500 })
    }
}
