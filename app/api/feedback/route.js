import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request) {
    try {
        const feedbackData = await request.json()

        // Validate feedback
        const email = feedbackData.userEmail || feedbackData.email
        const message = feedbackData.message || feedbackData.feedback
        
        if (!email) {
            return new Response(
                JSON.stringify({ error: 'Email is required' }),
                { status: 400 }
            )
        }

        if (!message || message.length < 10) {
            return new Response(
                JSON.stringify({ error: 'Feedback message is required' }),
                { status: 400 }
            )
        }

        // Find user by email if exists
        let user = await prisma.user.findUnique({
            where: { email }
        })

        // Save to database using UserFeedback model
        const feedback = await prisma.userFeedback.create({
            data: {
                userEmail: email,
                userName: feedbackData.userName || feedbackData.name || 'Anonymous',
                feedbackType: feedbackData.feedbackType || 'app',
                rating: feedbackData.rating || 5,
                title: feedbackData.title || 'App Feedback',
                message: message,
                userId: user?.id,
                status: 'approved',
                isAnonymous: feedbackData.isAnonymous || false
            }
        })

        console.log('📝 Feedback saved:', feedback.id)

        return new Response(
            JSON.stringify({
                success: true,
                message: 'Feedback received successfully',
                id: feedback.id
            }),
            { status: 200 }
        )
    } catch (error) {
        console.error('Feedback API error:', error)
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500 }
        )
    }
}

// Get all feedback for admin
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url)
        const limit = parseInt(searchParams.get('limit') || '50')
        const feedbackType = searchParams.get('type') || 'all' // all, app, product
        
        const whereClause = feedbackType === 'all' ? {} : { feedbackType }
        
        const feedbacks = await prisma.userFeedback.findMany({
            where: whereClause,
            orderBy: { createdAt: 'desc' },
            take: limit
        })

        return new Response(
            JSON.stringify({
                success: true,
                feedbacks,
                total: feedbacks.length
            }),
            { status: 200 }
        )
    } catch (error) {
        console.error('Feedback API error:', error)
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500 }
        )
    }
}
