import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Update app feedback/review
export async function PATCH(request, context) {
    try {
        const params = await context.params
        const { id } = params
        const { rating, message } = await request.json()

        if (!id) {
            return new Response(
                JSON.stringify({ error: 'Feedback ID is required' }),
                { status: 400 }
            )
        }

        // Update the feedback
        const updatedFeedback = await prisma.userFeedback.update({
            where: { id },
            data: {
                ...(rating && { rating }),
                ...(message && { message })
            }
        })

        return new Response(
            JSON.stringify({
                success: true,
                feedback: updatedFeedback
            }),
            { status: 200 }
        )
    } catch (error) {
        console.error('Update feedback error:', error)
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500 }
        )
    }
}

// Delete app feedback/review
export async function DELETE(request, context) {
    try {
        const params = await context.params
        const { id } = params

        if (!id) {
            return new Response(
                JSON.stringify({ error: 'Feedback ID is required' }),
                { status: 400 }
            )
        }

        await prisma.userFeedback.delete({
            where: { id }
        })

        return new Response(
            JSON.stringify({
                success: true,
                message: 'Feedback deleted successfully'
            }),
            { status: 200 }
        )
    } catch (error) {
        console.error('Delete feedback error:', error)
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500 }
        )
    }
}
