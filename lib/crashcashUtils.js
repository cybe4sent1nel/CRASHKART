/**
 * CrashCash Utilities for order-based rewards
 */

/**
 * Get random CrashCash amount for a product
 * @param {number} minCashCash - Minimum amount (typically 5 or 10)
 * @param {number} maxCashCash - Maximum amount (from product)
 * @returns {number} Random amount between min and max
 */
export const getRandomCrashCashReward = (minCashCash = 10, maxCashCash = 240) => {
    // Ensure min is at least 10
    const finalMin = Math.max(minCashCash || 10, 10)
    const finalMax = Math.max(maxCashCash || 240, finalMin)
    
    if (finalMax <= finalMin) {
        return finalMin
    }
    return Math.floor(Math.random() * (finalMax - finalMin + 1)) + finalMin
}

/**
 * Award CrashCash for an order
 * @param {Object} order - Order object containing products
 * @param {Array} allProducts - Full product data for crash cash values
 * @returns {Object} Total CrashCash awarded and breakdown
 */
export const awardCrashCashForOrder = (order, allProducts = []) => {
    let totalCrashCash = 0
    const itemBreakdown = []

    // Calculate based on product crashCashMin/Max values
    if (order && order.length > 0) {
        order.forEach(item => {
            // Try to get full product data
            let crashCashMin = 10
            let crashCashMax = 240
            let productName = item.name || 'Unknown Product'
            
            // If we have allProducts data, find matching product
            if (allProducts && allProducts.length > 0) {
                const fullProduct = allProducts.find(p => p.id === item.id)
                if (fullProduct) {
                    crashCashMin = fullProduct.crashCashMin || 10
                    crashCashMax = fullProduct.crashCashMax || 240
                    productName = fullProduct.name
                }
            }
            
            // Award random amount between min and max
            const reward = getRandomCrashCashReward(crashCashMin, crashCashMax)
            totalCrashCash += reward
            
            itemBreakdown.push({
                productId: item.id,
                productName: productName,
                earned: reward,
                min: crashCashMin,
                max: crashCashMax
            })
        })
    }

    // Store in localStorage only if we have rewards
    if (totalCrashCash > 0) {
        const currentBalance = JSON.parse(localStorage.getItem('crashcashBalance') || '0')
        const newBalance = currentBalance + totalCrashCash

        localStorage.setItem('crashcashBalance', JSON.stringify(newBalance))

        // Store wallet entry with order details
        const userCrashCash = JSON.parse(localStorage.getItem('userCrashCash') || '[]')
        const expiryDate = new Date()
        expiryDate.setDate(expiryDate.getDate() + 30) // Valid for 30 days
        
        userCrashCash.push({
            code: `ORDER-${order.id || Date.now()}`,
            amount: totalCrashCash,
            source: 'Order Purchase',
            orderId: order.id || `order_${Date.now()}`,
            itemBreakdown: itemBreakdown,
            earnedAt: new Date().toISOString(),
            orderDate: order.createdAt || new Date().toISOString(),
            expiryDate: expiryDate.toISOString(),
            status: 'active'
        })
        localStorage.setItem('userCrashCash', JSON.stringify(userCrashCash))

        // Also store in order rewards for history
        const orderRewards = JSON.parse(localStorage.getItem('orderCrashCashRewards') || '[]')
        orderRewards.push({
            orderId: order.id || `order_${Date.now()}`,
            amount: totalCrashCash,
            itemCount: (order && order.length) || 0,
            itemBreakdown: itemBreakdown,
            awardedAt: new Date().toLocaleString(),
            orderDate: new Date(order.createdAt || new Date()).toLocaleString(),
            expiryDate: expiryDate.toLocaleString()
        })
        localStorage.setItem('orderCrashCashRewards', JSON.stringify(orderRewards))

        // Emit storage event for real-time update
        window.dispatchEvent(new Event('storage'))
    }

    return {
        total: totalCrashCash,
        itemBreakdown: itemBreakdown
    }
}

/**
 * Get all order-based CrashCash rewards
 * @returns {Array} Array of order reward records
 */
export const getOrderCrashCashRewards = () => {
    return JSON.parse(localStorage.getItem('orderCrashCashRewards') || '[]')
}

/**
 * Get total CrashCash from orders
 * @returns {number} Sum of all order rewards
 */
export const getTotalOrderCrashCash = () => {
    const rewards = getOrderCrashCashRewards()
    return rewards.reduce((sum, reward) => sum + reward.amount, 0)
}

/**
 * Clear order rewards (for testing)
 */
export const clearOrderRewards = () => {
    localStorage.removeItem('orderCrashCashRewards')
}

/**
 * Get CrashCash details for display
 * @returns {Object} CrashCash breakdown
 */
export const getCrashCashBreakdown = () => {
    const scratchRewards = JSON.parse(localStorage.getItem('scratchCardRewards') || '[]')
    const orderRewards = getOrderCrashCashRewards()

    const scratchCrashCash = scratchRewards
        .filter(r => r.rewardType === 'crashcash')
        .reduce((sum, r) => sum + (r.crashcash || 0), 0)

    const orderCrashCash = getTotalOrderCrashCash()
    const totalBalance = JSON.parse(localStorage.getItem('crashcashBalance') || '0')

    return {
        total: totalBalance,
        fromScratch: scratchCrashCash,
        fromOrders: orderCrashCash,
        scratchRewards: scratchRewards.filter(r => r.rewardType === 'crashcash'),
        orderRewards: orderRewards
    }
}

/**
 * Calculate CrashCash for a product based on price
 * @param {number} price - Product price
 * @returns {number} CrashCash value (10% of price, min 5)
 */
export const calculateProductCrashCash = (price) => {
    const calculated = Math.floor(price * 0.1)
    return Math.max(calculated, 5)
}

/**
 * Simulate order placement and award CrashCash
 * (For development/testing)
 */
export const simulateOrderReward = (itemPrice = 1000) => {
    const crashCash = getRandomCrashCashReward(5, Math.floor(itemPrice * 0.1))
    
    const currentBalance = JSON.parse(localStorage.getItem('crashcashBalance') || '0')
    const newBalance = currentBalance + crashCash
    localStorage.setItem('crashcashBalance', JSON.stringify(newBalance))

    // Record the reward
    const rewards = JSON.parse(localStorage.getItem('orderCrashCashRewards') || '[]')
    rewards.push({
        orderId: `test_order_${Date.now()}`,
        amount: crashCash,
        itemCount: 1,
        awardedAt: new Date().toLocaleString(),
        orderDate: new Date().toLocaleString()
    })
    localStorage.setItem('orderCrashCashRewards', JSON.stringify(rewards))

    window.dispatchEvent(new Event('storage'))

    return {
        crashCashAwarded: crashCash,
        newBalance,
        message: `₹${crashCash} CrashCash awarded for order!`
    }
}
