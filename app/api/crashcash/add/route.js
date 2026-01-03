import { PrismaClient } from '@prisma/client'
import { getCurrentSession } from '@/lib/session'
import { extractBearerToken, verifyUserToken } from '@/lib/authTokens'
import unifiedStorage from '@/lib/unifiedStorage'

// Prevent Next.js from attempting to pre-render this route
export const dynamic = 'force-dynamic'

const prisma = new PrismaClient()

export async function POST(req) {
    try {
        console.log('\n🔵 /api/crashcash/add START');
        
        const session = await getCurrentSession()
        let user = null

        if (session?.user?.email) {
            console.log(`🔵 Found session for: ${session.user.email}`)
            user = await prisma.user.findUnique({ where: { email: session.user.email } })
        }

        if (!user) {
            try {
                console.log('🔵 No session, trying token auth...');
                const token = extractBearerToken(req);
                const { decoded } = await verifyUserToken(token)
                console.log(`🔵 Token verified for user: ${decoded.userId}`)
                user = await prisma.user.findUnique({ where: { id: decoded.userId } })
            } catch (authErr) {
                console.error('❌ Auth failed:', authErr.message)
                return Response.json(
                    { message: authErr.message || 'Unauthorized' },
                    { status: authErr.status || 401 }
                )
            }
        }
        
        if (!user) {
            console.error('❌ User not found after auth')
            return Response.json({ message: 'User not found' }, { status: 404 })
        }
        
        console.log(`✅ Authenticated user: ${user.email} (${user.id})`)

        const { amount, source = 'scratch_card', orderId, scratchSessionId } = await req.json()
        const normalizedSource = String(source || 'scratch_card').replace('-', '_')
        
        console.log(`🔵 Request:`, { amount, source: normalizedSource, orderId, scratchSessionId })
        
        // REQUEST-LEVEL LOCK: Prevent concurrent requests from same user
        const lockKey = `${user.id}_${normalizedSource}_${amount}`
        if (requestLocks.has(lockKey)) {
            console.log('⚠️ REQUEST BLOCKED: Concurrent request detected', lockKey)
            return Response.json(
                { success: false, message: 'Request already in progress' },
                { status: 429 }
            )
        }
        
        // Set lock
        requestLocks.set(lockKey, Date.now())
        
        // Auto-cleanup lock after 5 seconds
        setTimeout(() => requestLocks.delete(lockKey), 5000)

        if (!amount || amount <= 0) {
            console.error('❌ Invalid amount:', amount)
            return Response.json(
                { message: 'Invalid amount' },
                { status: 400 }
            )
        }

        // For scratch cards, check if this session was already claimed
        if (normalizedSource === 'scratch_card' && scratchSessionId) {
            const existing = await prisma.crashCashReward.findFirst({
                where: {
                    userId: user.id,
                    source: 'scratch_card',
                    scratchSessionId: scratchSessionId
                }
            })
            
            if (existing) {
                console.log('⚠️ Scratch card already claimed for this session:', scratchSessionId)
                return Response.json(
                    { message: 'Reward already claimed for this scratch session' },
                    { status: 409 }
                )
            }
        }
        
        // UNIVERSAL DUPLICATE GUARD: Check for ANY duplicate by time + amount + user + source
        // If same user claimed same amount from same source within last 10 seconds, block it
        const tenSecondsAgo = new Date(Date.now() - 10000)
        
        // Use a transaction to prevent race conditions between check and insert
        const duplicateCheck = await prisma.$transaction(async (tx) => {
            // Check for recent duplicate
            const recentDuplicate = await tx.crashCashReward.findFirst({
                where: {
                    userId: user.id,
                    source: normalizedSource, // ✅ Check source/method too!
                    amount: amount,
                    earnedAt: {
                        gte: tenSecondsAgo
                    }
                },
                orderBy: {
                    earnedAt: 'desc'
                }
            })
            
            return recentDuplicate
        })
        
        if (duplicateCheck) {
            requestLocks.delete(lockKey) // Release lock
            const timeDiffMs = Date.now() - new Date(duplicateCheck.earnedAt).getTime()
            console.log('⚠️ DUPLICATE DETECTED - Same user, amount, source within 10s:', {
                userId: user.id,
                source: normalizedSource,
                amount: amount,
                recentId: duplicateCheck.id,
                recentTimestamp: duplicateCheck.earnedAt,
                timeDiff: `${timeDiffMs}ms (${(timeDiffMs / 1000).toFixed(2)}s)`
            })
            return Response.json(
                { 
                    success: false,
                    message: `Duplicate ${normalizedSource} reward detected. Already claimed ₹${amount} from ${normalizedSource} ${(timeDiffMs / 1000).toFixed(1)}s ago.`,
                    existingReward: duplicateCheck.id
                },
                { status: 409 }
            )
        }

        // For orders, check if reward already exists
        if (normalizedSource === 'order_placed' && orderId) {
            const existing = await prisma.crashCashReward.findFirst({
                where: {
                    userId: user.id,
                    orderId: orderId
                }
            })
            
            if (existing) {
                console.log('⚠️ Order reward already exists for order:', orderId)
                return Response.json({
                    success: true,
                    reward: existing,
                    newBalance: user.crashCashBalance,
                    message: 'Reward already exists for this order'
                })
            }
        }

        // ✅ Use unified storage to add CrashCash (30-day expiry)
        console.log(`🔵 Calling unifiedStorage.addCrashCash...`)
        const result = await unifiedStorage.addCrashCash(user.id, amount, normalizedSource, orderId, scratchSessionId)

        if (!result.success) {
            console.error('❌ addCrashCash failed:', result.error)
            return Response.json(
                { message: result.error || 'Failed to add CrashCash' },
                { status: 500 }
            )
        }

        console.log(`✅ CrashCash added successfully. New balance: ₹${result.newBalance}`)
        console.log(`✅ /api/crashcash/add COMPLETE\n`)

        return Response.json({
            success: true,
            reward: result.reward,
            newBalance: result.newBalance,
            source: normalizedSource,
            message: `Successfully earned ₹${amount} CrashCash`
        })

    } catch (error) {
        console.error('❌ /api/crashcash/add ERROR:', error.message)
        console.error('❌ Stack:', error.stack)
        return Response.json(
            { message: error.message || 'Failed to add crash cash' },
            { status: 500 }
        )
    }
}

