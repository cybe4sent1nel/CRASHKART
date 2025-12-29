import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request) {
    try {
        const feedbackData = await request.json()

        // Validate feedback
        if (!feedbackData.email) {
            return new Response(
                JSON.stringify({ error: 'Email is required' }),
                { status: 400 }
            )
        }

        if (!feedbackData.feedback || feedbackData.feedback.length < 120) {
            return new Response(
                JSON.stringify({ error: 'Feedback must be at least 120 characters' }),
                { status: 400 }
            )
        }

        // Find user by email if exists
        let user = await prisma.user.findUnique({
            where: { email: feedbackData.email }
        })

        // Save to database using UserFeedback model
        const feedback = await prisma.userFeedback.create({
            data: {
                userEmail: feedbackData.email,
                userName: feedbackData.name || 'Anonymous',
                feedbackType: 'app',
                rating: parseInt(feedbackData.overallRating?.replace(/[^0-5]/g, '') || '5'),
                title: `App Feedback - ${feedbackData.overallRating || 'General'}`,
                message: JSON.stringify({
                    overallRating: feedbackData.overallRating,
                    appExperience: feedbackData.appExperience,
                    productQuality: feedbackData.productQuality,
                    deliveryExperience: feedbackData.deliveryExperience,
                    customerService: feedbackData.customerService,
                    feedback: feedbackData.feedback
                }),
                userId: user?.id,
                status: 'pending'
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
