// DEPRECATED: This is the old Stripe webhook handler
// Now using Cashfree webhook handler at: /api/payments/cashfree-webhook

import { NextResponse } from 'next/server'

export async function POST(req) {
  return NextResponse.json(
    { 
      error: 'Stripe webhook deprecated. Use /api/payments/cashfree-webhook instead.',
      message: 'Payment integration has been migrated to Cashfree'
    },
    { status: 410 }
  )
}
