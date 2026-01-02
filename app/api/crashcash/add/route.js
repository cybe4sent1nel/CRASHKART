import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { extractBearerToken, verifyUserToken } from '@/lib/authTokens'
import unifiedStorage from '@/lib/unifiedStorage'

// Prevent Next.js from attempting to pre-render this route
export const dynamic = 'force-dynamic'

const prisma = new PrismaClient()

export async function POST(req) {
    try {
        const { authOptions } = await import('@/lib/auth');
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

        const { amount, source = 'scratch_card', orderId } = await req.json()
        const normalizedSource = String(source || 'scratch_card').replace('-', '_')
        
        console.log(`🔵 Request:`, { amount, source: normalizedSource, orderId })

        if (!amount || amount <= 0) {
            console.error('❌ Invalid amount:', amount)
            return Response.json(
                { message: 'Invalid amount' },
                { status: 400 }
            )
        }

        // ✅ Use unified storage to add CrashCash (30-day expiry)
        console.log(`🔵 Calling unifiedStorage.addCrashCash...`)
        const result = await unifiedStorage.addCrashCash(user.id, amount, normalizedSource, orderId)

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
