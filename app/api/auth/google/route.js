import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';
import { sendWelcomeEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

export async function POST(request) {
    try {
        const { googleId, email, name, image } = await request.json();

        if (!googleId || !email || !name) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Check if user exists with Google ID
        let user = await prisma.user.findUnique({
            where: { googleId }
        });

        // If not, check by email
        if (!user) {
            user = await prisma.user.findUnique({
                where: { email }
            });

            // If exists, update Google ID
            if (user) {
                user = await prisma.user.update({
                    where: { id: user.id },
                    data: {
                        googleId,
                        loginMethod: 'google',
                        image: image || user.image
                    },
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        image: true,
                        isProfileSetup: true,
                        loginMethod: true
                    }
                });
            }
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
                    email,
                    googleId,
                    image,
                    loginMethod: 'google',
                    crashCashBalance: 100 // Welcome bonus of 100 CrashCash
                },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    image: true,
                    isProfileSetup: true,
                    loginMethod: true,
                    crashCashBalance: true
                }
            });
            
            // Send welcome email for new users
            try {
                await sendWelcomeEmail(email, name, 100);
                console.log('Welcome email sent to:', email);
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
                    crashCashBalance: true
                }
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            {
                userId: user.id,
                email: user.email,
                loginMethod: 'google'
            },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '30d' }
        );

        return NextResponse.json({
            success: true,
            user,
            token,
            requiresProfileSetup: !user.isProfileSetup
        });

    } catch (error) {
        console.error('Google auth error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
