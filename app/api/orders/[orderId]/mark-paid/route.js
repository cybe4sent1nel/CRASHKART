import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request, { params }) {
    try {
        const { orderId } = params
        const { paymentIntentId } = await request.json()

        // Update order as paid
        const order = await prisma.order.update({
            where: { id: orderId },
            data: {
                isPaid: true,
                status: 'PROCESSING',
                // Store payment intent ID in metadata if needed
            },
            include: {
                user: true,
                address: true,
                orderItems: {
                    include: {
                        product: true
                    }
                }
            }
        })

        // TODO: Send order confirmation email
        // TODO: Send WhatsApp notification
        // TODO: Send push notification

        console.log(`✅ Order ${orderId} marked as paid (Payment Intent: ${paymentIntentId})`)

        return NextResponse.json({
            message: 'Order marked as paid',
            order
        }, { status: 200 })

    } catch (error) {
        console.error('Error marking order as paid:', error)
        return NextResponse.json(
            { message: 'Failed to mark order as paid: ' + error.message },
            { status: 500 }
        )
    }
}
