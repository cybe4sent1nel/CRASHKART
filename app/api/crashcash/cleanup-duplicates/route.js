import { getCurrentSession } from '@/lib/session'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(req) {
    try {
        const user = await getCurrentSession(req)
        
        if (!user || !user.userId) {
            return Response.json({ message: 'Unauthorized' }, { status: 401 })
        }

        console.log(`🔍 Cleaning up duplicate rewards for user ${user.userId}...`)

        // Find all rewards for this user
        const allRewards = await prisma.crashCashReward.findMany({
            where: {
                userId: user.userId,
                status: 'active'
            },
            orderBy: {
                earnedAt: 'asc'
            }
        })

        console.log(`📊 Found ${allRewards.length} total rewards`)

        // Group by source + amount + earnedAt (within 1 minute)
        const duplicateGroups = new Map()
        
        allRewards.forEach(reward => {
            const minute = Math.floor(new Date(reward.earnedAt).getTime() / 60000)
            const key = `${reward.source}_${reward.amount}_${minute}`
            
            if (!duplicateGroups.has(key)) {
                duplicateGroups.set(key, [])
            }
            duplicateGroups.get(key).push(reward)
        })

        // Find and delete duplicates (keep first, delete rest)
        let deletedCount = 0
        let deletedIds = []
        let keptRewards = []

        for (const [key, group] of duplicateGroups.entries()) {
            if (group.length > 1) {
                const [keep, ...toDelete] = group
                console.log(`⚠️ Found ${group.length} duplicates for ${key}`)
                console.log(`✅ Keeping: ${keep.id} (₹${keep.amount} from ${keep.source})`)
                
                keptRewards.push(keep)
                
                for (const dup of toDelete) {
                    console.log(`❌ Deleting: ${dup.id} (₹${dup.amount} from ${dup.source})`)
                    await prisma.crashCashReward.delete({
                        where: { id: dup.id }
                    })
                    deletedIds.push(dup.id)
                    deletedCount++
                }
            } else {
                keptRewards.push(group[0])
            }
        }

        // Recalculate user balance
        const correctBalance = keptRewards.reduce((sum, r) => sum + r.amount, 0)
        
        await prisma.user.update({
            where: { id: user.userId },
            data: { crashCashBalance: correctBalance }
        })

        console.log(`✅ Cleanup complete: Deleted ${deletedCount} duplicates, new balance: ₹${correctBalance}`)

        return Response.json({
            success: true,
            deletedCount,
            deletedIds,
            newBalance: correctBalance,
            message: `Removed ${deletedCount} duplicate rewards. New balance: ₹${correctBalance}`
        })

    } catch (error) {
        console.error('❌ Cleanup error:', error)
        return Response.json(
            { success: false, message: 'Failed to cleanup duplicates' },
            { status: 500 }
        )
    }
}
