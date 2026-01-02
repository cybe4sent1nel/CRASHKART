import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentSession } from '@/lib/session'
// Prevent Next.js from attempting to pre-render this route
export const dynamic = 'force-dynamic'

export async function POST(request) {
    try {
        const { authOptions } = await import('@/lib/auth');
        const session = await getCurrentSession();

        if (!session?.user?.email) {
            return NextResponse.json(
                { message: 'Unauthorized' },
                { status: 401 }
            )
        }

        const formData = await request.formData()
        
        const subject = formData.get('subject')
        const category = formData.get('category')
        const description = formData.get('description')
        const orderId = formData.get('orderId') || null
        const images = formData.getAll('images')

        // Validate required fields
        if (!subject || !category || !description) {
            return NextResponse.json(
                { message: 'Missing required fields' },
                { status: 400 }
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

        // Create complaint
        const complaint = await prisma.complaint.create({
            data: {
                userId: user.id,
                orderId: orderId || null,
                subject,
                category,
                description,
                images: images.length > 0 ? images.map((_, i) => `complaint-image-${user.id}-${Date.now()}-${i}`) : [],
                status: 'open'
            }
        })

        console.log(`Complaint created: ${complaint.id} by ${user.email}`)

        return NextResponse.json(complaint, { status: 201 })

    } catch (error) {
        console.error('Error creating complaint:', error)
        return NextResponse.json(
            { message: 'Failed to create complaint: ' + error.message },
            { status: 500 }
        )
    }
}
