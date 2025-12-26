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

        // Log feedback (in production, save to database)
        console.log('📝 Feedback received:', {
            email: feedbackData.email,
            name: feedbackData.name,
            overallRating: feedbackData.overallRating,
            appExperience: feedbackData.appExperience,
            productQuality: feedbackData.productQuality,
            deliveryExperience: feedbackData.deliveryExperience,
            customerService: feedbackData.customerService,
            feedback: feedbackData.feedback,
            timestamp: new Date().toISOString()
        })

        // TODO: In production, save to database
        // await db.feedback.create({ ...feedbackData })

        return new Response(
            JSON.stringify({
                success: true,
                message: 'Feedback received successfully',
                id: `feedback_${Date.now()}`
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

// Optional: Get feedback statistics
export async function GET(request) {
    try {
        // TODO: In production, query feedback from database
        return new Response(
            JSON.stringify({
                message: 'Use POST to submit feedback',
                total_feedback: 0
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
