import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(req, { params }) {
    try {
        // Handle async params in Next.js 15
        const resolvedParams = await Promise.resolve(params)
        const { id } = resolvedParams
        
        console.log('📋 Fetching complaint with ID:', id)

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
            console.log('❌ Complaint not found:', id)
            return NextResponse.json({ error: 'Complaint not found' }, { status: 404 })
        }

        console.log('✅ Complaint found:', complaint.id)
        return NextResponse.json({ complaint })
    } catch (error) {
        console.error('❌ Error fetching complaint:', error)
        return NextResponse.json({ error: 'Failed to fetch complaint' }, { status: 500 })
    }
}
