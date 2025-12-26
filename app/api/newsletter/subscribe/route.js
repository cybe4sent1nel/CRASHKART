import { PrismaClient } from '@prisma/client';
import { sendNewsletterWelcomeEmail } from '@/lib/email';
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
        const { email, name, userId } = await request.json();

        if (!email || !email.includes('@')) {
            return NextResponse.json(
                { error: 'Valid email is required' },
                { status: 400 }
            );
        }

        // Create or update newsletter subscription
        const subscription = await client.newsletterSubscription.upsert({
            where: { email },
            update: {
                isSubscribed: true,
                subscribedAt: new Date()
            },
            create: {
                email,
                name: name || 'Subscriber',
                userId: userId || null,
                isSubscribed: true
            }
        });

        // Send welcome email
        await sendNewsletterWelcomeEmail(email, name || 'Subscriber');

        return NextResponse.json({
            success: true,
            message: 'Successfully subscribed to newsletter!',
            subscription
        });

    } catch (error) {
        console.error('Newsletter subscription error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to subscribe to newsletter' },
            { status: 500 }
        );
    }
}
