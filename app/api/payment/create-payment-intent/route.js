// DEPRECATED: This is the old Stripe payment intent handler
// Now using Cashfree order creation at: /api/payments/cashfree-order

import { NextResponse } from 'next/server'

export async function POST(req) {
  return NextResponse.json(
    { 
      error: 'Stripe payment intent deprecated. Use /api/payments/cashfree-order instead.',
      message: 'Payment integration has been migrated to Cashfree'
    },
    { status: 410 }
  )
}
