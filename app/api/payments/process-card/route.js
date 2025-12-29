export async function POST(req) {
    try {
        const body = await req.json()
        const {
            subtotal,
            discount,
            total,
            items,
            selectedAddressId,
            mobileNumber,
            appliedCoupon,
            paymentMethodId, // Token from Stripe Elements
            paymentDetails   // For demo mode fallback
        } = body

        // Demo mode - simulate payment processing for card payments
        console.log('Running in DEMO MODE - Using Cashfree for real card payments')
        
        // Simulate card processing with 90% success rate
        const isSuccessful = Math.random() > 0.1
        
        if (isSuccessful) {
            const orderId = `ORD-${Date.now()}`
            const transactionId = `DEMO-${Date.now()}`
            
            return Response.json(
                {
                    success: true,
                    orderId: orderId,
                    transactionId: transactionId,
                    message: 'Payment successful (Demo Mode)',
                    isDemoMode: true
                },
                { status: 200 }
            )
        } else {
            return Response.json(
                { message: 'Card declined. Please try another card.' },
                { status: 400 }
            )
        }

    } catch (error) {
        console.error('Card Payment Error:', error.message)
        return Response.json(
            { message: error.message || 'Payment processing failed' },
            { status: 500 }
        )
    }
}
