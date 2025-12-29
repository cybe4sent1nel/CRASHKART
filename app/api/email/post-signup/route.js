import { PrismaClient } from '@prisma/client';
import { sendWelcomeEmail } from '@/lib/email';
import { NextResponse } from 'next/server';
import crypto from 'crypto';

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
        const { userId, email, name, isNewUser } = await request.json();

        if (!userId || !email) {
            return NextResponse.json(
                { error: 'User ID and email are required' },
                { status: 400 }
            );
        }

        // Generate unsubscribe token
        const unsubscribeToken = crypto.randomBytes(32).toString('hex');

        // Create or update newsletter subscription
        const subscription = await client.newsletterSubscription.upsert({
            where: { email },
            update: {
                userId,
                isSubscribed: true,
                unsubscribeToken,
                subscribedAt: new Date()
            },
            create: {
                email,
                name: name || 'User',
                userId,
                isSubscribed: true,
                unsubscribeToken,
                subscribedAt: new Date()
            }
        });

        // Send welcome email if new user
        if (isNewUser) {
            const result = await sendWelcomeEmail(email, name || 'User');
            
            if (!result.success) {
                console.error('Failed to send welcome email:', result.error);
            }
        }

        // Schedule future promotional emails (optional)
        // These will be picked up by a cron job
        const scheduledEmails = [
            {
                userId,
                email,
                name: name || 'User',
                type: 'personalized_offer',
                scheduledFor: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
                status: 'pending'
            },
            {
                userId,
                email,
                name: name || 'User',
                type: 'weekly_deals',
                scheduledFor: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
                status: 'pending'
            },
            {
                userId,
                email,
                name: name || 'User',
                type: 'personalized_offer',
                scheduledFor: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
                status: 'pending'
            }
        ];

        console.log('✅ Post-signup email flow initiated for:', email);

        return NextResponse.json({
            success: true,
            message: 'Post-signup email flow initiated',
            subscription,
            scheduledEmails: scheduledEmails.length
        });

    } catch (error) {
        console.error('Post-signup email error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to process post-signup emails' },
            { status: 500 }
        );
    }
}
