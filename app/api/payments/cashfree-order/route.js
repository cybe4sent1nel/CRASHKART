import { getCurrentSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { verifyUserToken } from '@/lib/authTokens'

// Prevent Next.js from attempting to pre-render this route
export const dynamic = 'force-dynamic'

// Helper function to format phone number for Cashfree
// Cashfree accepts: Indian +919090407368, 9090407368, International +16014635923
const formatPhoneNumber = (phone) => {
    if (!phone) return ''
    
    // Remove all non-numeric characters except +
    let cleaned = phone.replace(/[^\d+]/g, '').trim()
    
    // If already has country code, return as is
    if (cleaned.startsWith('+')) {
        return cleaned
    }
    
    // If 10 digits (Indian without code), add Indian code
    if (cleaned.length === 10) {
        return `+91${cleaned}`
    }
    
    // If 11 digits and starts with 8 or 9, it's likely Indian without code (11 digits somehow)
    if (cleaned.length === 11 && (cleaned.startsWith('8') || cleaned.startsWith('9'))) {
        // Remove first digit and add country code
        return `+91${cleaned.slice(1)}`
    }
    
    // If already valid (longer with country code patterns), return as is
    if (cleaned.length >= 10) {
        return cleaned
    }
    
    // Fallback: return original if we can't determine format
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
        const { authOptions } = await import('@/lib/auth')
        // Debug logging
        const authHeader = req.headers.get('authorization')
        console.log('🔍 Payment Auth Debug:')
        console.log('  Auth Header:', authHeader ? 'Present' : 'Missing')
        console.log('  JWT_SECRET:', process.env.JWT_SECRET ? 'Set' : 'Not Set')
        
        // Get user session from NextAuth or Bearer token
        let session = await getCurrentSession()
        let user = null
        let userEmail = session?.user?.email || null
        console.log('  NextAuth Session:', userEmail ? `Found: ${userEmail}` : 'Not found')

        if (userEmail) {
            user = await prisma.user.findUnique({ where: { email: userEmail } })
            if (user) {
                console.log('✅ User found by email:', user.email)
            }
        }

        // If no NextAuth session, check for Bearer token (localStorage OTP login)
        if (!user && authHeader?.startsWith('Bearer ')) {
            const token = authHeader.slice(7);
            console.log('  Token Length:', token.length);
            try {
                const verified = await verifyUserToken(token);
                user = await prisma.user.findUnique({ where: { id: verified.user.id } }) || verified.user
                userEmail = user.email
                console.log('  ✅ JWT Verified via helper:', { email: userEmail, userId: user.id })
            } catch (err) {
                console.error('  ❌ JWT verification failed:', err.message)
            }
        }
        
        if (!user) {
            console.log('  ⛔ No user email or userId found - returning 401')
            return Response.json(
                { message: 'Unauthorized' },
                { status: 401 }
            )
        }
        const userId = user.id
        console.log('  ✅ User authenticated:', { userEmail: user.email, userId })

        console.log('✅ User authenticated and found in database:', user.email || user.id)

        // Load Cashfree credentials early for duplicate detection handling
        const appId = process.env.CASHFREE_APP_ID
        const secretKey = process.env.CASHFREE_SECRET_KEY
        // Default to sandbox if CASHFREE_API_URL not set
        const baseUrl = process.env.CASHFREE_API_URL || 'https://sandbox.cashfree.com'

        if (!appId || !secretKey) {
            console.error('❌ Missing Cashfree credentials')
            return Response.json(
                { message: 'Payment gateway configuration error' },
                { status: 500 }
            )
        }

        console.log('🔐 Checking Cashfree Credentials:')
        console.log('  App ID present:', !!appId)
        console.log('  App ID (first 10 chars):', appId?.slice(0, 10))
        console.log('  Secret Key present:', !!secretKey)
        console.log('  Secret Key (first 10 chars):', secretKey?.slice(0, 10))
        console.log('💳 Cashfree Configuration:')
        console.log('  Environment:', baseUrl.includes('sandbox') ? 'SANDBOX (Testing Mode)' : 'PRODUCTION')
        console.log('  Base URL:', baseUrl)

        const body = await req.json()
        const {
            subtotal,
            discount,
            total,
            items,
            selectedAddressId,
            mobileNumber,
            appliedCoupon,
            retryPayment,
            orderId
        } = body

        // Handle retry payment for existing order
        if (retryPayment && orderId) {
            console.log('🔄 Retry payment requested for order:', orderId)
            
            // Fetch existing order
            const existingOrder = await prisma.order.findUnique({
                where: { id: orderId },
                include: {
                    user: true,
                    address: true,
                    orderItems: {
                        include: {
                            product: true
                        }
                    }
                }
            })
            
            if (!existingOrder) {
                return Response.json(
                    { message: 'Order not found' },
                    { status: 404 }
                )
            }
            
            // Verify user owns this order
            if (existingOrder.userId !== user.id) {
                return Response.json(
                    { message: 'Unauthorized to retry payment for this order' },
                    { status: 403 }
                )
            }
            
            // Create Cashfree order for retry payment
            const cashfreeAppId = process.env.CASHFREE_APP_ID
            const cashfreeSecretKey = process.env.CASHFREE_SECRET_KEY
            const baseUrl = 'https://sandbox.cashfree.com'
            
            if (!cashfreeAppId || !cashfreeSecretKey) {
                return Response.json(
                    { message: 'Payment gateway not configured' },
                    { status: 500 }
                )
            }
            
            const cashfreeOrderId = `RETRY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
            const baseAppUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
            const notifyUrl = sanitizeUrl(`${baseAppUrl}/api/payments/cashfree-webhook`)
            // Redirect users to a dedicated payment-received page after successful payment
            const returnUrl = sanitizeUrl(`${baseAppUrl}/payment-received/${existingOrder.id}`)
            
            const orderPayload = {
                order_id: cashfreeOrderId,
                order_amount: Math.round(existingOrder.total * 100) / 100,
                order_currency: 'INR',
                customer_details: {
                    customer_id: existingOrder.user.id,
                    customer_phone: formatPhoneNumber(existingOrder.address.phone),
                    customer_email: existingOrder.user.email || userEmail
                },
                order_meta: {
                    notify_url: notifyUrl,
                    return_url: returnUrl
                },
                order_note: `CrashKart Order Retry - ${existingOrder.orderItems.length} items`
            }
            
            console.log('🚀 Creating Cashfree order for retry:', cashfreeOrderId)
            
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
            
            // Safely parse response: Cashfree may return HTML on errors (auth pages, proxy pages)
            const rawText = await createOrderResponse.text();
            let orderResult;
            try {
                orderResult = JSON.parse(rawText);
            } catch (jsonErr) {
                console.error('❌ Cashfree retry payment returned non-JSON response')
                console.error('  Status:', createOrderResponse.status)
                console.error('  Content-Type:', createOrderResponse.headers.get('content-type'))
                console.error('  Body (truncated):', rawText?.slice(0, 200))
                return Response.json(
                    { message: 'Payment gateway returned unexpected response (non-JSON). Check Cashfree sandbox availability and credentials.', technicalDetails: rawText?.slice(0, 1000) },
                    { status: 502 }
                )
            }

            if (!createOrderResponse.ok) {
                console.error('❌ Cashfree retry payment error:', orderResult)
                return Response.json(
                    { message: orderResult.message || 'Failed to create retry payment' },
                    { status: 400 }
                )
            }
            
            // Update order with new Cashfree details
            await prisma.order.update({
                where: { id: existingOrder.id },
                data: {
                    notes: JSON.stringify({
                        cashfreeOrderId: cashfreeOrderId,
                        paymentSessionId: orderResult.payment_session_id,
                        retryAt: new Date().toISOString()
                    })
                }
            })
            
            console.log('✅ Retry payment session created')
            
            return Response.json({
                success: true,
                orderId: existingOrder.id,
                paymentSessionId: orderResult.payment_session_id.trim(),
                message: 'Retry payment session created'
            }, { status: 200 })
        }

        // Validate required fields for new orders
        if (!items || items.length === 0) {
            return Response.json(
                { message: 'No items in order' },
                { status: 400 }
            )
        }
        
        if (!selectedAddressId) {
            return Response.json(
                { message: 'Address is required' },
                { status: 400 }
            )
        }

        // Credentials already loaded at top of function

        // Validate and resolve addressId
        let addressId = selectedAddressId
        const isValidAddressObjectId = /^[a-f\d]{24}$/.test(addressId)
        
        if (!isValidAddressObjectId) {
            const userAddresses = await prisma.address.findMany({
                where: { userId: user.id },
                take: 1
            })
            
            if (userAddresses.length > 0) {
                addressId = userAddresses[0].id
            } else {
                try {
                    const defaultAddress = await prisma.address.create({
                        data: {
                            userId: user.id,
                            name: user.name || 'User',
                            email: user.email || 'user@example.com',
                            street: 'Default Street',
                            city: 'Default City',
                            state: 'Default State',
                            zip: '000000',
                            country: 'India',
                            phone: mobileNumber || '0000000000'
                        }
                    })
                    addressId = defaultAddress.id
                } catch (addrErr) {
                    console.error('Address creation failed:', addrErr.message)
                    return Response.json(
                        { message: 'Failed to create order: address required' },
                        { status: 400 }
                    )
                }
            }
        }

        // Resolve storeId
        let storeId = items[0]?.storeId || items[0]?.store_id
        
        if (!storeId) {
            return Response.json(
                { message: 'Store ID is required in items' },
                { status: 400 }
            )
        }

        const isValidStoreObjectId = /^[a-f\d]{24}$/.test(storeId)
        
        if (!isValidStoreObjectId) {
            let userStore = await prisma.store.findFirst({
                where: { userId: user.id }
            })
            
            if (userStore) {
                storeId = userStore.id
            } else {
                let firstStore = await prisma.store.findFirst()
                
                if (firstStore) {
                    storeId = firstStore.id
                } else {
                    try {
                        const defaultStore = await prisma.store.create({
                            data: {
                                userId: user.id,
                                name: 'Default Store',
                                description: 'Default store',
                                username: 'default-store',
                                address: 'Default Address',
                                logo: '',
                                email: user.email || 'store@example.com',
                                contact: '0000000000'
                            }
                        })
                        storeId = defaultStore.id
                    } catch (storeErr) {
                        console.error('Store creation failed:', storeErr.message)
                        return Response.json(
                            { message: 'Failed to create order: no valid store available' },
                            { status: 400 }
                        )
                    }
                }
            }
        }

        // Resolve and validate product IDs
        const resolvedItems = await Promise.all(items.map(async (item) => {
            let productId = item.id || item.productId
            const isValidProductObjectId = /^[a-f\d]{24}$/.test(productId)
            
            if (!isValidProductObjectId) {
                let foundProduct = null
                
                if (item.name) {
                    foundProduct = await prisma.product.findFirst({
                        where: { name: item.name }
                    })
                }
                
                if (foundProduct) {
                    productId = foundProduct.id
                } else {
                    console.warn('Product not found:', item.id, item.name)
                    return null
                }
            }
            
            return {
                productId,
                quantity: item.quantity,
                price: item.price
            }
        }))
        
        const validItems = resolvedItems.filter(item => item !== null)
        
        // Check for duplicate orders before creating new one
        try {
            const normalizedTotal = Number(Number(total).toFixed(2));
            const dedupeStatuses = ['ORDER_PLACED', 'PAYMENT_PENDING', 'PROCESSING']
            const totalLower = normalizedTotal - 1
            const totalUpper = normalizedTotal + 1
            console.log(`🔍 [Cashfree] Checking for duplicate orders: total=₹${normalizedTotal} (range: ₹${totalLower}-₹${totalUpper}), items=${validItems.length}`)
            
            const dedupeCandidates = await prisma.order.findMany({
                where: {
                    userId: user.id,
                    isPaid: false,
                    status: { in: dedupeStatuses },
                    total: { gte: totalLower, lte: totalUpper },
                    createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
                },
                include: { orderItems: true }
            })
            
            console.log(`📋 [Cashfree] Found ${dedupeCandidates.length} potential duplicate candidates`)
            
            if (dedupeCandidates.length > 0) {
                const sameItems = (existing) => {
                    if (!existing?.orderItems || existing.orderItems.length !== validItems.length) return false
                    const normalize = (arr) => [...arr]
                        .map(i => ({
                            pid: String(i.productId),
                            qty: Number(i.quantity || 0),
                            price: Number(i.price || 0)
                        }))
                        .sort((a, b) => a.pid.localeCompare(b.pid))
                    const a = normalize(existing.orderItems)
                    const b = normalize(validItems)
                    // Allow ±₹1 tolerance per item price to account for rounding/fee differences
                    const itemsMatch = a.every((itm, idx) => {
                        const other = b[idx]
                        if (!other) return false
                        return itm.pid === other.pid && itm.qty === other.qty && Math.abs(itm.price - other.price) <= 1
                    })
                    if (!itemsMatch) return false
                    const existingTotal = Number(Number(existing.total || 0).toFixed(2))
                    const totalDiff = Math.abs(existingTotal - normalizedTotal)
                    return totalDiff <= 1
                }
                
                const duplicate = dedupeCandidates.find(sameItems)
                if (duplicate) {
                    console.log(`♻️ [Cashfree] Found duplicate order ${duplicate.id} - updating to CASHFREE/PAYMENT_PENDING`)
                    
                    // Update existing order to use Cashfree payment method
                    await prisma.order.update({
                        where: { id: duplicate.id },
                        data: {
                            paymentMethod: 'CASHFREE',
                            status: 'PAYMENT_PENDING',
                            total: normalizedTotal,
                            notes: JSON.stringify({
                                switchedToCashfree: true,
                                switchedAt: new Date().toISOString()
                            })
                        }
                    })
                    
                    // Use the existing order instead of creating new one
                    console.log(`✅ [Cashfree] Reusing existing order ${duplicate.id}`)
                    const dbOrder = duplicate
                    
                    // Continue with Cashfree payment session creation using the existing order...
                    const cashfreeOrderId = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
                    const formattedPhone = formatPhoneNumber(mobileNumber)
                    const baseAppUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
                    const notifyUrl = sanitizeUrl(`${baseAppUrl}/api/payments/cashfree-webhook`)
                    const returnUrl = sanitizeUrl(`${baseAppUrl}/order-success/${dbOrder.id}`)
                    
                    const orderPayload = {
                        order_id: cashfreeOrderId,
                        order_amount: Math.round(total * 100) / 100,
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
                        order_note: `CrashKart Order - ${items.length} items`
                    }
                    
                    // Make Cashfree API call (credentials loaded at top)
                    const cashfreeResponse = await fetch(`${baseUrl}/pg/orders`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'x-client-id': appId,
                            'x-client-secret': secretKey,
                            'x-api-version': '2023-08-01'
                        },
                        body: JSON.stringify(orderPayload)
                    })
                    
                    const cashfreeData = await cashfreeResponse.json()
                    
                    if (!cashfreeResponse.ok) {
                        throw new Error(cashfreeData.message || 'Cashfree order creation failed')
                    }
                    
                    return Response.json({
                        orderId: dbOrder.id,
                        cashfreeOrderId: cashfreeData.order_id,
                        paymentSessionId: cashfreeData.payment_session_id,
                        total: dbOrder.total
                    }, { status: 200 })
                }
            }
            
            console.log('✨ [Cashfree] No duplicate found - creating new order')
        } catch (dupErr) {
            console.error('⚠️ [Cashfree] Duplicate check failed:', dupErr.message)
            // Continue to create new order if duplicate check fails
        }
        
        // Build order data
        // Note: Order is created with isPaid: false initially
        // After successful payment webhook, it will be marked as paid
        const orderData = {
            userId: user.id,
            storeId: storeId,
            addressId: addressId,
            total: total,
            isPaid: false, // Will be updated to true after payment success
            paymentMethod: 'CASHFREE',
            status: 'PAYMENT_PENDING', // Cashfree orders start as PAYMENT_PENDING until webhook confirms
            isCouponUsed: !!appliedCoupon,
            coupon: appliedCoupon ? JSON.stringify(appliedCoupon) : null
        }
        
        if (validItems.length > 0) {
            orderData.orderItems = {
                create: validItems.map((item, index) => ({
                    ...item,
                    shipmentId: `SHIP-${Date.now()}-${index}`
                }))
            }
        }

        // Create database order
        const dbOrder = await prisma.order.create({
            data: orderData
        })

        console.log('✅ Database order created:', dbOrder.id)

        // Create Cashfree order with correct return_url
        const cashfreeOrderId = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        
        // Format phone number for Cashfree
        const formattedPhone = formatPhoneNumber(mobileNumber)
        console.log('📞 Phone Number Formatting:')
        console.log('  Original:', mobileNumber)
        console.log('  Formatted:', formattedPhone)
        
        // Generate and sanitize URLs
        const baseAppUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
        const notifyUrl = sanitizeUrl(`${baseAppUrl}/api/payments/cashfree-webhook`)
        // For new orders initiated from checkout, redirect to the order success page
        const returnUrl = sanitizeUrl(`${baseAppUrl}/order-success/${dbOrder.id}`)
        
        console.log('🔗 URL Sanitization:')
        console.log('  Notify URL:', notifyUrl)
        console.log('  Return URL:', returnUrl)
        
        const orderPayload = {
            order_id: cashfreeOrderId,
            order_amount: Math.round(total * 100) / 100,
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
            order_note: `CrashKart Order - ${items.length} items`
        }

        console.log('🚀 Attempting to connect to Cashfree API...')
        console.log('📍 Target URL:', `${baseUrl}/pg/orders`)
        
        // Create Cashfree order with extended timeout and retry logic
        let createOrderResponse
        let retries = 2
        let lastError
        
        for (let i = 0; i <= retries; i++) {
            try {
                console.log(`🔄 Attempt ${i + 1}/${retries + 1}`);
                
                const controller = new AbortController()
                const timeout = setTimeout(() => controller.abort(), 30000) // 30 second timeout
                
                createOrderResponse = await fetch(
                    `${baseUrl}/pg/orders`,
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'x-api-version': '2023-08-01',
                            'x-client-id': appId,
                            'x-client-secret': secretKey
                        },
                        body: JSON.stringify(orderPayload),
                        signal: controller.signal
                    }
                )
                
                clearTimeout(timeout)
                console.log('✅ Connection successful')
                break // Success, exit retry loop
                
            } catch (error) {
                lastError = error
                console.error(`❌ Attempt ${i + 1} failed:`, error.message)
                
                if (i < retries) {
                    console.log(`⏳ Waiting 2 seconds before retry...`)
                    await new Promise(resolve => setTimeout(resolve, 2000))
                } else {
                    console.error('❌ All retry attempts exhausted')
                    console.error('🔍 Error details:', {
                        name: error.name,
                        message: error.message,
                        cause: error.cause?.code
                    })
                    
                    return Response.json(
                        { 
                            message: 'Payment gateway connection timeout. Please check your internet connection and try again.',
                            technicalDetails: error.cause?.code === 'UND_ERR_CONNECT_TIMEOUT' 
                                ? 'Unable to connect to payment gateway (timeout)' 
                                : error.message
                        },
                        { status: 503 }
                    )
                }
            }
        }

        // Safely parse response: Cashfree may return HTML on errors (auth pages, proxy pages)
        const rawText = await createOrderResponse.text();
        let orderResult;
        try {
            orderResult = JSON.parse(rawText);
        } catch (jsonErr) {
            console.error('❌ Cashfree returned non-JSON response')
            console.error('  Status:', createOrderResponse.status)
            console.error('  Content-Type:', createOrderResponse.headers.get('content-type'))
            console.error('  Body (truncated):', rawText?.slice(0, 500))
            return Response.json(
                { message: 'Payment gateway returned unexpected response (non-JSON). Check Cashfree sandbox availability and credentials.', technicalDetails: rawText?.slice(0, 1000) },
                { status: 502 }
            )
        }

        console.log('📥 Raw Cashfree Response:')
        console.log('  Order ID:', orderResult.order_id)
        console.log('  Session ID from Cashfree:', orderResult.payment_session_id?.substring(0, 50))
        console.log('  Session ID length:', orderResult.payment_session_id?.length)

        if (!createOrderResponse.ok) {
            console.error('❌ Cashfree API Error:')
            console.error('  Status:', createOrderResponse.status)
            console.error('  Response:', JSON.stringify(orderResult, null, 2))
            
            // Handle authentication errors specifically
            if (createOrderResponse.status === 401 || orderResult.type === 'authentication_error') {
                console.error('🚨 AUTHENTICATION FAILED!')
                console.error('Your Cashfree credentials are incorrect or expired.')
                console.error('Please check:')
                console.error('  1. CASHFREE_APP_ID is correct')
                console.error('  2. CASHFREE_SECRET_KEY is correct')
                console.error('  3. You are using SANDBOX credentials (not production)')
                console.error('  4. Get credentials from: https://merchant.cashfree.com/merchants/sandbox-settings')
                
                return Response.json(
                    { 
                        message: 'Payment gateway authentication failed. Please check your Cashfree credentials.',
                        technicalDetails: 'Invalid API credentials. Verify CASHFREE_APP_ID and CASHFREE_SECRET_KEY in .env file.',
                        helpLink: 'https://merchant.cashfree.com/merchants/sandbox-settings'
                    },
                    { status: 401 }
                )
            }
            
            return Response.json(
                { 
                    message: orderResult.message || 'Failed to create Cashfree order',
                    error: orderResult.error || orderResult
                },
                { status: 400 }
            )
        }

        // Update database order with Cashfree details
        await prisma.order.update({
            where: { id: dbOrder.id },
            data: {
                notes: JSON.stringify({
                    cashfreeOrderId: cashfreeOrderId,
                    paymentSessionId: orderResult.payment_session_id,
                    createdAt: new Date().toISOString()
                })
            }
        })

        // Prepare response
        const paymentSessionId = orderResult.payment_session_id.trim()
        
        const responseData = {
            success: true,
            orderId: dbOrder.id,
            cashfreeOrderId: orderResult.order_id,
            paymentSessionId: paymentSessionId,
            message: 'Order created successfully',
            total: total,
            discount: discount,
            items: items
        }

        console.log('✅ Returning Order Response:')
        console.log('  Database Order ID:', responseData.orderId)
        console.log('  Cashfree Order ID:', responseData.cashfreeOrderId)
        console.log('  Session ID being returned:', responseData.paymentSessionId?.substring(0, 50))
        console.log('  Session ID length:', responseData.paymentSessionId?.length)

        return Response.json(responseData, { status: 200 })

    } catch (error) {
        console.error('Cashfree order creation error:', error)
        return Response.json(
            { message: error.message || 'Payment processing failed' },
            { status: 500 }
        )
    }
}
