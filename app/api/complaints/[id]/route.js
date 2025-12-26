import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(req, { params }) {
    try {
        const { id } = params

        const complaint = await prisma.complaint.findUnique({
            where: { id },
            include: {
                order: {
                    select: {
                        id: true,
                        total: true,
                        status: true,
                        createdAt: true
                    }
                }
            }
        })

        if (!complaint) {
            return NextResponse.json({ error: 'Complaint not found' }, { status: 404 })
        }

        return NextResponse.json({ complaint })
    } catch (error) {
        console.error('Error fetching complaint:', error)
        return NextResponse.json({ error: 'Failed to fetch complaint' }, { status: 500 })
    }
}
