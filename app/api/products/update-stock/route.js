'use server'
import { PrismaClient } from '@prisma/client'
import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

const prisma = new PrismaClient()

// UPDATE product stock (decrease on order, increase on cancellation)
export async function POST(request) {
    try {
        const body = await request.json()
        const {
            productId,
            quantity,
            action, // 'decrease' or 'increase'
            orderId
        } = body

        if (!productId || !quantity || !action) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            )
        }

        // Get current product
        const product = await prisma.product.findUnique({
            where: { id: productId }
        })

        if (!product) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 })
        }

        let newQuantity = product.quantity
        let wasOutOfStock = product.quantity === 0

        if (action === 'decrease') {
            // Check if sufficient stock
            if (product.quantity < quantity) {
                return NextResponse.json(
                    { error: 'Insufficient stock' },
                    { status: 400 }
                )
            }
            newQuantity = product.quantity - quantity
        } else if (action === 'increase') {
            newQuantity = product.quantity + quantity
        } else {
            return NextResponse.json(
                { error: 'Invalid action. Use "decrease" or "increase"' },
                { status: 400 }
            )
        }

        // Update product stock
        const updatedProduct = await prisma.product.update({
            where: { id: productId },
            data: {
                quantity: newQuantity,
                inStock: newQuantity > 0
            }
        })

        // If product is back in stock, send restock emails
        if (action === 'increase' && wasOutOfStock && newQuantity > 0) {
            await sendRestockNotifications(productId, product)
        }

        return NextResponse.json({
            success: true,
            product: updatedProduct,
            message: `Stock ${action}d successfully`
        })
    } catch (error) {
        console.error('Error updating stock:', error)
        return NextResponse.json({ error: 'Failed to update stock' }, { status: 500 })
    }
}

// Helper function to send restock notifications
async function sendRestockNotifications(productId, product) {
    try {
        // Get all pending notifications for this product
        const notifications = await prisma.outOfStockNotification.findMany({
            where: {
                productId,
                status: 'pending'
            }
        })

        if (notifications.length === 0) return

        const transporter = nodemailer.createTransport({
            service: process.env.EMAIL_SERVICE || 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        })

        // Send emails to all users
        for (const notification of notifications) {
            try {
                await transporter.sendMail({
                    from: `CrashKart <${process.env.EMAIL_USER}>`,
                    to: notification.userEmail,
                    subject: `✓ ${product.name} is Back in Stock!`,
                    html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
                            <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                                <div style="text-align: center; margin-bottom: 20px;">
                                    <h1 style="color: #d32f2f; margin: 0;">✓ Back in Stock!</h1>
                                </div>

                                <p style="color: #333; font-size: 16px; line-height: 1.6;">
                                    Hi ${notification.userName || 'Customer'},
                                </p>

                                <p style="color: #666; font-size: 14px; line-height: 1.8;">
                                    Great news! The product you were waiting for is now available:
                                </p>

                                <div style="background: #f0f7ff; padding: 20px; border-left: 4px solid #d32f2f; margin: 20px 0; border-radius: 4px; text-align: center;">
                                    <h3 style="margin: 0 0 10px 0; color: #333;">${product.name}</h3>
                                    <p style="color: #666; margin: 10px 0;">
                                        Price: <strong style="font-size: 20px; color: #d32f2f;">₹${product.price}</strong>
                                    </p>
                                    <p style="color: #999; margin: 5px 0; font-size: 12px;">
                                        ${product.quantity} items available
                                    </p>
                                </div>

                                <div style="text-align: center; margin: 30px 0;">
                                    <a href="${process.env.NEXT_PUBLIC_APP_URL}/product/${product.id}" style="background-color: #d32f2f; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">
                                        Buy Now
                                    </a>
                                </div>

                                <p style="color: #666; font-size: 12px; line-height: 1.6; border-top: 1px solid #eee; padding-top: 15px; text-align: center;">
                                    Don't miss out - stock is limited and going fast!
                                </p>
                            </div>

                            <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
                                <p>© 2025 CrashKart. All rights reserved.</p>
                            </div>
                        </div>
                    `
                })

                // Mark notification as notified
                await prisma.outOfStockNotification.update({
                    where: { id: notification.id },
                    data: {
                        status: 'notified',
                        notifiedAt: new Date()
                    }
                })

                console.log(`Restock email sent to ${notification.userEmail}`)
            } catch (error) {
                console.error(`Failed to send email to ${notification.userEmail}:`, error)
            }
        }
    } catch (error) {
        console.error('Error sending restock notifications:', error)
    }
}
