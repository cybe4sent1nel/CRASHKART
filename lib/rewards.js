import prisma from './prisma'
import unifiedStorage from './unifiedStorage'

// Create a CrashCash reward and increment user's balance.
// source: 'order_placed' (30 days) | 'scratch_card'|'coupon' (15 days) | 'welcome_bonus'
export async function createCrashCashReward({ userId, orderId = null, amount = 0, source = 'order_placed', productName = null, productImage = null }) {
    if (!userId || !amount || amount <= 0) return null

    console.log(`💰 Creating CrashCash reward via unified storage:`, { userId, amount, source, orderId })
    
    // ✅ Use unified storage system for consistency
    const result = await unifiedStorage.addCrashCash(userId, amount, source, orderId)
    
    if (!result.success) {
        console.error('❌ Failed to add CrashCash via unified storage:', result.error)
        return null
    }

    // Create notification
    try {
        const notification = await prisma.notification.create({
            data: {
                userId,
                title: 'CrashCash Credited',
                message: `You received ₹${amount} CrashCash${orderId ? ' for order ' + orderId : ''}.`,
                type: 'success',
                link: '/crashcash'
            }
        })
        
        console.log(`✅ CrashCash reward created successfully. New balance: ₹${result.newBalance}`)
        
        return { 
            reward: result.reward, 
            user: { crashCashBalance: result.newBalance },
            notification 
        }
    } catch (notifError) {
        console.error('⚠️ Failed to create notification:', notifError)
        // Still return success since CrashCash was added
        return { 
            reward: result.reward, 
            user: { crashCashBalance: result.newBalance }
        }
    }
}

// Expire rewards that have passed their expiresAt and decrement user balances accordingly
export async function expireDueCrashCashRewards() {
    const now = new Date()
    // Find active rewards that have expired
    const expiredRewards = await prisma.crashCashReward.findMany({
        where: {
            status: 'active',
            expiresAt: { lte: now }
        }
    })

    if (!expiredRewards || expiredRewards.length === 0) return { expiredCount: 0 }

    // Group by userId
    const byUser = expiredRewards.reduce((acc, r) => {
        acc[r.userId] = acc[r.userId] || { total: 0, ids: [] }
        acc[r.userId].total += Number(r.amount || 0)
        acc[r.userId].ids.push(r.id)
        return acc
    }, {})

    // For each user, expire rewards and decrement balance
    for (const userId of Object.keys(byUser)) {
        const { total, ids } = byUser[userId]
        try {
            // Read current balance, compute clamped balance, then update in a transaction
            const user = await prisma.user.findUnique({ where: { id: userId }, select: { crashCashBalance: true } })
            const current = Number(user?.crashCashBalance || 0)
            const newBalance = Math.max(0, current - Number(total || 0))

            await prisma.$transaction([
                prisma.crashCashReward.updateMany({
                    where: { id: { in: ids }, status: 'active' },
                    data: { status: 'expired' }
                }),
                prisma.user.update({
                    where: { id: userId },
                    data: { crashCashBalance: newBalance }
                })
            ])
        } catch (err) {
            console.error('Failed to expire rewards for user', userId, err)
        }
    }

    return { expiredCount: expiredRewards.length }
}

export default { createCrashCashReward, expireDueCrashCashRewards }
