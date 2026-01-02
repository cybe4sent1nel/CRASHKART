import { PrismaClient } from '@prisma/client';
import { sendOTPEmail } from '@/lib/email';
import twilio from 'twilio';
import { NextResponse } from 'next/server';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

// Singleton PrismaClient instance
let prisma;

function getPrismaClient() {
    if (!prisma) {
        prisma = new PrismaClient();
    }
    return prisma;
}

// IMPORTANT: Set to false for production with real email/SMS
const DEMO_MODE = process.env.DEMO_MODE === 'true' || false;
const DEMO_OTP = '123456';

// Configure Twilio for WhatsApp (lazy initialization)
let twilioClient;
function getTwilioClient() {
    if (!twilioClient && process.env.TWILIO_ACCOUNT_SID) {
        twilioClient = twilio(
            process.env.TWILIO_ACCOUNT_SID,
            process.env.TWILIO_AUTH_TOKEN
        );
    }
    return twilioClient;
}

function generateOTP() {
    if (DEMO_MODE) {
        return DEMO_OTP;
    }
    return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendEmailOTP(email, otp, name = 'User') {
    try {
        // In demo mode, just log and return success
        if (DEMO_MODE) {
            console.log(`[DEMO] Email OTP for ${email}: ${otp}`);
            return true;
        }

        // Use the new email service
        const result = await sendOTPEmail(email, otp, name);
        return result.success;
    } catch (error) {
        console.error('Email sending error:', error);
        return false;
    }
}

async function sendWhatsAppOTP(phone, otp, name = 'User') {
    try {
        // In demo mode, just log and return success
        if (DEMO_MODE) {
            console.log(`[DEMO] WhatsApp OTP for ${phone}: ${otp}`);
            return true;
        }

        const client = getTwilioClient();
        if (!client) {
            console.error('Twilio not configured');
            return false;
        }

        await client.messages.create({
            body: `Hi ${name}, Your CRASHKART verification code is: ${otp}. Valid for 10 minutes. Do not share this code.`,
            from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
            to: `whatsapp:+${phone}`
        });
        return true;
    } catch (error) {
        console.error('WhatsApp error:', error);
        return false;
    }
}

function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function validatePhone(phone) {
    // Remove spaces and dashes, ensure it's digits only with optional + prefix
    const cleanPhone = phone.replace(/[\s-]/g, '');
    return /^\+?\d{10,15}$/.test(cleanPhone);
}

function formatPhoneForTwilio(phone) {
    // Remove spaces and dashes
    const cleanPhone = phone.replace(/[\s-]/g, '');
    // Add + prefix if not present
    return cleanPhone.startsWith('+') ? cleanPhone : '+' + cleanPhone;
}

function generateObjectId() {
    // Generate a MongoDB ObjectId-compatible string (24 hex characters)
    return crypto.randomBytes(12).toString('hex');
}

export async function POST(request) {
    const client = getPrismaClient();
    
    try {
        const { email, phone, method } = await request.json();

        if (!method || !['email', 'whatsapp'].includes(method)) {
            return NextResponse.json(
                { error: 'Invalid method' },
                { status: 400 }
            );
        }

        // Validate email or phone
        if (method === 'email') {
            if (!email || !validateEmail(email)) {
                return NextResponse.json(
                    { error: 'Valid email is required' },
                    { status: 400 }
                );
            }
        } else {
            if (!phone || !validatePhone(phone)) {
                return NextResponse.json(
                    { error: 'Valid phone number is required (10-15 digits)' },
                    { status: 400 }
                );
            }
        }

        const otp = generateOTP();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Only create OTPSession, don't create user yet
        // User verification happens after OTP is confirmed
        try {
            // Check if user exists
            let user = null;
            const contact = method === 'email' ? email : phone;
            
            if (method === 'email') {
                user = await client.user.findUnique({
                    where: { email }
                });
            } else {
                user = await client.user.findUnique({
                    where: { phone }
                });
            }

            // Create OTP session (will fail if duplicate unexpired OTP exists)
            const otpSession = await client.OTPSession.create({
                data: {
                    userId: user?.id || generateObjectId(), // Use temp ID if user doesn't exist
                    otp,
                    method,
                    contact,
                    expiresAt
                }
            });

            // Send OTP
            let sent = false;
            if (method === 'email') {
                sent = await sendEmailOTP(email, otp);
            } else {
                const formattedPhone = formatPhoneForTwilio(phone);
                sent = await sendWhatsAppOTP(formattedPhone, otp);
            }

            if (!sent) {
                // Delete the session if sending failed
                await client.OTPSession.delete({
                    where: { id: otpSession.id }
                });
                
                return NextResponse.json(
                    { error: 'Failed to send OTP. Please try again.' },
                    { status: 500 }
                );
            }

            return NextResponse.json({
                success: true,
                userId: otpSession.userId,
                message: user ? 'Account already exists. OTP sent for login.' : `OTP sent to ${contact}`,
                alreadyExists: Boolean(user),
                // In demo mode, return OTP for display
                ...(DEMO_MODE && { demoOtp: otp })
            });

        } catch (dbError) {
            // Handle database-specific errors
            if (dbError.code === 'P2002') {
                return NextResponse.json(
                    { error: 'OTP already sent. Please wait before requesting again.' },
                    { status: 429 }
                );
            }
            throw dbError;
        }

    } catch (error) {
        console.error('Send OTP error:', {
            message: error.message,
            code: error.code,
            stack: error.stack
        });
        
        return NextResponse.json(
            { error: error.message || 'Failed to send OTP' },
            { status: 500 }
        );
    }
}
