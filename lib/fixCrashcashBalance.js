/**
 * Fix CrashCash Balance - Recalculate from actual rewards
 * This should be called once to fix any accumulated balance errors
 */
export function fixCrashcashBalance() {
    if (typeof window === 'undefined') return
    
    try {
        // Get scratch card rewards
        const scratchRewards = JSON.parse(localStorage.getItem('scratchCardRewards') || '[]')
        
        // Get order rewards
        const orderRewards = JSON.parse(localStorage.getItem('orderCrashCashRewards') || '[]')
        
        // Calculate correct balance
        let correctBalance = 0
        
        // Add from scratch cards
        const validScratchRewards = scratchRewards.filter(r => r.type === 'reward')
        validScratchRewards.forEach(reward => {
            if (reward.rewardType === 'crashcash' && reward.crashcash) {
                correctBalance += reward.crashcash
            } else if (reward.rewardType === 'discount') {
                // For discount rewards, add the bonus crashcash if any
                correctBalance += reward.bonusCrashcash || 0
            }
        })
        
        // Add from orders
        orderRewards.forEach(order => {
            if (order.amount) {
                correctBalance += order.amount
            }
        })
        
        // Update localStorage with correct balance
        localStorage.setItem('crashcashBalance', JSON.stringify(correctBalance))
        
        console.log('✅ CrashCash Balance Fixed')
        console.log(`Total Scratch Rewards: ${validScratchRewards.length}`)
        console.log(`Total Order Rewards: ${orderRewards.length}`)
        console.log(`Correct Balance: ₹${correctBalance}`)
        
        // Dispatch event to update UI
        window.dispatchEvent(new Event('storage'))
        window.dispatchEvent(new Event('crashcash-update'))
        
        return correctBalance
    } catch (error) {
        console.error('Error fixing crashcash balance:', error)
        return null
    }
}

/**
 * Get a detailed breakdown of where cashcash is coming from
 */
export function getCrashcashBreakdown() {
    if (typeof window === 'undefined') return null
    
    try {
        const scratchRewards = JSON.parse(localStorage.getItem('scratchCardRewards') || '[]')
        const orderRewards = JSON.parse(localStorage.getItem('orderCrashCashRewards') || '[]')
        
        const validScratchRewards = scratchRewards.filter(r => r.type === 'reward')
        
        const breakdown = {
            scratchCardRewards: [],
            orderRewards: [],
            totalFromScratch: 0,
            totalFromOrders: 0,
            correctTotal: 0
        }
        
        // Process scratch rewards
        validScratchRewards.forEach(reward => {
            if (reward.rewardType === 'crashcash' && reward.crashcash) {
                breakdown.scratchCardRewards.push({
                    type: 'crashcash',
                    amount: reward.crashcash,
                    date: reward.scratchedAt,
                    id: reward.id
                })
                breakdown.totalFromScratch += reward.crashcash
            } else if (reward.rewardType === 'discount') {
                breakdown.scratchCardRewards.push({
                    type: 'discount',
                    discount: reward.discount,
                    bonusCash: reward.bonusCrashcash || 0,
                    date: reward.scratchedAt,
                    id: reward.id
                })
                breakdown.totalFromScratch += reward.bonusCrashcash || 0
            }
        })
        
        // Process order rewards
        orderRewards.forEach(order => {
            if (order.amount) {
                breakdown.orderRewards.push({
                    amount: order.amount,
                    orderId: order.orderId,
                    itemCount: order.itemCount,
                    date: order.awardedAt
                })
                breakdown.totalFromOrders += order.amount
            }
        })
        
        breakdown.correctTotal = breakdown.totalFromScratch + breakdown.totalFromOrders
        
        return breakdown
    } catch (error) {
        console.error('Error getting cashcash breakdown:', error)
        return null
    }
}

/**
 * Remove duplicate rewards if any exist
 */
export function removeDuplicateRewards() {
    if (typeof window === 'undefined') return
    
    try {
        const scratchRewards = JSON.parse(localStorage.getItem('scratchCardRewards') || '[]')
        const orderRewards = JSON.parse(localStorage.getItem('orderCrashCashRewards') || '[]')
        
        // Remove duplicate scratch rewards based on ID and scratchedAt time
        const uniqueScratchRewards = scratchRewards.reduce((acc, current) => {
            const isDuplicate = acc.some(item => 
                item.id === current.id || 
                (item.scratchedAt === current.scratchedAt && item.rewardType === current.rewardType)
            )
            if (!isDuplicate) {
                acc.push(current)
            }
            return acc
        }, [])
        
        // Remove duplicate order rewards based on orderId
        const uniqueOrderRewards = orderRewards.reduce((acc, current) => {
            const isDuplicate = acc.some(item => item.orderId === current.orderId)
            if (!isDuplicate) {
                acc.push(current)
            }
            return acc
        }, [])
        
        // Save cleaned data
        localStorage.setItem('scratchCardRewards', JSON.stringify(uniqueScratchRewards))
        localStorage.setItem('orderCrashCashRewards', JSON.stringify(uniqueOrderRewards))
        
        console.log('✅ Duplicates Removed')
        console.log(`Scratch Rewards: ${scratchRewards.length} → ${uniqueScratchRewards.length}`)
        console.log(`Order Rewards: ${orderRewards.length} → ${uniqueOrderRewards.length}`)
        
        // Recalculate balance
        return fixCrashcashBalance()
    } catch (error) {
        console.error('Error removing duplicates:', error)
        return null
    }
}
