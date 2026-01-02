import { NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/session';
import { generateUserToken } from '@/lib/authTokens';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request) {
    try {
        const session = await getCurrentSession();

        if (!session?.user?.email) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { userId, email } = await request.json();

        // Verify the session email matches the requested email
        if (session.user.email !== email) {
            return NextResponse.json(
                { error: 'Email mismatch' },
                { status: 403 }
            );
        }

        // Fetch user from database
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                name: true,
                image: true,
                isAdmin: true,
                loginMethod: true,
                sessionVersion: true
            }
        });

        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        // Generate JWT token
        const token = generateUserToken(user, { loginMethod: user.loginMethod });

        return NextResponse.json({
            success: true,
            token
        });

    } catch (error) {
        console.error('Generate token error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

