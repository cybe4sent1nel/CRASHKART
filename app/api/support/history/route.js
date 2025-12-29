import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET - Retrieve conversation history
export async function GET(req) {
    try {
        const email = req.headers.get('email')
        if (!email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const user = await prisma.user.findUnique({ where: { email } })
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // Get support history from database
        const history = await prisma.supportConversation.findFirst({
            where: { userId: user.id },
            orderBy: { updatedAt: 'desc' }
        })

        if (!history) {
            return NextResponse.json({ messages: [] })
        }

        return NextResponse.json({ messages: history.messages })

    } catch (error) {
        console.error('Get history error:', error)
        return NextResponse.json({ error: 'Failed to load history' }, { status: 500 })
    }
}

// POST - Save conversation history
export async function POST(req) {
    try {
        const email = req.headers.get('email')
        if (!email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const user = await prisma.user.findUnique({ where: { email } })
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        const { messages } = await req.json()

        // Upsert conversation history
        await prisma.supportConversation.upsert({
            where: { userId: user.id },
            create: {
                userId: user.id,
                messages: messages
            },
            update: {
                messages: messages,
                updatedAt: new Date()
            }
        })

        return NextResponse.json({ success: true })

    } catch (error) {
        console.error('Save history error:', error)
        return NextResponse.json({ error: 'Failed to save history' }, { status: 500 })
    }
}
