import { PrismaClient } from '@prisma/client';
import { sendBulkWeeklyDealsEmail } from '@/lib/email';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

let prisma;

function getPrismaClient() {
    if (!prisma) {
        prisma = new PrismaClient();
    }
    return prisma;
}

// Verify authorization
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

        const { dealsData } = await request.json();

        if (!dealsData) {
            return NextResponse.json(
                { error: 'Deals data is required' },
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

        // Send weekly deals emails
        const results = await sendBulkWeeklyDealsEmail(subscribers, dealsData);

        const successCount = results.filter(r => r.success).length;

        console.log(`Weekly deals email sent to ${successCount}/${subscribers.length} subscribers`);

        return NextResponse.json({
            success: true,
            message: `Weekly deals email sent to ${successCount} subscribers`,
            sent: successCount,
            total: subscribers.length,
            results
        });

    } catch (error) {
        console.error('Send weekly deals email error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to send weekly deals emails' },
            { status: 500 }
        );
    }
}
