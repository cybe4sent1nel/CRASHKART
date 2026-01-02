import { prisma } from '@/lib/prisma'
import { verifyUserToken } from '@/lib/authTokens'

// Helper function to format phone number for Cashfree
const formatPhoneNumber = (phone) => {
    if (!phone) return ''
    
    let cleaned = phone.replace(/[^\d+]/g, '').trim()
    
    if (cleaned.startsWith('+')) {
        return cleaned
    }
    
    if (cleaned.length === 10) {
        return `+91${cleaned}`
    }
    
    if (cleaned.length === 11 && (cleaned.startsWith('8') || cleaned.startsWith('9'))) {
        return `+91${cleaned.slice(1)}`
    }
    
    if (cleaned.length >= 10) {
        return cleaned
    }
    
    return phone
}

// Helper function to sanitize and validate URLs for Cashfree
// Removes spaces, validates format, ensures proper structure
const sanitizeUrl = (url) => {
    if (!url) return ''
    
    // Remove all whitespace characters
    let cleaned = url.replace(/\s+/g, '')
    
    // Remove any accidental duplicate slashes (except in http://)
    cleaned = cleaned.replace(/([^:])(\/\/+)/g, '$1/')
    
    // Ensure proper URL structure
    try {
        const urlObj = new URL(cleaned)
        return urlObj.href
    } catch (err) {
        console.warn('⚠️ Invalid URL detected, attempting to fix:', cleaned)
        // If URL parsing fails, return the cleaned version anyway
        return cleaned
    }
}

export async function POST(req) {
    try {
        // Get user from Bearer token
        const authHeader = req.headers.get('authorization')
        
        if (!authHeader?.startsWith('Bearer ')) {
            return Response.json(
                { message: 'Unauthorized' },
                { status: 401 }
            )
        }

        const token = authHeader.slice(7)
        let user
        let userEmail

        try {
            const verified = await verifyUserToken(token)
            user = verified.user
            userEmail = user.email
        } catch (err) {
            return Response.json(
                { message: 'Invalid token' },
                { status: 401 }
            )
        }

        const body = await req.json()
        const { orderId, total, items, isCODConversion } = body

        if (!orderId || !total) {
            return Response.json(
                { message: 'Order ID and total are required' },
                { status: 400 }
            )
        }

        // Get the order to retrieve address and phone
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                address: true,
                orderItems: true
            }
        })

        if (!order) {
            return Response.json(
                { message: 'Order not found' },
                { status: 404 }
            )
        }

        // Get Cashfree credentials
        const cashfreeAppId = process.env.CASHFREE_APP_ID
        const cashfreeSecretKey = process.env.CASHFREE_SECRET_KEY
        const cashfreeEnvironment = process.env.CASHFREE_ENVIRONMENT || 'sandbox'

        if (!cashfreeAppId || !cashfreeSecretKey) {
            return Response.json(
                { message: 'Payment gateway not configured' },
                { status: 500 }
            )
        }

        const baseUrl = cashfreeEnvironment === 'production' 
            ? 'https://api.cashfree.com'
            : 'https://sandbox.cashfree.com'

        // Create Cashfree order for payment
        const cashfreeOrderId = `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        
        const formattedPhone = formatPhoneNumber(order.address?.phone || user.phone || '')
        
        // Generate and sanitize URLs
        const baseAppUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
        const notifyUrl = sanitizeUrl(`${baseAppUrl}/api/payments/cashfree-webhook`)
        // Redirect users to a dedicated payment received page after successful payment
        const returnUrl = sanitizeUrl(`${baseAppUrl}/payment-received/${orderId}`)
        
        console.log('🔗 URL Sanitization:')
        console.log('  Notify URL:', notifyUrl)
        console.log('  Return URL:', returnUrl)
        
        const orderPayload = {
            order_id: cashfreeOrderId,
            order_amount: Math.round(order.total * 100) / 100,
            order_currency: 'INR',
            customer_details: {
                customer_id: user.id,
                customer_phone: formattedPhone || '',
                customer_email: userEmail
            },
            order_meta: {
                notify_url: notifyUrl,
                return_url: returnUrl
            },
            order_note: `CrashKart Order Payment - ${isCODConversion ? 'COD Conversion' : 'Regular Payment'}`
        }

        // Create Cashfree order
        const createOrderResponse = await fetch(
            `${baseUrl}/pg/orders`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-version': '2023-08-01',
                    'x-client-id': cashfreeAppId,
                    'x-client-secret': cashfreeSecretKey
                },
                body: JSON.stringify(orderPayload)
            }
        )

        const orderResult = await createOrderResponse.json()

        if (!createOrderResponse.ok) {
            console.error('Cashfree API Error:', orderResult)
            return Response.json(
                { 
                    message: orderResult.message || 'Failed to create Cashfree order',
                    error: orderResult
                },
                { status: 400 }
            )
        }

        // Update order with Cashfree session ID
        const notes = order.notes ? JSON.parse(order.notes) : {}
        notes.paymentSessionId = orderResult.payment_session_id
        notes.cashfreeOrderId = cashfreeOrderId
        notes.paymentAttemptedAt = new Date().toISOString()

        await prisma.order.update({
            where: { id: orderId },
            data: {
                notes: JSON.stringify(notes)
            }
        })

        const paymentSessionId = orderResult.payment_session_id.trim()

        return Response.json({
            success: true,
            orderId: orderId,
            cashfreeOrderId: cashfreeOrderId,
            paymentSessionId: paymentSessionId,
            message: 'Payment session created successfully',
            total: total
        }, { status: 200 })

    } catch (error) {
        console.error('COD payment creation error:', error)
        return Response.json(
            { message: error.message || 'Payment processing failed' },
            { status: 500 }
        )
    }
}
