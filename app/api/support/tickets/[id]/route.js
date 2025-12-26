import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(req, { params }) {
    try {
        const { id } = params

        const ticket = await prisma.supportTicket.findUnique({
            where: { id }
        })

        if (!ticket) {
            return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
        }

        return NextResponse.json({ ticket })
    } catch (error) {
        console.error('Error fetching ticket:', error)
        return NextResponse.json({ error: 'Failed to fetch ticket' }, { status: 500 })
    }
}
