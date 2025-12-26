import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Generate unique RMA number
function generateRMANumber() {
    return `RMA-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
}

export async function POST(request) {
    try {
        const formData = await request.formData()
        
        const orderId = formData.get('orderId')
        const productId = formData.get('productId')
        const issue = formData.get('issue')
        const description = formData.get('description')
        const paymentMethod = formData.get('paymentMethod')
        const bankAccountNo = formData.get('bankAccountNo')
        const ifscCode = formData.get('ifscCode')
        
        // Get images
        const images = formData.getAll('images')

        // Validate required fields
        if (!orderId || !productId || !issue || !description) {
            return NextResponse.json(
                { message: 'Missing required fields' },
                { status: 400 }
            )
        }

        // Get order details
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: { orderItems: true }
        })

        if (!order) {
            return NextResponse.json(
                { message: 'Order not found' },
                { status: 404 }
            )
        }

        // Find the product item in order
        const orderItem = order.orderItems.find(item => item.productId === productId)
        if (!orderItem) {
            return NextResponse.json(
                { message: 'Product not found in order' },
                { status: 404 }
            )
        }

        // Calculate refund amount
        const refundAmount = orderItem.price * orderItem.quantity

        // Create return request
        const returnRequest = await prisma.returnRequest.create({
            data: {
                orderId,
                userId: order.userId,
                productId,
                quantity: orderItem.quantity,
                issue,
                description,
                images: images.length > 0 ? images.map((_, i) => `return-image-${orderId}-${i}`) : [],
                refundAmount,
                refundMethod: paymentMethod === 'CASHFREE' ? 'cashfree' : 'cod',
                bankAccountNo: bankAccountNo || null,
                ifscCode: ifscCode || null,
                rmaNumber: generateRMANumber(),
                status: 'requested'
            }
        })

        // Update order with return request
        await prisma.order.update({
            where: { id: orderId },
            data: { returnRequest: { connect: { id: returnRequest.id } } }
        })

        console.log(`Return request created: ${returnRequest.rmaNumber}`)

        return NextResponse.json({
            message: 'Return request created successfully',
            rmaNumber: returnRequest.rmaNumber,
            refundAmount
        }, { status: 201 })

    } catch (error) {
        console.error('Error creating return request:', error)
        return NextResponse.json(
            { message: 'Failed to create return request: ' + error.message },
            { status: 500 }
        )
    }
}
