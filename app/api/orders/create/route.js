import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { extractBearerToken, verifyUserToken } from '@/lib/authTokens'
import { triggerOrderConfirmationEmail } from '@/lib/emailTriggerService'
import { sendOrderPlacedEmail } from '@/lib/emailService'
import { sendOrderConfirmationWithInvoice } from '@/lib/email'
import unifiedStorage from '@/lib/unifiedStorage'

// Prevent Next.js from attempting to pre-render this route
export const dynamic = 'force-dynamic'

const prisma = new PrismaClient()

export async function POST(req) {
    try {
                const { authOptions } = await import('@/lib/auth')
const session = await getServerSession(authOptions).catch(() => null)

        let user = null

        // First, try to resolve user from NextAuth session
        if (session?.user?.email) {
            user = await prisma.user.findUnique({ where: { email: session.user.email } })
        }

        // If no NextAuth session, fall back to bearer token auth
        if (!user) {
            try {
                        const { authOptions } = await import('@/lib/auth')
const token = extractBearerToken(req)
                const { decoded } = await verifyUserToken(token)
                user = await prisma.user.findUnique({ where: { id: decoded.userId } })
            } catch (authErr) {
                return Response.json(
                    { message: authErr.message || 'Unauthorized' },
                    { status: authErr.status || 401 }
                )
            }
        }

        const body = await req.json()
        const {
            paymentMethod,
            paymentDetails,
            items,
            subtotal,
            discount,
            total,
            selectedAddressId,
            mobileNumber,
            appliedCoupon,
            transactionId,
            timestamp
        } = body

        // Validate required fields
        if (!items || items.length === 0) {
            return Response.json(
                { message: 'No items in order' },
                { status: 400 }
            )
        }

        if (!paymentMethod) {
            return Response.json(
                { message: 'Payment method required' },
                { status: 400 }
            )
        }

        // Ensure user exists
        if (!user) {
            return Response.json(
                { message: 'User not found' },
                { status: 404 }
            )
        }

        // Get the selected address
        let addressId = selectedAddressId
        let address = null

        if (selectedAddressId) {
            address = await prisma.address.findUnique({
                where: { id: selectedAddressId }
            })
        }

        if (!address) {
            return Response.json(
                { message: 'Address not found' },
                { status: 404 }
            )
        }

        // Determine payment method enum
        const paymentMethodEnum = paymentMethod.toUpperCase() === 'COD' ? 'COD' : 'CASHFREE'

        // Determine if paid based on payment method
        // CASHFREE payments (Card, UPI, Net Banking) need webhook confirmation, so start as unpaid
        // They will be marked paid when webhook confirms payment
        // COD orders start with isPaid: false (payment on delivery)
        const isPaidInitially = false
        
        console.log(`💳 Payment method: ${paymentMethodEnum}, Initial paid status: ${isPaidInitially}`)

        // Get a valid store from the database
        let storeId = null
        
        // Try to get store from first item if it's a valid MongoDB ObjectID
        if (items[0]?.storeId && /^[a-f\d]{24}$/i.test(items[0].storeId)) {
            storeId = items[0].storeId
        } else {
            // Fallback: Get first available store from database
            const firstStore = await prisma.store.findFirst()
            if (firstStore) {
                storeId = firstStore.id
                console.log(`📦 Using store from database: ${storeId}`)
            } else {
                // Last resort: Create a default store
                try {
                            const { authOptions } = await import('@/lib/auth')
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
                    console.log(`✅ Created default store: ${storeId}`)
                } catch (storeErr) {
                    console.error('❌ Failed to create default store:', storeErr.message)
                    return Response.json(
                        { message: 'Failed to create order: no valid store available' },
                        { status: 500 }
                    )
                }
            }
        }

        // Calculate delivery charge using admin-configured charges (global + rules)
        const fs = await import('fs')
        const path = await import('path')
        let adminChargesRaw = null
        try {
                    const { authOptions } = await import('@/lib/auth')
const raw = await fs.promises.readFile(path.join(process.cwd(), 'data', 'adminCharges.json'), 'utf8')
            adminChargesRaw = JSON.parse(raw)
        } catch (e) {
            console.warn('Could not read admin charges, using defaults', e.message)
            adminChargesRaw = { global: { shippingFee: 40, freeAbove: 999, convenienceFee: 0, platformFee: 0 }, rules: [{ id: 'rule_all', scopeType: 'all', scope: '*', shippingFee: 40, convenienceFee: 0, platformFee: 0 }] }
        }

        // Normalize to structured format if file is flat
        let adminCharges = adminChargesRaw
        if (!adminCharges.rules) {
            adminCharges = {
                global: {
                    shippingFee: Number(adminChargesRaw.shippingFee || 0),
                    freeAbove: Number(adminChargesRaw.freeAbove || 0),
                    convenienceFee: Number(adminChargesRaw.convenienceFee || 0),
                    platformFee: Number(adminChargesRaw.platformFee || 0)
                },
                rules: [ { id: 'rule_all', scopeType: 'all', scope: '*', shippingFee: Number(adminChargesRaw.shippingFee || 0), convenienceFee: Number(adminChargesRaw.convenienceFee || 0), platformFee: Number(adminChargesRaw.platformFee || 0) } ]
            }
        }

        // Fetch product details to resolve category/product scoped rules
        const productIds = Array.from(new Set(items.map(i => i.id || i.productId).filter(Boolean)))
        const products = productIds.length ? await prisma.product.findMany({ where: { id: { in: productIds } } }) : []
        const productMap = new Map(products.map(p => [p.id, p]))

        const applied = appliedCoupon || null

        // Fetch canonical coupon definition from DB when possible to avoid trusting client-supplied coupon metadata
        let couponDef = null
        try {
                    const { authOptions } = await import('@/lib/auth')
if (applied && applied.code) {
                couponDef = await prisma.coupon.findUnique({ where: { code: applied.code } })
            }
        } catch (e) {
            console.warn('Coupon definition lookup failed:', e.message)
            couponDef = null
        }

        const isFreeDeliveryCoupon = !!(
            (couponDef && String(couponDef.couponType || '').toLowerCase().includes('free')) ||
            (applied && (
                (applied.couponType && String(applied.couponType).toLowerCase().includes('free')) ||
                (applied.type && String(applied.type).toLowerCase().includes('free')) ||
                (applied.source && String(applied.source).toLowerCase().includes('scratch') && (applied.couponType === 'free-shipping' || applied.couponType === 'freeDelivery'))
            ))
        )

        const freeAbove = Number(adminCharges.global?.freeAbove || 0)

        // For each item, find the most specific matching rule (product > category > all)
        const matchedFees = items.map(item => {
            const pid = item.id || item.productId
            const prod = productMap.get(pid)
            const category = prod?.category || item.category || ''

            // find product-specific rule
            let rule = adminCharges.rules.find(r => r.scopeType === 'product' && String(r.scope) === String(pid))
            if (!rule && category) rule = adminCharges.rules.find(r => r.scopeType === 'category' && String(r.scope).toLowerCase() === String(category).toLowerCase())
            if (!rule) rule = adminCharges.rules.find(r => r.scopeType === 'all' || r.scope === '*')
            return {
                shippingFee: Number(rule?.shippingFee ?? adminCharges.global?.shippingFee ?? 0),
                convenienceFee: Number(rule?.convenienceFee ?? adminCharges.global?.convenienceFee ?? 0),
                platformFee: Number(rule?.platformFee ?? adminCharges.global?.platformFee ?? 0)
            }
        })

        // Derive order-level fees: take the maximum of matched fees (most conservative)
        let baseShipping = matchedFees.length ? Math.max(...matchedFees.map(f => f.shippingFee)) : Number(adminCharges.global?.shippingFee || 0)
        let convenienceFee = matchedFees.length ? Math.max(...matchedFees.map(f => f.convenienceFee)) : Number(adminCharges.global?.convenienceFee || 0)
        let platformFee = matchedFees.length ? Math.max(...matchedFees.map(f => f.platformFee)) : Number(adminCharges.global?.platformFee || 0)

        // Apply coupon-specific waivers if present — prefer server-side coupon definition when available
        const waived = Array.isArray(couponDef?.appliesToCharges)
            ? couponDef.appliesToCharges.map(x => String(x).toLowerCase())
            : (Array.isArray(applied?.appliesToCharges) ? applied.appliesToCharges.map(x => String(x).toLowerCase()) : [])
        if (waived.includes('shipping') || isFreeDeliveryCoupon) {
            baseShipping = 0
        }
        if (waived.includes('convenience')) convenienceFee = 0
        if (waived.includes('platform')) platformFee = 0

        // Note: freeAbove threshold is applied after computing server-subtotal to avoid client manipulation.

        // Server-side: validate flash-sale prices and recompute subtotal using trusted product prices
        const now = new Date()
        const activeFlashSales = await prisma.flashSale.findMany({
            where: {
                isActive: true,
                startTime: { lte: now },
                endTime: { gte: now },
                products: { hasSome: productIds }
            }
        })

        const flashDiscountMap = new Map()
        for (const sale of activeFlashSales) {
            const discount = Number(sale.discount || 0)
            for (const pid of sale.products || []) {
                if (!productIds.includes(pid)) continue
                const prev = flashDiscountMap.get(pid) || 0
                flashDiscountMap.set(pid, Math.max(prev, discount))
            }
        }

        let serverSubtotal = 0
        const validatedItems = items.map(item => {
            const pid = item.id || item.productId
            const qty = Number(item.quantity || 1)
            const prod = productMap.get(pid)
            const basePrice = Number(prod?.price ?? (item.price || item.salePrice || item.originalPrice || 0))
            const salePct = Number(flashDiscountMap.get(pid) || 0)
            const serverPrice = Math.round(basePrice * (1 - salePct / 100))
            serverSubtotal += serverPrice * qty
            return { ...item, price: serverPrice, quantity: qty }
        })

        // Validate inventory (product stock and flash-sale stock) before creating order
        for (const item of validatedItems) {
            const pid = item.id || item.productId
            const qty = Number(item.quantity || 1)
            const prod = productMap.get(pid)
            if (!prod) {
                return Response.json({ message: `Product ${pid} not found` }, { status: 404 })
            }
            if (typeof prod.quantity === 'number' && prod.quantity < qty) {
                return Response.json({ message: `Insufficient stock for ${prod.name || pid}` }, { status: 400 })
            }

            // If this product is part of an active flash sale, ensure flash-sale quantity is sufficient
            if (flashDiscountMap.has(pid)) {
                const sale = activeFlashSales.find(s => Array.isArray(s.products) && s.products.includes(pid))
                if (sale) {
                    const pqObj = sale.productQuantities || {}
                    const pq = (pqObj && pqObj[pid]) ? Number(pqObj[pid]) : Number(sale.maxQuantity || prod.quantity || 0)
                    if (pq < qty) {
                        return Response.json({ message: `Flash sale quantity insufficient for ${prod.name || pid}` }, { status: 400 })
                    }
                }
            }
        }

        // Compute coupon discount server-side (prefer official coupon definition or validated scratch reward)
        let couponDiscount = 0
        if (applied && applied.code) {
            try {
                        const { authOptions } = await import('@/lib/auth')
const couponFromDb = couponDef || await prisma.coupon.findUnique({ where: { code: applied.code } })
                if (couponFromDb) {
                    const cType = couponFromDb.couponType || 'percentage'
                    if (cType === 'percentage') {
                        couponDiscount = Math.floor(serverSubtotal * (Number(couponFromDb.discount || 0) / 100))
                        if (couponFromDb.maxDiscount) couponDiscount = Math.min(couponDiscount, Number(couponFromDb.maxDiscount))
                    } else if (cType === 'flat') {
                        couponDiscount = Number(couponFromDb.discount || 0)
                    } else if (cType === 'freeDelivery') {
                        couponDiscount = 0
                    }
                } else if (applied.source === 'scratch' || applied.couponType === 'discount') {
                    // Fallback: scratch card style coupon object from client (validated earlier)
                    if (applied.discount !== undefined) {
                        couponDiscount = Number(applied.discount || 0)
                    } else if (applied.rewardValue) {
                        if (applied.rewardValue <= 100) couponDiscount = Math.floor(serverSubtotal * Number(applied.rewardValue) / 100)
                        else couponDiscount = Number(applied.rewardValue || 0)
                    }
                }
            } catch (e) {
                console.warn('Coupon lookup failed, using client discount if present')
                couponDiscount = Number(discount || 0)
            }
        } else {
            couponDiscount = Number(discount || 0)
        }

        // Ensure couponDiscount is within bounds
        couponDiscount = Math.max(0, Math.min(couponDiscount, serverSubtotal))

        // Apply freeAbove threshold now that serverSubtotal is known
        const feesAreFreeByThreshold = serverSubtotal >= freeAbove
        const shippingForOrder = feesAreFreeByThreshold ? 0 : Number(baseShipping)
        const convenienceForOrder = feesAreFreeByThreshold ? 0 : Number(convenienceFee)
        const platformForOrder = feesAreFreeByThreshold ? 0 : Number(platformFee)

        const deliveryCharge = Number(shippingForOrder + convenienceForOrder + platformForOrder)

        // Recompute final total using server-validated subtotal, computed coupon discount and delivery charge
        const finalTotalRaw = serverSubtotal + deliveryCharge - couponDiscount
        const finalTotal = Number(finalTotalRaw.toFixed(2)) // normalize to 2 decimals for dedupe/equality
        const idempotencyKey = transactionId || timestamp || null

        console.log(`🚚 Delivery breakdown — shipping: ₹${shippingForOrder}, convenience: ₹${convenienceForOrder}, platform: ₹${platformForOrder}. Delivery total: ₹${deliveryCharge}. Server subtotal: ₹${serverSubtotal}. Final total: ₹${finalTotal}`)

        // Guard against duplicate order submissions (COD especially). Reuse an existing unpaid order with identical items/quantities/prices and total.
        try {
                    const { authOptions } = await import('@/lib/auth')
const normalizedTotal = Number(finalTotal.toFixed(2)) // ensure 2 decimal precision
            const dedupeStatuses = ['ORDER_PLACED', 'PAYMENT_PENDING', 'PROCESSING']
            const totalLower = normalizedTotal - 1 // allow ₹1 tolerance for rounding/fee jitter
            const totalUpper = normalizedTotal + 1
            console.log(`🔍 Checking for duplicate orders: total=₹${normalizedTotal} (range: ₹${totalLower}-₹${totalUpper}), items=${validatedItems.length}`)
            // Look for any unpaid order with nearly the same total and same items regardless of payment method to prevent COD + Payment Pending double orders
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

            const sameItems = (existing) => {
                if (!existing?.orderItems || existing.orderItems.length !== validatedItems.length) {
                    console.log(`  ❌ Order ${existing?.id}: different item count (${existing?.orderItems?.length} vs ${validatedItems.length})`)
                    return false
                }
                const normalize = (arr) => [...arr]
                    .map(i => ({
                        pid: String(i.productId || i.id || i.productId),
                        qty: Number(i.quantity || 0),
                        price: Number(i.price || 0)
                    }))
                    .sort((a, b) => a.pid.localeCompare(b.pid))
                const a = normalize(existing.orderItems)
                const b = normalize(validatedItems)
                
                // Detailed logging for debugging
                console.log(`  📦 Comparing items for order ${existing.id}:`)
                console.log(`     Existing items:`, a.map(x => `${x.pid.slice(-4)}(${x.qty}@₹${x.price})`).join(', '))
                console.log(`     New items:`, b.map(x => `${x.pid.slice(-4)}(${x.qty}@₹${x.price})`).join(', '))
                
                const itemsMatch = a.every((itm, idx) => {
                    const other = b[idx]
                    if (!other) return false
                    
                    const pidMatch = itm.pid === other.pid
                    const qtyMatch = itm.qty === other.qty
                    const priceDiff = Math.abs(itm.price - other.price)
                    const priceMatch = priceDiff <= 1 // Allow ±₹1 tolerance per item for rounding/fee differences
                    
                    const match = pidMatch && qtyMatch && priceMatch
                    if (!match) {
                        console.log(`     ❌ Mismatch at index ${idx}:`, {
                            existing: `${itm.pid.slice(-6)} qty=${itm.qty} price=₹${itm.price}`,
                            new: `${other.pid.slice(-6)} qty=${other.qty} price=₹${other.price}`,
                            pidMatch, qtyMatch, priceMatch: `${priceMatch} (diff: ₹${priceDiff.toFixed(2)})`
                        })
                    }
                    return match
                })
                
                if (!itemsMatch) {
                    console.log(`  ❌ Order ${existing.id}: different items/quantities/prices`)
                    return false
                }
                // Also ensure totals are within tolerance (covers minor rounding/fee diffs)
                const existingTotal = Number(Number(existing.total || 0).toFixed(2))
                const totalDiff = Math.abs(existingTotal - normalizedTotal)
                const totalClose = totalDiff <= 1
                console.log(`  ${totalClose ? '✅' : '❌'} Order ${existing.id}: total ₹${existingTotal} vs ₹${normalizedTotal} (diff: ₹${totalDiff.toFixed(2)})`)
                return totalClose
            }

            console.log(`📋 Found ${dedupeCandidates.length} potential duplicate candidates within 24h`)
            dedupeCandidates.forEach(c => console.log(`  - Order ${c.id}: ₹${Number(c.total).toFixed(2)}, ${c.paymentMethod}, ${c.status}`))

            const duplicate = dedupeCandidates.find(sameItems)
            if (duplicate) {
                console.log(`♻️ Found duplicate order ${duplicate.id} - will reuse and update if needed`)
                console.log(`   Current state: paymentMethod=${duplicate.paymentMethod}, status=${duplicate.status}, isPaid=${duplicate.isPaid}`)
                const updates = {}
                // Align payment method
                if (duplicate.paymentMethod !== paymentMethodEnum) {
                    updates.paymentMethod = paymentMethodEnum
                }
                // If we're switching to COD, ALWAYS force status to ORDER_PLACED
                if (paymentMethodEnum === 'COD') {
                    if (duplicate.status !== 'ORDER_PLACED') {
                        updates.status = 'ORDER_PLACED'
                        console.log(`   🔄 Forcing status to ORDER_PLACED for COD`)
                    }
                }
                // If switching from COD to online payment, set PAYMENT_PENDING
                else if (paymentMethodEnum === 'CASHFREE' && duplicate.paymentMethod === 'COD') {
                    updates.status = 'PAYMENT_PENDING'
                }
                // Always sync the total to ensure consistency (in case of rounding differences)
                const existingTotal = Number(Number(duplicate.total || 0).toFixed(2))
                if (existingTotal !== normalizedTotal) {
                    updates.total = normalizedTotal
                    console.log(`💰 Updating order total from ₹${existingTotal} to ₹${normalizedTotal}`)
                }
                if (Object.keys(updates).length) {
                    const oldNotes = JSON.parse(duplicate.notes || '{}')
                    updates.notes = JSON.stringify({
                        ...oldNotes,
                        switchedFrom: duplicate.paymentMethod,
                        switchedAt: new Date().toISOString(),
                        reusedOrder: true
                    })
                    // Update the updatedAt timestamp so the order appears as recently modified
                    updates.updatedAt = new Date()
                    
                    try {
                                const { authOptions } = await import('@/lib/auth')
await prisma.order.update({ where: { id: duplicate.id }, data: updates })
                        console.log(`✅ Updated duplicate order ${duplicate.id}: paymentMethod=${updates.paymentMethod || duplicate.paymentMethod}, status=${updates.status || duplicate.status}`)
                    } catch (pmErr) {
                        console.warn('Failed to update duplicate order metadata', pmErr.message)
                    }
                } else {
                    // Even if no updates needed, touch the updatedAt so it appears recently accessed
                    try {
                                const { authOptions } = await import('@/lib/auth')
await prisma.order.update({ 
                            where: { id: duplicate.id }, 
                            data: { updatedAt: new Date() } 
                        })
                        console.log(`✅ Touched duplicate order ${duplicate.id} updatedAt timestamp`)
                    } catch (touchErr) {
                        console.warn('Failed to update duplicate order timestamp', touchErr.message)
                    }
                }

                console.log(`♻️ Detected duplicate order attempt; reusing existing order ${duplicate.id}`)
                
                // 💰 Check if CrashCash was already awarded for this duplicate order
                try {
                            const { authOptions } = await import('@/lib/auth')
const existingReward = await prisma.crashCashReward.findFirst({
                        where: {
                            orderId: duplicate.id,
                            userId: user.id,
                            source: 'order_placed'
                        }
                    })
                    
                    if (!existingReward) {
                        console.log(`💰 No CrashCash reward found for duplicate order ${duplicate.id}, creating now...`)
                        
                        // Calculate CrashCash reward (10% of server subtotal OR product-specific CrashCash value)
                        let totalCrashCashEarned = 0

                        // Check if items have specific crashCashValue
                        for (const item of validatedItems) {
                            if (item.crashCashValue && item.crashCashValue > 0) {
                                totalCrashCashEarned += item.crashCashValue * item.quantity
                            }
                        }

                        // If no product-specific CrashCash, use 10% of server subtotal
                        if (totalCrashCashEarned === 0) {
                            totalCrashCashEarned = Math.floor(serverSubtotal * 0.1)
                        }
                        
                        if (totalCrashCashEarned > 0) {
                            // ✅ Use unified storage to add CrashCash (prevents deadlocks)
                            const result = await unifiedStorage.addCrashCash(
                                user.id,
                                totalCrashCashEarned,
                                'order_placed',
                                duplicate.id
                            )
                            
                            if (result.success) {
                                console.log(`✅ Added ₹${totalCrashCashEarned} CrashCash for duplicate order ${duplicate.id}`)
                                console.log(`✅ New balance: ₹${result.newBalance}`)
                            } else {
                                console.error(`❌ Failed to add CrashCash: ${result.error}`)
                            }
                        }
                    } else {
                        console.log(`✅ CrashCash reward already exists for order ${duplicate.id}: ₹${existingReward.amount}`)
                    }
                } catch (cashError) {
                    console.error('❌ Failed to check/add CrashCash for duplicate order:', cashError.message)
                    // Don't fail the order if CrashCash fails
                }
                
                return Response.json({
                    success: true,
                    message: 'Order already created',
                    orderId: duplicate.id
                }, { status: 200 })
            } else {
                console.log('✨ No duplicate found - proceeding to create new order')
            }
        } catch (dupErr) {
            console.error('⚠️ Duplicate order check failed, proceeding to create new order:', dupErr.message)
        }

        // Create order in database
        const order = await prisma.order.create({
            data: {
                userId: user.id,
                storeId: storeId,
                addressId: address.id,
                total: finalTotal, // Include delivery charge in total
                isPaid: isPaidInitially,
                paymentMethod: paymentMethodEnum,
                status: 'ORDER_PLACED',
                isCouponUsed: !!appliedCoupon,
                coupon: appliedCoupon ? JSON.stringify(appliedCoupon) : null,
                notes: JSON.stringify({
                    subtotal: serverSubtotal,
                    deliveryCharge: deliveryCharge,
                    shippingFee: baseShipping,
                    convenienceFee: convenienceFee,
                    platformFee: platformFee,
                    originalTotal: serverSubtotal,
                    idempotencyKey,
                    createdAt: new Date().toISOString()
                }),
                orderItems: {
                    create: validatedItems.map(item => ({
                        productId: item.id || item.productId,
                        quantity: item.quantity,
                        price: Number(item.price || 0)
                    }))
                }
            },
            include: {
                orderItems: true
            }
        })

        // Decrement product stock and update flash-sale quantities where applicable
        try {
                    const { authOptions } = await import('@/lib/auth')
for (const oi of order.orderItems || []) {
                const pid = oi.productId
                const qty = Number(oi.quantity || 0)
                const prod = productMap.get(pid)
                try {
                            const { authOptions } = await import('@/lib/auth')
// Update product quantity and inStock flag
                    const updateData = { quantity: { decrement: qty } }
                    if (typeof prod?.quantity === 'number') updateData.inStock = (prod.quantity - qty) > 0
                    await prisma.product.update({
                        where: { id: pid },
                        data: updateData
                    })
                } catch (prodErr) {
                    console.error(`Failed to decrement product ${pid}:`, prodErr.message)
                }

                // If product was part of an active flash sale, decrement flash sale productQuantities and increment sold
                try {
                            const { authOptions } = await import('@/lib/auth')
const sale = activeFlashSales.find(s => Array.isArray(s.products) && s.products.includes(pid))
                    if (sale) {
                        const pqObj = sale.productQuantities || {}
                        const currentPQ = (pqObj && pqObj[pid]) ? Number(pqObj[pid]) : Number(sale.maxQuantity || prod?.quantity || 0)
                        const newPQ = Math.max(0, currentPQ - qty)
                        const newPQObj = { ...(pqObj || {}), [pid]: newPQ }
                        await prisma.flashSale.update({
                            where: { id: sale.id },
                            data: {
                                productQuantities: newPQObj,
                                sold: { increment: qty }
                            }
                        })
                    }
                } catch (fsErr) {
                    console.error(`Failed to update flash sale stock for product ${pid}:`, fsErr.message)
                }
            }
        } catch (stockErr) {
            console.error('Error updating stocks after order creation:', stockErr.message)
        }

        // If coupon was used, mark it as used
        if (appliedCoupon && appliedCoupon.code) {
            try {
                        const { authOptions } = await import('@/lib/auth')
// Fetch coupon definition to check per-user limits
                const couponDef = await prisma.coupon.findUnique({ where: { code: appliedCoupon.code } })

                // Find user's coupon record
                const userCoupon = await prisma.userCoupon.findUnique({
                    where: { userId_couponCode: { userId: user.id, couponCode: appliedCoupon.code } }
                })

                if (userCoupon) {
                    // If coupon has perUserLimit, increment usesCount and mark used only when limit reached
                    if (couponDef?.perUserLimit) {
                        const newUses = (userCoupon.usesCount || 0) + 1
                        const shouldMarkUsed = newUses >= couponDef.perUserLimit

                        await prisma.userCoupon.update({
                            where: { id: userCoupon.id },
                            data: {
                                usesCount: newUses,
                                isUsed: shouldMarkUsed,
                                usedAt: shouldMarkUsed ? new Date() : userCoupon.usedAt,
                                usedInOrderId: shouldMarkUsed ? order.id : userCoupon.usedInOrderId
                            }
                        })
                    } else {
                        // No per-user limit: mark as used immediately
                        await prisma.userCoupon.update({
                            where: { id: userCoupon.id },
                            data: {
                                isUsed: true,
                                usedAt: new Date(),
                                usedInOrderId: order.id,
                                usesCount: (userCoupon.usesCount || 0) + 1
                            }
                        })
                    }
                } else {
                    // No userCoupon record found; create one and mark depending on perUserLimit
                    const usesCount = 1
                    const shouldMarkUsed = couponDef?.perUserLimit ? (usesCount >= couponDef.perUserLimit) : true
                    await prisma.userCoupon.create({
                        data: {
                            userId: user.id,
                            couponCode: appliedCoupon.code,
                            isUsed: shouldMarkUsed,
                            usedAt: shouldMarkUsed ? new Date() : null,
                            usedInOrderId: shouldMarkUsed ? order.id : null,
                            usesCount: usesCount,
                            expiresAt: couponDef?.expiresAt || new Date(Date.now() + 30*24*60*60*1000)
                        }
                    })
                }
            } catch (err) {
                console.log('Coupon update skipped:', err.message)
            }
        }

        // Clear user's cart
        try {
                    const { authOptions } = await import('@/lib/auth')
await prisma.cartItem.deleteMany({
                where: { userId: user.id }
            })
        } catch (err) {
            console.log('Cart clear skipped:', err.message)
        }

        // Calculate CrashCash reward (10% of server subtotal OR product-specific CrashCash value)
        let totalCrashCashEarned = 0

        // Check if items have specific crashCashValue
        for (const item of validatedItems) {
            if (item.crashCashValue && item.crashCashValue > 0) {
                totalCrashCashEarned += item.crashCashValue * item.quantity
            }
        }

        // If no product-specific CrashCash, use 10% of server subtotal
        if (totalCrashCashEarned === 0) {
            totalCrashCashEarned = Math.floor(serverSubtotal * 0.1)
        }
        
        // Add CrashCash to user's balance immediately (regardless of scratch card win/loss)
        let crashCashAdded = false
        try {
                    const { authOptions } = await import('@/lib/auth')
console.log(`💰 Calculating CrashCash: ${totalCrashCashEarned} for order ${order.id}`)
            
            // ✅ Use unified storage to add CrashCash (prevents deadlocks)
            const result = await unifiedStorage.addCrashCash(
                user.id,
                totalCrashCashEarned,
                'order_placed',
                order.id
            )
            
            if (result.success) {
                console.log(`✅ CrashCash reward created: ${result.reward.id}`)
                console.log(`✅ Added ₹${totalCrashCashEarned} CrashCash to user ${user.email}`)
                console.log(`✅ New balance: ₹${result.newBalance} (expires ${new Date(result.reward.expiresAt).toLocaleDateString()})`)
                crashCashAdded = true
            } else {
                console.error('❌ Failed to add CrashCash:', result.error)
                console.error('❌ Will return 0 as crashCashEarned to prevent misleading user')
            }
        } catch (cashError) {
            console.error('❌ Failed to add CrashCash:', cashError.message)
            console.error('❌ CrashCash error stack:', cashError.stack)
            // Don't fail the order if CrashCash update fails
        }

        // Fetch the complete order with relations for email
        const completeOrder = await prisma.order.findUnique({
            where: { id: order.id },
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

        // Send beautiful order placed email with invoice
        // Send for ALL payment methods: COD, Card, UPI, Net Banking
        try {
                    const { authOptions } = await import('@/lib/auth')
console.log(`📧 Sending order confirmation for payment method: ${paymentMethodEnum}`)
            console.log(`📧 Preparing to send order confirmation email to ${user.email}`)
            
            // Prepare invoice/email data with full price breakdown
            const waiverReason = feesAreFreeByThreshold
                ? 'free delivery threshold'
                : 'waived via coupon'

            const deliveryBreakdown = {
                shipping: {
                    amount: Number(shippingForOrder || 0),
                    base: Number(baseShipping || 0),
                    reason: (shippingForOrder === 0 && Number(baseShipping || 0) > 0) ? waiverReason : null
                },
                convenience: {
                    amount: Number(convenienceForOrder || 0),
                    base: Number(convenienceFee || 0),
                    reason: (convenienceForOrder === 0 && Number(convenienceFee || 0) > 0) ? waiverReason : null
                },
                platform: {
                    amount: Number(platformForOrder || 0),
                    base: Number(platformFee || 0),
                    reason: (platformForOrder === 0 && Number(platformFee || 0) > 0) ? waiverReason : null
                }
            }

            const invoiceData = {
                orderId: completeOrder.id,
                customerName: user.name || user.email.split('@')[0],
                customerEmail: user.email,
                customerPhone: user.phone || address.phone || 'N/A',
                items: completeOrder.orderItems.map(item => ({
                    name: item.product?.name || 'Product',
                    quantity: item.quantity,
                    price: item.price,
                    product: item.product,
                    images: item.product?.images || []
                })),
                subtotal: serverSubtotal,
                discount: couponDiscount,
                couponDiscount: couponDiscount,
                deliveryBreakdown,
                deliveryCharge,
                crashCashApplied: 0,
                total: finalTotal,
                address: address,
                paymentMethod: paymentMethodEnum,
                isPaid: isPaidInitially,
                orderDate: completeOrder.createdAt
            }

            console.log(`📄 Skipping invoice generation in dev; sending confirmation without PDF`)
            try {
                        const { authOptions } = await import('@/lib/auth')
await sendOrderConfirmationWithInvoice(
                    user.email,
                    {
                        orderId: completeOrder.id,
                        items: completeOrder.orderItems.map(item => ({
                            name: item.product?.name || 'Product',
                            quantity: item.quantity,
                            price: item.price,
                            images: item.product?.images || []
                        })),
                        subtotal: serverSubtotal,
                        discount: couponDiscount,
                        couponDiscount: couponDiscount,
                        deliveryBreakdown,
                        deliveryCharge,
                        total: finalTotal,
                        paymentMethod: paymentMethodEnum,
                        isPaid: isPaidInitially,
                        address: address
                    },
                    null,
                    user.name || address?.name || user.email.split('@')[0] || 'Customer'
                )
                console.log('✅ Order placed email sent without invoice to:', user.email)
            } catch (emailFallbackErr) {
                console.error('Failed to send order confirmation email:', emailFallbackErr)
            }
            console.log('📧 Email sent for payment method:', paymentMethodEnum)
            if (paymentMethodEnum === 'CASHFREE') {
                console.log('🔔 Waiting for Cashfree webhook to confirm payment (Card/UPI/Net Banking)')
            }
        } catch (emailError) {
            console.error('❌ Failed to send order placed email:', emailError.message)
            console.error('❌ Email error stack:', emailError.stack)
            console.error('❌ Full email error:', emailError)
            // Don't fail the order if email fails
        }

        // Send order confirmation email with tracking link using automated trigger
        try {
                    const { authOptions } = await import('@/lib/auth')
const orderData = {
                items: validatedItems.map(item => ({
                    name: item.name,
                    quantity: item.quantity,
                    price: item.price
                })),
                subtotal: serverSubtotal,
                discount: discount || 0,
                crashCashApplied: 0
            }

            await triggerOrderConfirmationEmail(order, user, address, orderData)
        } catch (emailErr) {
            console.error('Email sending failed (non-critical):', emailErr.message)
            // Don't fail the order if email fails
        }

        // Return success
        return Response.json(
            {
                success: true,
                orderId: order.id,
                order: {
                    id: order.id,
                    total: order.total,
                    status: order.status,
                    paymentMethod: order.paymentMethod,
                    createdAt: order.createdAt,
                    itemsCount: order.orderItems.length
                },
                crashCashEarned: crashCashAdded ? totalCrashCashEarned : 0,
                message: 'Order created successfully'
            },
            { status: 200 }
        )

    } catch (error) {
        console.error('Order Creation Error:', error.message)
        return Response.json(
            { message: error.message || 'Failed to create order' },
            { status: 500 }
        )
    }
}
