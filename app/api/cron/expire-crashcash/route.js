import { NextResponse } from 'next/server'
import { expireDueCrashCashRewards } from '@/lib/rewards'

export const dynamic = 'force-dynamic'

function authorize(request) {
    const configuredSecret = process.env.CRASHCASH_CRON_SECRET
    const header = request.headers.get('authorization') || ''
    const bearer = header.startsWith('Bearer ') ? header.slice(7) : null
    const querySecret = request.nextUrl?.searchParams?.get('secret')
    const vercelCron = request.headers.get('x-vercel-cron')
    const provided = bearer || querySecret

    if (vercelCron === '1' && process.env.VERCEL) {
        return { ok: true }
    }

    if (!configuredSecret) {
        return { ok: false, status: 500, message: 'CRASHCASH_CRON_SECRET not configured' }
    }

    if (!provided || provided !== configuredSecret) {
        return { ok: false, status: 401, message: 'Unauthorized' }
    }

    return { ok: true }
}

async function handle(request) {
    const auth = authorize(request)
    if (!auth.ok) {
        return NextResponse.json({ error: auth.message }, { status: auth.status })
    }

    try {
        const result = await expireDueCrashCashRewards()
        return NextResponse.json({ success: true, ...result })
    } catch (error) {
        console.error('CrashCash cron failed:', error)
        return NextResponse.json({ error: 'Failed to expire CrashCash rewards' }, { status: 500 })
    }
}

export async function GET(request) {
    return handle(request)
}

export async function POST(request) {
    return handle(request)
}
