'use server'
import { PrismaClient } from '@prisma/client'
import { NextResponse } from 'next/server'

const prisma = new PrismaClient()

// CREATE out of stock notification
export async function POST(request) {
    try {
        const body = await request.json()
        const {
            productId,
            userEmail,
            userName,
            userPhone,
            notificationType
        } = body

        // Check if already notified
        const existing = await prisma.outOfStockNotification.findUnique({
            where: {
                productId_userEmail: {
                    productId,
                    userEmail
                }
            }
        })

        if (existing) {
            return NextResponse.json(
                { error: 'You already registered for notifications on this product' },
                { status: 400 }
            )
        }

        const notification = await prisma.outOfStockNotification.create({
            data: {
                productId,
                userEmail,
                userName: userName || 'User',
                userPhone: userPhone || null,
                notificationType: notificationType || 'email',
                status: 'pending'
            }
        })

        // Send notification email
        if (notificationType === 'email' || !notificationType) {
            await sendRestockEmail(userEmail, userName, productId)
        }

        return NextResponse.json(notification, { status: 201 })
    } catch (error) {
        console.error('Error creating notification:', error)
        return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 })
    }
}

// GET notifications for a user
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url)
        const userEmail = searchParams.get('userEmail')

        if (!userEmail) {
            return NextResponse.json(
                { error: 'User email is required' },
                { status: 400 }
            )
        }

        const notifications = await prisma.outOfStockNotification.findMany({
            where: { userEmail },
            orderBy: { createdAt: 'desc' }
        })

        return NextResponse.json(notifications)
    } catch (error) {
        console.error('Error fetching notifications:', error)
        return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 })
    }
}

// Helper function to send restock email
async function sendRestockEmail(email, userName, productId) {
    try {
        // Get product details
        const product = await prisma.product.findUnique({
            where: { id: productId }
        })

        if (!product) return

        // Import nodemailer
        const nodemailer = require('nodemailer')

        const transporter = nodemailer.createTransport({
            service: process.env.EMAIL_SERVICE || 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        })

        const mailOptions = {
            from: `CrashKart <${process.env.EMAIL_USER}>`,
            to: email,
            subject: `${product.name} - Notification Registered!`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
                    <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        <div style="text-align: center; margin-bottom: 20px;">
                            <h1 style="color: #d32f2f; margin: 0;">✓ Notification Registered</h1>
                        </div>

                        <p style="color: #333; font-size: 16px; line-height: 1.6;">
                            Hi ${userName || 'Customer'},
                        </p>

                        <p style="color: #666; font-size: 14px; line-height: 1.8;">
                            Thank you for registering for restock notifications! We've noted your interest in:
                        </p>

                        <div style="background: #f9f9f9; padding: 15px; border-left: 4px solid #d32f2f; margin: 20px 0; border-radius: 4px;">
                            <h3 style="margin: 0 0 10px 0; color: #333;">${product.name}</h3>
                            <p style="color: #666; margin: 5px 0;">
                                Price: <strong>₹${product.price}</strong>
                            </p>
                        </div>

                        <p style="color: #666; font-size: 14px; line-height: 1.8;">
                            We will send you an email immediately when this product is back in stock. You won't miss out on your favorite items!
                        </p>

                        <div style="background: #d32f2f; color: white; padding: 15px; border-radius: 4px; text-align: center; margin: 20px 0;">
                            <p style="margin: 0; font-size: 14px;">
                                <strong>Expected Restock:</strong> Coming Soon
                            </p>
                        </div>

                        <p style="color: #999; font-size: 12px; line-height: 1.6; border-top: 1px solid #eee; padding-top: 15px;">
                            If you no longer want to receive notifications, you can disable them anytime from your account settings.
                        </p>

                        <div style="text-align: center; margin-top: 20px;">
                            <a href="${process.env.NEXT_PUBLIC_APP_URL}/shop" style="color: #d32f2f; text-decoration: none; font-weight: bold;">
                                Continue Shopping
                            </a>
                        </div>
                    </div>

                    <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
                        <p>© 2025 CrashKart. All rights reserved.</p>
                    </div>
                </div>
            `
        }

        await transporter.sendMail(mailOptions)
        console.log(`Notification email sent to ${email}`)
    } catch (error) {
        console.error('Error sending email:', error)
    }
}
