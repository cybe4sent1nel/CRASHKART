/**
 * CrashCash Storage Management
 * Handles localStorage operations for CrashCash with 30-day expiry
 */

/**
 * Save CrashCash reward to localStorage with 30-day expiry
 * @param {string} orderId - The order ID
 * @param {number} amount - CrashCash amount earned
 * @param {string} source - Source of CrashCash ('order', 'scratch', 'bonus')
 */
export function saveCrashCashReward(orderId, amount, source = 'order') {
    if (typeof window === 'undefined') return

    try {
        // Calculate expiry date (30 days from now)
        const expiryDate = new Date()
        expiryDate.setDate(expiryDate.getDate() + 30)

        // Create reward object
        const reward = {
            orderId,
            amount,
            source,
            awardedAt: new Date().toISOString(),
            expiresAt: expiryDate.toISOString(),
            type: 'crashcash'
        }

        // Get existing rewards
        const existingRewards = JSON.parse(localStorage.getItem('orderCrashCashRewards') || '[]')

        // Check if this order's reward already exists
        const existingIndex = existingRewards.findIndex(r => r.orderId === orderId)
        
        if (existingIndex !== -1) {
            // Update existing reward
            existingRewards[existingIndex] = reward
            console.log(`🔄 Updated CrashCash reward for order ${orderId}`)
        } else {
            // Add new reward
            existingRewards.push(reward)
            console.log(`✅ Saved CrashCash reward: ₹${amount} for order ${orderId} (expires ${expiryDate.toLocaleDateString()})`)
        }

        // Save to localStorage
        localStorage.setItem('orderCrashCashRewards', JSON.stringify(existingRewards))

        // Update total balance
        updateCrashCashBalance()

        // Dispatch event to notify other components
        window.dispatchEvent(new CustomEvent('crashcash-update', { detail: { amount, source } }))

        return reward
    } catch (error) {
        console.error('❌ Failed to save CrashCash reward:', error)
        return null
    }
}

/**
 * Calculate total CrashCash balance from all sources
 * Automatically removes expired rewards
 */
export function updateCrashCashBalance() {
    if (typeof window === 'undefined') return 0

    try {
        const now = new Date()
        let totalBalance = 0

        // Get order rewards
        const orderRewards = JSON.parse(localStorage.getItem('orderCrashCashRewards') || '[]')
        const validOrderRewards = orderRewards.filter(reward => {
            // Remove expired rewards
            if (reward.expiresAt && new Date(reward.expiresAt) < now) {
                console.log(`⏰ CrashCash expired for order ${reward.orderId}`)
                return false
            }
            return true
        })

        // Get scratch card rewards
        const scratchRewards = JSON.parse(localStorage.getItem('scratchCardRewards') || '[]')
        const validScratchRewards = scratchRewards.filter(reward => {
            if (reward.type === 'reward' && reward.rewardType === 'crashcash') {
                // Check expiry if exists
                if (reward.expiresAt && new Date(reward.expiresAt) < now) {
                    console.log(`⏰ Scratch reward expired`)
                    return false
                }
                return true
            }
            return false
        })

        // Calculate total balance
        validOrderRewards.forEach(reward => {
            totalBalance += reward.amount || 0
        })

        validScratchRewards.forEach(reward => {
            totalBalance += reward.crashcash || 0
        })

        // Save cleaned up rewards
        localStorage.setItem('orderCrashCashRewards', JSON.stringify(validOrderRewards))
        localStorage.setItem('scratchCardRewards', JSON.stringify(scratchRewards)) // Keep all scratch rewards

        // Save total balance
        localStorage.setItem('crashcashBalance', JSON.stringify(totalBalance))

        console.log(`💰 Total CrashCash balance: ₹${totalBalance}`)
        return totalBalance
    } catch (error) {
        console.error('❌ Failed to update CrashCash balance:', error)
        return 0
    }
}

/**
 * Get all valid (non-expired) CrashCash rewards
 */
export function getValidCrashCashRewards() {
    if (typeof window === 'undefined') return []

    try {
        const now = new Date()
        const orderRewards = JSON.parse(localStorage.getItem('orderCrashCashRewards') || '[]')
        
        return orderRewards.filter(reward => {
            if (!reward.expiresAt) return true
            return new Date(reward.expiresAt) >= now
        })
    } catch (error) {
        console.error('❌ Failed to get CrashCash rewards:', error)
        return []
    }
}

/**
 * Clear expired CrashCash rewards
 * Returns number of expired rewards removed
 */
export function clearExpiredRewards() {
    if (typeof window === 'undefined') return 0

    try {
        const now = new Date()
        const orderRewards = JSON.parse(localStorage.getItem('orderCrashCashRewards') || '[]')
        
        const validRewards = orderRewards.filter(reward => {
            if (!reward.expiresAt) return true
            return new Date(reward.expiresAt) >= now
        })

        const removedCount = orderRewards.length - validRewards.length

        if (removedCount > 0) {
            localStorage.setItem('orderCrashCashRewards', JSON.stringify(validRewards))
            updateCrashCashBalance()
            console.log(`🗑️ Removed ${removedCount} expired CrashCash reward(s)`)
        }

        return removedCount
    } catch (error) {
        console.error('❌ Failed to clear expired rewards:', error)
        return 0
    }
}

/**
 * Initialize CrashCash storage on app load
 * Call this once on app initialization
 */
export function initializeCrashCashStorage() {
    if (typeof window === 'undefined') return

    // Clear expired rewards
    clearExpiredRewards()

    // Update balance
    updateCrashCashBalance()

    console.log('✅ CrashCash storage initialized')
}
