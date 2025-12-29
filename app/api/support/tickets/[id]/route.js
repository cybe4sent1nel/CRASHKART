import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(req, { params }) {
    try {
        // Handle async params in Next.js 15
        const resolvedParams = await Promise.resolve(params)
        const { id } = resolvedParams
        
        console.log('🎫 Fetching support ticket with ID:', id)

        const ticket = await prisma.supportTicket.findUnique({
            where: { id }
        })

        if (!ticket) {
            console.log('❌ Ticket not found:', id)
            return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
        }

        console.log('✅ Ticket found:', ticket.id)
        return NextResponse.json({ ticket })
    } catch (error) {
        console.error('❌ Error fetching ticket:', error)
        return NextResponse.json({ error: 'Failed to fetch ticket' }, { status: 500 })
    }
}
