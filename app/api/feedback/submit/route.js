import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function POST(request) {
    try {
        const { name, email, rating, title, message, isAnonymous, feedbackType, productId, productName, userId } = await request.json()

        // Validation
        if (!email || !title || !message || !rating) {
            return NextResponse.json(
                { message: 'Missing required fields' },
                { status: 400 }
            )
        }

        if (rating < 1 || rating > 5) {
            return NextResponse.json(
                { message: 'Rating must be between 1 and 5' },
                { status: 400 }
            )
        }

        // Create feedback
        const feedback = await prisma.userFeedback.create({
            data: {
                userId: userId || null,
                userEmail: email,
                userName: isAnonymous ? 'Anonymous' : name,
                feedbackType: feedbackType || 'app',
                productId: productId || null,
                productName: productName || null,
                rating: parseInt(rating),
                title,
                message,
                isAnonymous: isAnonymous || false,
                status: 'pending'
            }
        })

        return NextResponse.json(
            {
                message: 'Feedback submitted successfully',
                feedbackId: feedback.id
            },
            { status: 201 }
        )
    } catch (error) {
        console.error('Feedback submission error:', error)
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        )
    }
}
