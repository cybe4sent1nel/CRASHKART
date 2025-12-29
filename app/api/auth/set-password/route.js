import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';

let prisma;

function getPrismaClient() {
    if (!prisma) {
        prisma = new PrismaClient();
    }
    return prisma;
}

/**
 * POST /api/auth/set-password
 * Set password for a user (used in profile after OTP verification)
 */
export async function POST(request) {
    const client = getPrismaClient();

    try {
        const { userId, password, confirmPassword, currentPassword } = await request.json();

        // Validate inputs
        if (!userId) {
            return NextResponse.json(
                { success: false, error: 'User ID is required' },
                { status: 400 }
            );
        }

        if (!password || !confirmPassword) {
            return NextResponse.json(
                { success: false, error: 'Password and confirmation are required' },
                { status: 400 }
            );
        }

        if (password !== confirmPassword) {
            return NextResponse.json(
                { success: false, error: 'Passwords do not match' },
                { status: 400 }
            );
        }

        if (password.length < 8) {
            return NextResponse.json(
                { success: false, error: 'Password must be at least 8 characters long' },
                { status: 400 }
            );
        }

        // Password strength validation
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
        if (!passwordRegex.test(password)) {
            return NextResponse.json(
                { success: false, error: 'Password must contain uppercase, lowercase, number, and special character' },
                { status: 400 }
            );
        }

        // Find user
        const user = await client.user.findUnique({
            where: { id: userId }
        });

        if (!user) {
            return NextResponse.json(
                { success: false, error: 'User not found' },
                { status: 404 }
            );
        }

        // If user already has a password, verify current password
        if (user.password && currentPassword) {
            const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
            if (!isPasswordValid) {
                return NextResponse.json(
                    { success: false, error: 'Current password is incorrect' },
                    { status: 400 }
                );
            }
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Update user password and login method
        const updatedUser = await client.user.update({
            where: { id: userId },
            data: {
                password: hashedPassword,
                loginMethod: 'password'
            },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                image: true,
                isProfileSetup: true
            }
        });

        return NextResponse.json({
            success: true,
            message: 'Password set successfully',
            user: updatedUser
        });

    } catch (error) {
        console.error('Set password error:', {
            message: error.message,
            stack: error.stack
        });

        return NextResponse.json(
            { success: false, error: error.message || 'An error occurred' },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/auth/set-password
 * Change password (for logged-in users)
 */
export async function PUT(request) {
    const client = getPrismaClient();

    try {
        const { userId, currentPassword, newPassword, confirmPassword } = await request.json();

        if (!userId || !currentPassword || !newPassword || !confirmPassword) {
            return NextResponse.json(
                { success: false, error: 'All fields are required' },
                { status: 400 }
            );
        }

        if (newPassword !== confirmPassword) {
            return NextResponse.json(
                { success: false, error: 'New passwords do not match' },
                { status: 400 }
            );
        }

        if (newPassword.length < 8) {
            return NextResponse.json(
                { success: false, error: 'Password must be at least 8 characters long' },
                { status: 400 }
            );
        }

        // Password strength validation
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
        if (!passwordRegex.test(newPassword)) {
            return NextResponse.json(
                { success: false, error: 'Password must contain uppercase, lowercase, number, and special character' },
                { status: 400 }
            );
        }

        // Find user
        const user = await client.user.findUnique({
            where: { id: userId }
        });

        if (!user) {
            return NextResponse.json(
                { success: false, error: 'User not found' },
                { status: 404 }
            );
        }

        // Verify current password
        if (!user.password) {
            return NextResponse.json(
                { success: false, error: 'User does not have a password set' },
                { status: 400 }
            );
        }

        const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isPasswordValid) {
            return NextResponse.json(
                { success: false, error: 'Current password is incorrect' },
                { status: 401 }
            );
        }

        // Don't allow same password
        const isSamePassword = await bcrypt.compare(newPassword, user.password);
        if (isSamePassword) {
            return NextResponse.json(
                { success: false, error: 'New password must be different from current password' },
                { status: 400 }
            );
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 12);

        // Update password
        await client.user.update({
            where: { id: userId },
            data: { password: hashedPassword }
        });

        return NextResponse.json({
            success: true,
            message: 'Password changed successfully'
        });

    } catch (error) {
        console.error('Change password error:', {
            message: error.message,
            stack: error.stack
        });

        return NextResponse.json(
            { success: false, error: error.message || 'An error occurred' },
            { status: 500 }
        );
    }
}
