import { PrismaClient } from '@prisma/client';
import { sendSpecialOfferEmail } from '@/lib/email';
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

        const { email, offerData } = await request.json();

        if (!email || !offerData) {
            return NextResponse.json(
                { error: 'Email and offer data are required' },
                { status: 400 }
            );
        }

        // Send special offer email
        const result = await sendSpecialOfferEmail(email, offerData);

        if (!result.success) {
            return NextResponse.json(
                { error: 'Failed to send email: ' + result.error },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Special offer email sent successfully',
            messageId: result.messageId
        });

    } catch (error) {
        console.error('Send special offer email error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to send email' },
            { status: 500 }
        );
    }
}
