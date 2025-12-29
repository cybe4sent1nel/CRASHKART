import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';
import { sendWelcomeEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

let prisma;

function getPrismaClient() {
    if (!prisma) {
        prisma = new PrismaClient();
    }
    return prisma;
}

export async function POST(request) {
    const client = getPrismaClient();
    
    try {
        const { userId, otp } = await request.json();

        if (!userId || !otp) {
            return NextResponse.json(
                { error: 'User ID and OTP are required' },
                { status: 400 }
            );
        }

        // Find valid OTP session
        const otpSession = await client.OTPSession.findFirst({
            where: {
                userId,
                otp,
                isUsed: false,
                expiresAt: {
                    gt: new Date()
                }
            }
        });

        if (!otpSession) {
            return NextResponse.json(
                { error: 'Invalid or expired OTP' },
                { status: 400 }
            );
        }

        // Mark OTP as used
        await client.OTPSession.update({
            where: { id: otpSession.id },
            data: { isUsed: true }
        });

        // Get or create user with createdAt to check if new user
        let user = await client.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                image: true,
                isProfileSetup: true,
                loginMethod: true,
                createdAt: true
            }
        });

        // If user doesn't exist (signup flow), create them with welcome bonus
        if (!user) {
            user = await client.user.create({
                data: {
                    id: userId,
                    email: otpSession.method === 'email' ? otpSession.contact : null,
                    phone: otpSession.method === 'whatsapp' ? otpSession.contact : null,
                    name: '',
                    isProfileSetup: false,
                    loginMethod: otpSession.method === 'email' ? 'email' : 'whatsapp',
                    crashCashBalance: 100 // Welcome bonus of 100 CrashCash
                },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                    image: true,
                    isProfileSetup: true,
                    loginMethod: true,
                    createdAt: true,
                    crashCashBalance: true
                }
            });
        } else {
            // For existing users, fetch crashCashBalance
            user = await client.user.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                    image: true,
                    isProfileSetup: true,
                    loginMethod: true,
                    createdAt: true,
                    crashCashBalance: true
                }
            });
        }

        // Check if user is new (created less than 1 minute ago)
        const isNewUser = user.createdAt && (Date.now() - new Date(user.createdAt).getTime()) < 60000;

        // Send welcome email for new users
        if (isNewUser && user.email) {
            try {
                await sendWelcomeEmail(user.email, user.name || 'User', 100);
                console.log('Welcome email sent to:', user.email);
            } catch (emailError) {
                console.error('Failed to send welcome email:', emailError);
                // Continue even if email fails
            }
        }

        // Generate JWT token
        const token = jwt.sign(
            {
                userId: user.id,
                email: user.email,
                phone: user.phone
            },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '30d' }
        );

        return NextResponse.json({
            success: true,
            user,
            token,
            requiresProfileSetup: !user.isProfileSetup,
            isNewUser,
            newUserBonus: isNewUser ? 100 : 0
        });

    } catch (error) {
        console.error('Verify OTP error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
