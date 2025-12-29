import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

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
        const { token } = await request.json();

        if (!token) {
            return NextResponse.json(
                { error: 'Invalid or missing token' },
                { status: 400 }
            );
        }

        // Find subscription by unsubscribe token
        const subscription = await client.newsletterSubscription.findUnique({
            where: { unsubscribeToken: token }
        });

        if (!subscription) {
            return NextResponse.json(
                { error: 'Invalid token or subscription not found' },
                { status: 404 }
            );
        }

        // Update subscription status
        const updated = await client.newsletterSubscription.update({
            where: { unsubscribeToken: token },
            data: {
                isSubscribed: false,
                unsubscribedAt: new Date()
            }
        });

        console.log(`✅ User unsubscribed: ${subscription.email}`);

        return NextResponse.json({
            success: true,
            message: 'You have been unsubscribed from all marketing emails',
            email: updated.email
        });

    } catch (error) {
        console.error('Unsubscribe error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to unsubscribe' },
            { status: 500 }
        );
    }
}
