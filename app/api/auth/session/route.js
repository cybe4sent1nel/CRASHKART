import { NextResponse } from 'next/server'
import { getCurrentSession } from '@/lib/session'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const session = await getCurrentSession()
        
        if (!session) {
            return NextResponse.json({ user: null }, { status: 200 })
        }

        return NextResponse.json(session)
    } catch (error) {
        console.error('Session error:', error)
        return NextResponse.json({ user: null }, { status: 200 })
    }
}
