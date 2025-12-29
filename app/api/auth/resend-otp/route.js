import { PrismaClient } from '@prisma/client';
import { sendOTPEmail } from '@/lib/email';
import twilio from 'twilio';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Singleton PrismaClient instance
let prisma;

function getPrismaClient() {
    if (!prisma) {
        prisma = new PrismaClient();
    }
    return prisma;
}

const DEMO_MODE = process.env.DEMO_MODE === 'true' || false;
const DEMO_OTP = '123456';
const RESEND_COOLDOWN_SECONDS = 30; // 30 seconds between resends

// Configure Twilio
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

async function sendEmailOTP(email, otp) {
    try {
        if (DEMO_MODE) {
            console.log(`[DEMO] Email OTP for ${email}: ${otp}`);
            return true;
        }
        const result = await sendOTPEmail(email, otp);
        return result.success;
    } catch (error) {
        console.error('Email sending error:', error);
        return false;
    }
}

async function sendWhatsAppOTP(phone, otp) {
    try {
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
            body: `Your CRASHKART verification code is: ${otp}. Valid for 10 minutes.`,
            from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
            to: `whatsapp:${phone}`
        });
        return true;
    } catch (error) {
        console.error('WhatsApp error:', error);
        return false;
    }
}

function formatPhoneForTwilio(phone) {
    const cleanPhone = phone.replace(/[\s-]/g, '');
    return cleanPhone.startsWith('+') ? cleanPhone : '+' + cleanPhone;
}

export async function POST(request) {
    const client = getPrismaClient();

    try {
        const { userId, method } = await request.json();

        if (!userId || !method || !['email', 'whatsapp'].includes(method)) {
            return NextResponse.json(
                { error: 'User ID and valid method are required' },
                { status: 400 }
            );
        }

        // Get user and contact info
        const user = await client.user.findUnique({
            where: { id: userId }
        });

        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        // Get contact based on method
        const contact = method === 'email' ? user.email : user.phone;

        if (!contact) {
            return NextResponse.json(
                { error: `No ${method} on file` },
                { status: 400 }
            );
        }

        // Check cooldown: find the last OTP session for this contact
        const lastOTP = await client.OTPSession.findFirst({
            where: {
                contact,
                method
            },
            orderBy: { createdAt: 'desc' },
            take: 1
        });

        if (lastOTP) {
            const secondsSinceLastOTP = (Date.now() - new Date(lastOTP.createdAt).getTime()) / 1000;
            if (secondsSinceLastOTP < RESEND_COOLDOWN_SECONDS) {
                const remainingSeconds = Math.ceil(RESEND_COOLDOWN_SECONDS - secondsSinceLastOTP);
                return NextResponse.json(
                    {
                        error: `Please wait ${remainingSeconds} seconds before requesting a new OTP`,
                        retryAfter: remainingSeconds
                    },
                    { status: 429 }
                );
            }
        }

        // Generate new OTP
        const otp = generateOTP();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Create new OTP session
        const otpSession = await client.OTPSession.create({
            data: {
                userId,
                otp,
                method,
                contact,
                expiresAt
            }
        });

        // Send OTP
        let sent = false;
        if (method === 'email') {
            sent = await sendEmailOTP(contact, otp);
        } else {
            const formattedPhone = formatPhoneForTwilio(contact);
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
            message: `OTP resent to ${contact}`,
            ...(DEMO_MODE && { demoOtp: otp })
        });

    } catch (error) {
        console.error('Resend OTP error:', {
            message: error.message,
            code: error.code,
            stack: error.stack
        });

        return NextResponse.json(
            { error: error.message || 'Failed to resend OTP' },
            { status: 500 }
        );
    }
}
