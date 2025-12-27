import { PrismaClient } from '@prisma/client'
import { NextResponse } from 'next/server'

const prisma = new PrismaClient()

export async function POST(req) {
    try {
        const body = await req.json()
        const { orderId, isPaid } = body

        if (!orderId || isPaid === undefined) {
            return NextResponse.json(
                { error: 'Missing orderId or isPaid' },
                { status: 400 }
            )
        }

        // Update the order payment status
        const updatedOrder = await prisma.order.update({
            where: { id: orderId },
            data: { 
                isPaid: isPaid,
                // If marking as paid, update the notes to include payment timestamp
                ...(isPaid && {
                    notes: JSON.stringify({
                        paidAt: new Date().toISOString(),
                        paidBy: 'admin'
                    })
                })
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

        return NextResponse.json({
            success: true,
            message: `Payment status updated to ${isPaid ? 'Paid' : 'Pending'}`,
            order: updatedOrder
        })
    } catch (error) {
        console.error('Error updating payment status:', error)
        return NextResponse.json(
            { error: 'Failed to update payment status', details: error.message },
            { status: 500 }
        )
    }
}
