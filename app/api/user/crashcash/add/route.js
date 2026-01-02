import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/authTokens';
import { createCrashCashReward } from '@/lib/rewards';

export async function POST(request) {
    try {
        // Verify token and user session
        const { user } = await requireUser(request);
        const userId = user.id;

        // Get amount and source from body
        const { amount, source = 'scratch_card' } = await request.json();

        const normalizedSource = String(source || 'scratch_card').replace('-', '_');

        if (!amount || amount <= 0) {
            return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
        }

        // Create reward record and update user balance atomically
        const { reward, user: updatedUser } = await createCrashCashReward({
            userId,
            amount: Number(amount),
            source: normalizedSource,
        });

        return NextResponse.json({
            success: true,
            message: `₹${amount} CrashCash added successfully`,
            newBalance: updatedUser.crashCashBalance,
            reward,
            source: normalizedSource,
        });

    } catch (error) {
        if (error.name === 'AuthError') {
            return NextResponse.json({ error: error.message }, { status: error.status });
        }
        console.error('Error adding CrashCash:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
