import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

const MAIN_ADMIN_EMAIL = 'crashkart.help@gmail.com'

// Store for 2FA codes (in production, use database)
const twoFACodes = new Map()

// Generate random 6-digit code
function generateCode() {
    return Math.floor(100000 + Math.random() * 900000).toString()
}

// Email transporter (configure with your email service)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER || MAIN_ADMIN_EMAIL,
        pass: process.env.EMAIL_PASS || ''
    }
})

export async function POST(request) {
    try {
        const { email } = await request.json()

        if (!email) {
            return NextResponse.json(
                { message: 'Email is required' },
                { status: 400 }
            )
        }

        // Check if user is admin
        // For now, only allow main admin - in production, check database
        if (email !== MAIN_ADMIN_EMAIL) {
            return NextResponse.json(
                { message: 'Only authorized admins can access this' },
                { status: 403 }
            )
        }

        // Generate code
        const code = generateCode()
        const expiresAt = Date.now() + 5 * 60 * 1000 // 5 minutes

        // Store code
        twoFACodes.set(email, {
            code,
            expiresAt,
            attempts: 0
        })

        console.log(`2FA Code for ${email}: ${code}`) // Log for development

        // Try to send email
        try {
            await transporter.sendMail({
                from: process.env.EMAIL_USER || MAIN_ADMIN_EMAIL,
                to: email,
                subject: 'CrashKart Admin Verification Code',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #ef4444;">Your Admin Verification Code</h2>
                        <p>A two-factor authentication code has been requested for your admin account.</p>
                        
                        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
                            <p style="font-size: 12px; color: #6b7280; margin: 0 0 10px 0;">Enter this code to verify your identity:</p>
                            <p style="font-size: 32px; font-weight: bold; color: #ef4444; letter-spacing: 5px; margin: 0;">${code}</p>
                            <p style="font-size: 12px; color: #9ca3af; margin: 10px 0 0 0;">This code expires in 5 minutes</p>
                        </div>

                        <p style="color: #6b7280; font-size: 14px;">
                            <strong>Security Notice:</strong> Never share this code with anyone. CrashKart will never ask you for this code via email, chat, or phone.
                        </p>

                        <p style="color: #9ca3af; font-size: 12px; margin-top: 20px;">
                            If you didn't request this code, please ignore this email and your account remains secure.
                        </p>
                    </div>
                `
            })

            console.log(`2FA email sent to ${email}`)
        } catch (emailError) {
            console.warn('Email sending failed (development mode):', emailError.message)
            // In development, continue without sending email
            // The code is logged to console above
        }

        return NextResponse.json({
            message: 'Verification code sent successfully',
            // Uncomment for development to see code:
            // code: code // REMOVE IN PRODUCTION
        }, { status: 200 })

    } catch (error) {
        console.error('Error sending 2FA code:', error)
        return NextResponse.json(
            { message: 'Failed to send verification code' },
            { status: 500 }
        )
    }
}

// Export for use in verify endpoint
export { twoFACodes }
