/**
 * Cleanup script to remove duplicate scratch card rewards
 * Run with: node scripts/cleanup-duplicate-rewards.js
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function cleanupDuplicates() {
    try {
        console.log('🔍 Finding duplicate scratch card rewards...')
        
        // Find all users with scratch card rewards
        const rewards = await prisma.crashCashReward.findMany({
            where: {
                source: 'scratch_card'
            },
            orderBy: {
                earnedAt: 'asc'
            }
        })
        
        console.log(`Found ${rewards.length} total scratch card rewards`)
        
        // Group by userId + amount + earnedAt (within 1 minute)
        const duplicateGroups = new Map()
        
        rewards.forEach(reward => {
            const minute = Math.floor(new Date(reward.earnedAt).getTime() / 60000)
            const key = `${reward.userId}_${reward.amount}_${minute}`
            
            if (!duplicateGroups.has(key)) {
                duplicateGroups.set(key, [])
            }
            duplicateGroups.get(key).push(reward)
        })
        
        // Find groups with duplicates
        let totalDuplicates = 0
        let deletedCount = 0
        
        for (const [key, group] of duplicateGroups.entries()) {
            if (group.length > 1) {
                console.log(`\n⚠️ Found ${group.length} duplicates for key: ${key}`)
                totalDuplicates += group.length - 1
                
                // Keep the first one, delete the rest
                const [keep, ...toDelete] = group
                console.log(`✅ Keeping reward: ${keep.id} (${keep.amount}, ${keep.earnedAt})`)
                
                for (const dup of toDelete) {
                    console.log(`❌ Deleting duplicate: ${dup.id} (${dup.amount}, ${dup.earnedAt})`)
                    
                    // Delete the duplicate
                    await prisma.crashCashReward.delete({
                        where: { id: dup.id }
                    })
                    
                    deletedCount++
                }
            }
        }
        
        console.log(`\n✅ Cleanup complete!`)
        console.log(`   Total duplicates found: ${totalDuplicates}`)
        console.log(`   Rewards deleted: ${deletedCount}`)
        
        // Recalculate balances for affected users
        console.log('\n🔄 Recalculating user balances...')
        const affectedUsers = [...new Set(rewards.map(r => r.userId))]
        
        for (const userId of affectedUsers) {
            const userRewards = await prisma.crashCashReward.findMany({
                where: {
                    userId: userId,
                    status: 'active'
                }
            })
            
            const correctBalance = userRewards.reduce((sum, r) => sum + r.amount, 0)
            
            await prisma.user.update({
                where: { id: userId },
                data: { crashCashBalance: correctBalance }
            })
            
            console.log(`✅ Updated balance for user ${userId}: ₹${correctBalance}`)
        }
        
        console.log('\n✅ All done!')
        
    } catch (error) {
        console.error('❌ Error during cleanup:', error)
    } finally {
        await prisma.$disconnect()
    }
}

cleanupDuplicates()
