import { PrismaClient } from '@prisma/client';
import { sendBulkNewsletterEmail } from '@/lib/email';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

let prisma;

function getPrismaClient() {
    if (!prisma) {
        prisma = new PrismaClient();
    }
    return prisma;
}

// Verify authorization (you should add proper auth check)
function isAuthorized(request) {
    const authHeader = request.headers.get('authorization');
    const adminToken = process.env.ADMIN_NEWSLETTER_TOKEN;
    return adminToken && authHeader === `Bearer ${adminToken}`;
}

export async function POST(request) {
    const client = getPrismaClient();
    
    try {
        // Check authorization
        if (!isAuthorized(request)) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { title, headline, discount, discountCode, featuredProducts, bannerImage } = await request.json();

        if (!title || !discount) {
            return NextResponse.json(
                { error: 'Title and discount are required' },
                { status: 400 }
            );
        }

        // Get all subscribed users
        const subscribers = await client.newsletterSubscription.findMany({
            where: { isSubscribed: true },
            select: {
                email: true,
                name: true
            }
        });

        if (subscribers.length === 0) {
            return NextResponse.json({
                success: true,
                message: 'No subscribers to send to',
                sent: 0
            });
        }

        // Send promotional emails
        const promoData = {
            title,
            headline,
            discount,
            discountCode,
            featuredProducts: featuredProducts || [],
            bannerImage
        };

        const results = await sendBulkNewsletterEmail(subscribers, promoData);

        const successCount = results.filter(r => r.success).length;

        console.log(`Newsletter sent to ${successCount}/${subscribers.length} subscribers`);

        return NextResponse.json({
            success: true,
            message: `Promotional email sent to ${successCount} subscribers`,
            sent: successCount,
            total: subscribers.length,
            results
        });

    } catch (error) {
        console.error('Send promotional email error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to send promotional emails' },
            { status: 500 }
        );
    }
}
