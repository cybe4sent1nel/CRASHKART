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
        const { token, preferences } = await request.json();

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

        // Update preferences
        const updated = await client.newsletterSubscription.update({
            where: { unsubscribeToken: token },
            data: {
                interests: Object.keys(preferences).filter(key => preferences[key])
            }
        });

        console.log(`✅ Preferences updated for ${subscription.email}`);

        return NextResponse.json({
            success: true,
            message: 'Preferences saved successfully',
            preferences: updated.interests
        });

    } catch (error) {
        console.error('Manage preferences error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to manage preferences' },
            { status: 500 }
        );
    }
}
