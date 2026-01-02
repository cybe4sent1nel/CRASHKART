import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { generateUserToken } from '@/lib/authTokens';

export const dynamic = 'force-dynamic';

let prisma;

function getPrismaClient() {
    if (!prisma) {
        prisma = new PrismaClient();
    }
    return prisma;
}

/**
 * POST /api/auth/password-login
 * Login with email/phone and password
 */
export async function POST(request) {
    const client = getPrismaClient();

    try {
        const { email, phone, password } = await request.json();

        const normalizedEmail = email ? email.toLowerCase().trim() : null;

        if (!password) {
            return NextResponse.json(
                { success: false, error: 'Password is required' },
                { status: 400 }
            );
        }

        if (!normalizedEmail && !phone) {
            return NextResponse.json(
                { success: false, error: 'Email or phone is required' },
                { status: 400 }
            );
        }

        // Find user by email or phone
        let user = null;
        if (normalizedEmail) {
            user = await client.user.findUnique({
                where: { email: normalizedEmail }
            });
        } else if (phone) {
            user = await client.user.findUnique({
                where: { phone }
            });
        }

        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Invalid email/phone or password' },
                { status: 401 }
            );
        }

        // Check if user has password set
        if (!user.password) {
            return NextResponse.json(
                { success: false, error: 'This account does not have a password. Please use OTP login or reset password.' },
                { status: 400 }
            );
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return NextResponse.json(
                { success: false, error: 'Invalid email/phone or password' },
                { status: 401 }
            );
        }

        // Generate JWT token
        const token = generateUserToken(user)

        // Return user data (excluding password)
        const { password: _, ...userWithoutPassword } = user;

        return NextResponse.json({
            success: true,
            message: 'Login successful',
            user: userWithoutPassword,
            token,
            requiresProfileSetup: !user.isProfileSetup
        });

    } catch (error) {
        console.error('Password login error:', {
            message: error.message,
            stack: error.stack
        });

        return NextResponse.json(
            { success: false, error: error.message || 'An error occurred' },
            { status: 500 }
        );
    }
}
