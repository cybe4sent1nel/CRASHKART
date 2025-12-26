/**
 * FORCE BALANCE FIX - Directly corrects the balance in localStorage
 * This is the most aggressive fix - completely recalculates from scratch
 */

export function forceBalanceFix() {
    if (typeof window === 'undefined') return null

    try {
        console.log('=== FORCE BALANCE FIX STARTED ===')

        // Step 1: Get raw data
        const scratchRewardsRaw = localStorage.getItem('scratchCardRewards') || '[]'
        const orderRewardsRaw = localStorage.getItem('orderCrashCashRewards') || '[]'
        const oldBalance = localStorage.getItem('crashcashBalance') || '0'

        console.log('Raw data retrieved')
        console.log('Old balance:', oldBalance)

        // Step 2: Parse data
        let scratchRewards = []
        let orderRewards = []

        try {
            scratchRewards = JSON.parse(scratchRewardsRaw)
        } catch (e) {
            console.error('Failed to parse scratch rewards:', e)
            scratchRewards = []
        }

        try {
            orderRewards = JSON.parse(orderRewardsRaw)
        } catch (e) {
            console.error('Failed to parse order rewards:', e)
            orderRewards = []
        }

        console.log('Data parsed successfully')
        console.log('Scratch rewards:', scratchRewards.length, 'items')
        console.log('Order rewards:', orderRewards.length, 'items')

        // Step 3: Calculate total from all sources
        let calculatedTotal = 0
        const details = {
            scratchCrashcash: [],
            scratchDiscountBonus: [],
            orders: []
        }

        // Process scratch rewards
        scratchRewards.forEach((reward, index) => {
            console.log(`Processing scratch reward ${index}:`, reward)

            if (reward.type !== 'reward') {
                console.log(`  → Skipped (type: ${reward.type})`)
                return
            }

            if (reward.rewardType === 'crashcash') {
                const amount = reward.crashcash || 0
                if (amount > 0) {
                    calculatedTotal += amount
                    details.scratchCrashcash.push({
                        index,
                        amount,
                        date: reward.scratchedAt
                    })
                    console.log(`  → Added crashcash: +₹${amount}`)
                }
            } else if (reward.rewardType === 'discount') {
                const bonus = reward.bonusCrashcash || 0
                if (bonus > 0) {
                    calculatedTotal += bonus
                    details.scratchDiscountBonus.push({
                        index,
                        discount: reward.discount,
                        bonus,
                        date: reward.scratchedAt
                    })
                    console.log(`  → Added discount bonus: +₹${bonus}`)
                }
            }
        })

        // Process order rewards
        orderRewards.forEach((order, index) => {
            console.log(`Processing order reward ${index}:`, order)

            if (order.amount) {
                calculatedTotal += order.amount
                details.orders.push({
                    index,
                    amount: order.amount,
                    orderId: order.orderId,
                    date: order.awardedAt
                })
                console.log(`  → Added order reward: +₹${order.amount}`)
            }
        })

        console.log('Calculation complete')
        console.log('Calculated total:', calculatedTotal)

        // Step 4: Update localStorage
        const oldBalanceNum = parseInt(oldBalance)
        console.log(`Updating balance: ₹${oldBalanceNum} → ₹${calculatedTotal}`)

        localStorage.setItem('crashcashBalance', JSON.stringify(calculatedTotal))

        console.log('localStorage updated')

        // Step 5: Dispatch events
        window.dispatchEvent(new Event('storage'))
        window.dispatchEvent(new Event('crashcash-update'))

        console.log('Events dispatched')
        console.log('=== FORCE BALANCE FIX COMPLETE ===')

        return {
            success: true,
            oldBalance: oldBalanceNum,
            newBalance: calculatedTotal,
            difference: calculatedTotal - oldBalanceNum,
            details
        }
    } catch (error) {
        console.error('=== FORCE BALANCE FIX FAILED ===', error)
        return {
            success: false,
            error: error.message
        }
    }
}

/**
 * Reset everything - clear all cashcash data
 */
export function resetAllCrashcash() {
    if (typeof window === 'undefined') return

    try {
        localStorage.removeItem('crashcashBalance')
        localStorage.removeItem('scratchCardRewards')
        localStorage.removeItem('orderCrashCashRewards')
        localStorage.removeItem('userCrashCash')
        localStorage.removeItem('lastCrashcashWin')
        localStorage.removeItem('orderCrashCashRewards')

        window.dispatchEvent(new Event('storage'))
        window.dispatchEvent(new Event('crashcash-update'))

        console.log('All cashcash data reset')
        return true
    } catch (error) {
        console.error('Reset failed:', error)
        return false
    }
}

/**
 * Get detailed balance report
 */
export function getDetailedBalanceReport() {
    if (typeof window === 'undefined') return null

    try {
        const scratchRewards = JSON.parse(localStorage.getItem('scratchCardRewards') || '[]')
        const orderRewards = JSON.parse(localStorage.getItem('orderCrashCashRewards') || '[]')
        const currentBalance = localStorage.getItem('crashcashBalance') || '0'

        let scratchTotal = 0
        let orderTotal = 0

        scratchRewards.forEach(reward => {
            if (reward.type === 'reward') {
                if (reward.rewardType === 'crashcash') scratchTotal += reward.crashcash || 0
                if (reward.rewardType === 'discount') scratchTotal += reward.bonusCrashcash || 0
            }
        })

        orderRewards.forEach(order => {
            orderTotal += order.amount || 0
        })

        const calculatedTotal = scratchTotal + orderTotal

        return {
            storedBalance: parseInt(currentBalance),
            calculatedTotal,
            fromScratch: scratchTotal,
            fromOrders: orderTotal,
            scratchRewardCount: scratchRewards.filter(r => r.type === 'reward').length,
            orderRewardCount: orderRewards.length,
            isCorrect: parseInt(currentBalance) === calculatedTotal,
            difference: parseInt(currentBalance) - calculatedTotal
        }
    } catch (error) {
        console.error('Report generation failed:', error)
        return null
    }
}
