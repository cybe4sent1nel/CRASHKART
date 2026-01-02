import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
import { NextResponse } from 'next/server';
import { sendWelcomeEmail } from '@/lib/email';
import { generateUserToken } from '@/lib/authTokens';
import { createCrashCashReward } from '@/lib/rewards';

export const dynamic = 'force-dynamic';

export async function POST(request) {
    try {
        const { googleId, email, name, image } = await request.json();
        const normalizedEmail = email?.toLowerCase();

        if (!googleId || !normalizedEmail || !name) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Check if user exists with Google ID
        let user = await prisma.user.findUnique({
            where: { googleId }
        });

        let alreadyExists = false

        // If not, check by email
        if (!user) {
            user = await prisma.user.findUnique({
                where: { email: normalizedEmail }
            });

            // If exists, update Google ID
            if (user) {
                alreadyExists = true
                user = await prisma.user.update({
                    where: { id: user.id },
                    data: {
                        googleId,
                        email: normalizedEmail,
                        loginMethod: 'google',
                        image: image || user.image
                    },
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        image: true,
                        isProfileSetup: true,
                        loginMethod: true,
                        sessionVersion: true
                    }
                });
            }
        } else {
            alreadyExists = true
        }

        // Create user if doesn't exist (new signup - give welcome bonus)
        let isNewUser = false;
        if (!user) {
            isNewUser = true;
            const id = require('crypto').randomUUID();
            user = await prisma.user.create({
                data: {
                    id,
                    name,
                    email: normalizedEmail,
                    googleId,
                    image,
                    loginMethod: 'google',
                    crashCashBalance: 0 // will be updated via reward credit
                },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    image: true,
                    isProfileSetup: true,
                    loginMethod: true,
                    sessionVersion: true,
                    crashCashBalance: true
                }
            });

            // Credit welcome CrashCash as an actual reward so balance queries reflect it
            try {
                await createCrashCashReward({ userId: user.id, amount: 1000, source: 'welcome_bonus' })
                // Re-fetch to include updated balance
                user = await prisma.user.findUnique({
                    where: { id: user.id },
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        image: true,
                        isProfileSetup: true,
                        loginMethod: true,
                        sessionVersion: true,
                        crashCashBalance: true
                    }
                })
            } catch (rewardError) {
                console.error('Failed to credit welcome CrashCash:', rewardError)
            }
            
            // Send welcome email for new users
            try {
                await sendWelcomeEmail(normalizedEmail, name, 100);
                console.log('Welcome email sent to:', normalizedEmail);
            } catch (emailError) {
                console.error('Failed to send welcome email:', emailError);
                // Continue even if email fails
            }
        } else {
            // For existing users, ensure crashCashBalance is included
            user = await prisma.user.findUnique({
                where: { id: user.id },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    image: true,
                    isProfileSetup: true,
                    loginMethod: true,
                    sessionVersion: true,
                    crashCashBalance: true
                }
            });
        }

        // Generate JWT token
        const token = generateUserToken(user, { loginMethod: 'google' })

        return NextResponse.json({
            success: true,
            user,
            token,
            requiresProfileSetup: !user.isProfileSetup,
            alreadyExists,
            message: alreadyExists ? 'Account already exists. Signed you in.' : 'Signup successful.'
        });

    } catch (error) {
        console.error('Google auth error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
