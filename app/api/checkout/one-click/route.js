import { NextResponse } from 'next/server'

// DEPRECATED: One-click payment was using Stripe
// Migrate to Cashfree payment flow for regular checkout

export async function POST(request) {
  return NextResponse.json(
    { 
      error: 'One-click Stripe payment deprecated. Use regular Cashfree checkout instead.',
      message: 'Payment integration has been migrated to Cashfree'
    },
    { status: 410 }
  )
}
