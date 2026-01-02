import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentSession } from '@/lib/session'
// Prevent Next.js from attempting to pre-render this route
export const dynamic = 'force-dynamic'

export async function GET(request) {
    try {
        const session = await getCurrentSession();

        if (!session?.user?.email) {
            return NextResponse.json(
                { message: 'Unauthorized' },
                { status: 401 }
            )
        }

        // Get user
        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        })

        if (!user) {
            return NextResponse.json(
                { message: 'User not found' },
                { status: 404 }
            )
        }

        // Get user's complaints
        const complaints = await prisma.complaint.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' },
            include: {
                order: {
                    select: {
                        id: true,
                        total: true,
                        status: true
                    }
                }
            }
        })

        return NextResponse.json(complaints, { status: 200 })

    } catch (error) {
        console.error('Error fetching complaints:', error)
        return NextResponse.json(
            { message: 'Failed to fetch complaints' },
            { status: 500 }
        )
    }
}

