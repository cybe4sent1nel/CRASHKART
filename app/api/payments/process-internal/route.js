/**
 * DEPRECATED: This endpoint is no longer used
 * 
 * Cashfree v2023-08-01 does NOT support programmatic payment processing.
 * The correct flow is:
 * 1. Create order via /pg/orders → Get payment_session_id
 * 2. Redirect user to Cashfree hosted checkout: https://payments-test.cashfree.com/?sessionId={sessionId}
 * 3. Wait for webhook confirmation at /api/payments/cashfree-webhook
 * 
 * This endpoint attempted to call a non-existent /pg/orders/sessions endpoint
 * which caused session ID corruption and payment failures.
 * 
 * Use InternalPaymentWrapper component instead (which redirects to hosted checkout).
 */

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(req) {
    return Response.json(
        {
            message: 'This endpoint is deprecated. Use Cashfree hosted checkout instead.',
            info: {
                flow: [
                    '1. POST /api/payments/cashfree-order to get payment_session_id',
                    '2. Redirect to https://payments-test.cashfree.com/?sessionId={sessionId}',
                    '3. Wait for webhook at /api/payments/cashfree-webhook'
                ],
                component: 'InternalPaymentWrapper (components/InternalPayment.jsx)',
                reason: 'Cashfree API v2023-08-01 does not support /pg/orders/sessions endpoint'
            }
        },
        { status: 410 } // Gone - resource no longer available
    )
}
