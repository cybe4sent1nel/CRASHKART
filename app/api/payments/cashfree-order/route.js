import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

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

export async function POST(req) {
    try {
        // Debug logging
        const authHeader = req.headers.get('authorization')
        console.log('🔍 Payment Auth Debug:')
        console.log('  Auth Header:', authHeader ? 'Present' : 'Missing')
        console.log('  JWT_SECRET:', process.env.JWT_SECRET ? 'Set' : 'Not Set')
        
        // Get user session from NextAuth or Bearer token
         let session = await getServerSession(authOptions)
         let userEmail = session?.user?.email
         let userId = null
         console.log('  NextAuth Session:', userEmail ? `Found: ${userEmail}` : 'Not found')
         
         // If no NextAuth session, check for Bearer token (localStorage OTP login)
         if (!userEmail && authHeader?.startsWith('Bearer ')) {
             const token = authHeader.slice(7)
             console.log('  Token Length:', token.length)
             try {
                 // Verify JWT token
                 const decoded = jwt.verify(
                     token,
                     process.env.JWT_SECRET || 'your-secret-key'
                 )
                 userEmail = decoded?.email
                 userId = decoded?.userId
                 console.log('  ✅ JWT Verified:', { email: userEmail, userId })
             } catch (err) {
                 console.error('  ❌ JWT verification failed:', err.message)
             }
         }
         
         if (!userEmail && !userId) {
             console.log('  ⛔ No user email or userId found - returning 401')
             return Response.json(
                 { message: 'Unauthorized' },
                 { status: 401 }
             )
         }
         console.log('  ✅ User authenticated:', { userEmail, userId })

        const body = await req.json()
        const {
            subtotal,
            discount,
            total,
            items,
            selectedAddressId,
            mobileNumber,
            appliedCoupon
        } = body

        // Validate required fields
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

        // Get Cashfree credentials from environment
        const cashfreeAppId = process.env.CASHFREE_APP_ID
        const cashfreeSecretKey = process.env.CASHFREE_SECRET_KEY
        const cashfreeEnvironment = process.env.CASHFREE_ENVIRONMENT || 'sandbox'

        if (!cashfreeAppId || !cashfreeSecretKey) {
            console.warn('Cashfree credentials not configured')
            return Response.json(
                { message: 'Payment gateway not configured' },
                { status: 500 }
            )
        }

        // Base URL for Cashfree API
        const baseUrl = cashfreeEnvironment === 'production' 
            ? 'https://api.cashfree.com'
            : 'https://sandbox.cashfree.com'

        // Get user from database - try userId first, then email
         let user = null
         
         if (userId) {
             console.log('🔍 Looking for user by userId:', userId)
             user = await prisma.user.findUnique({
                 where: { id: userId }
             })
             if (user) {
                 console.log('✅ User found by userId:', user.email || user.id)
             }
         }
         
         if (!user && userEmail) {
             console.log('🔍 Looking for user by email:', userEmail)
             user = await prisma.user.findUnique({
                 where: { email: userEmail }
             })
             if (user) {
                 console.log('✅ User found by email:', user.email)
             }
         }

         if (!user) {
             console.warn('⚠️ User not found in database, attempting to create user', { userId, userEmail })
             
             try {
                 // Auto-create user if they don't exist (fallback for OTP auth issues)
                 user = await prisma.user.create({
                     data: {
                         id: userId || 'user_' + Date.now(),
                         email: userEmail || null,
                         name: userEmail ? userEmail.split('@')[0] : 'User',
                         isProfileSetup: false,
                         loginMethod: 'email'
                     }
                 })
                 console.log('✅ User auto-created:', user.id, user.email)
             } catch (createErr) {
                 console.error('❌ Failed to auto-create user:', createErr.message)
                 // Try to find any user to help with debugging
                 const allUsers = await prisma.user.findMany({ take: 5 })
                 console.log('Debug - Sample users in DB:', allUsers.map(u => ({ id: u.id, email: u.email })))
                 return Response.json(
                     { message: 'User not found and could not be created', debug: { userId, userEmail, error: createErr.message } },
                     { status: 404 }
                 )
             }
         }
         console.log('✅ User authenticated and found in database:', user.email || user.id)

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
            status: 'ORDER_PLACED', // Start with ORDER_PLACED, update on payment success
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
                notify_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/payments/cashfree-webhook`,
                return_url: `${(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')}/order-success/${dbOrder.id}`
            },
            order_note: `CrashKart Order - ${items.length} items`
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

        console.log('📥 Raw Cashfree Response:')
        console.log('  Order ID:', orderResult.order_id)
        console.log('  Session ID from Cashfree:', orderResult.payment_session_id?.substring(0, 50))
        console.log('  Session ID length:', orderResult.payment_session_id?.length)

        if (!createOrderResponse.ok) {
            console.error('❌ Cashfree API Error:')
            console.error('  Status:', createOrderResponse.status)
            console.error('  Response:', JSON.stringify(orderResult, null, 2))
            
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
