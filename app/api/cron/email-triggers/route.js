/**
 * Cron Job API for Email Triggers
 * Call this endpoint periodically (e.g., every hour) to send automated emails
 * Example: https://your-app.com/api/cron/email-triggers?token=YOUR_CRON_SECRET
 */

import { triggerPromotionalEmails, triggerAbandonedCartEmails } from '@/lib/emailTriggerService';

const CRON_SECRET = process.env.CRON_SECRET || 'default-secret';

export async function GET(req) {
    try {
        // Verify cron token for security
        const { searchParams } = new URL(req.url);
        const token = searchParams.get('token');
        
        if (token !== CRON_SECRET) {
            return Response.json(
                { message: 'Unauthorized' },
                { status: 401 }
            );
        }

        console.log('🔄 Email Trigger Cron Job Started');
        
        const results = {
            timestamp: new Date().toISOString(),
            promotionalEmails: 0,
            abandonedCartEmails: 0,
            errors: []
        };

        // Send promotional emails based on schedule
        try {
            const sentPromo = await triggerPromotionalEmails();
            results.promotionalEmails = sentPromo;
            console.log(`✅ Promotional emails triggered: ${sentPromo}`);
        } catch (error) {
            console.error('❌ Promotional email error:', error);
            results.errors.push(`Promotional emails: ${error.message}`);
        }

        // Send abandoned cart emails
        try {
            const sentAbandonedCart = await triggerAbandonedCartEmails();
            results.abandonedCartEmails = sentAbandonedCart;
            console.log(`✅ Abandoned cart emails triggered: ${sentAbandonedCart}`);
        } catch (error) {
            console.error('❌ Abandoned cart email error:', error);
            results.errors.push(`Abandoned cart emails: ${error.message}`);
        }

        console.log('🎉 Email Trigger Cron Job Completed');

        return Response.json(results, { status: 200 });
    } catch (error) {
        console.error('Cron Job Error:', error);
        return Response.json(
            { message: 'Cron job failed', error: error.message },
            { status: 500 }
        );
    }
}

export async function POST(req) {
    // Also support POST requests
    return GET(req);
}
