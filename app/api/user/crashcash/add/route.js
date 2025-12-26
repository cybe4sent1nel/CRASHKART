import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export async function POST(request) {
    try {
        // Get token from header
        const token = request.headers.get('authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        const userId = decoded.userId;

        // Get amount and source from body
        const { amount, source = 'scratch-card' } = await request.json();

        if (!amount || amount <= 0) {
            return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
        }

        // Update user's CrashCash balance
        const user = await prisma.user.update({
            where: { id: userId },
            data: {
                crashCashBalance: {
                    increment: amount
                }
            },
            select: {
                id: true,
                name: true,
                email: true,
                crashCashBalance: true
            }
        });

        return NextResponse.json({
            success: true,
            message: `₹${amount} CrashCash added successfully`,
            newBalance: user.crashCashBalance,
            source
        });

    } catch (error) {
        console.error('Error adding CrashCash:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
