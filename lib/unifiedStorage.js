/**
 * Unified Server-Side Storage System
 * 
 * Manages CrashCash, Cart, and Wishlist entirely on the server.
 * No localStorage dependencies - all data persists across sessions.
 */

import prisma from './prisma'

/**
 * ========================================
 * CRASHCASH MANAGEMENT
 * ========================================
 */

/**
 * Get user's CrashCash balance from server
 */
export async function getUserCrashCashBalance(userId) {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { crashCashBalance: true }
        })
        return user?.crashCashBalance || 0
    } catch (error) {
        console.error('Failed to get CrashCash balance:', error)
        return 0
    }
}

/**
 * Get user's CrashCash rewards with expiry info
 */
export async function getUserCrashCashRewards(userId) {
    try {
        const rewards = await prisma.crashCashReward.findMany({
            where: {
                userId,
                status: 'active',
                expiresAt: { gte: new Date() }
            },
            orderBy: { expiresAt: 'asc' }
        })
        
        const total = rewards.reduce((sum, r) => sum + r.amount, 0)
        
        return {
            balance: total,
            rewards: rewards.map(r => ({
                id: r.id,
                amount: r.amount,
                source: r.source,
                expiresAt: r.expiresAt,
                earnedAt: r.earnedAt,
                orderId: r.orderId
            }))
        }
    } catch (error) {
        console.error('Failed to get CrashCash rewards:', error)
        return { balance: 0, rewards: [] }
    }
}

/**
 * Add CrashCash to user account (server-only)
 */
export async function addCrashCash(userId, amount, source = 'order_placed', orderId = null, scratchSessionId = null) {
    try {
        console.log(`\n🔵 addCrashCash START:`, { userId, amount, source, orderId, scratchSessionId })
        
        // Verify user exists first
        const existingUser = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, email: true, crashCashBalance: true }
        })
        
        if (!existingUser) {
            console.error(`❌ User not found: ${userId}`)
            return { success: false, error: 'User not found' }
        }
        
        console.log(`✅ User found: ${existingUser.email}, current balance: ₹${existingUser.crashCashBalance}`)
        
        const expiryDate = new Date()
        expiryDate.setDate(expiryDate.getDate() + 30) // 30 days expiry

        // Create reward record first
        console.log(`🔵 Creating CrashCashReward record...`)
        const rewardData = {
            userId,
            orderId,
            amount,
            source,
            status: 'active',
            expiresAt: expiryDate,
            earnedAt: new Date()
        }
        
        // Add scratchSessionId if provided
        if (scratchSessionId) {
            rewardData.scratchSessionId = scratchSessionId
        }
        
        const reward = await prisma.crashCashReward.create({
            data: rewardData
        })
        console.log(`✅ CrashCashReward created: ${reward.id}, amount: ₹${reward.amount}`)

        // Then update balance separately to avoid deadlocks
        console.log(`🔵 Updating user balance: ${existingUser.crashCashBalance} + ${amount}`)
        const user = await prisma.user.update({
            where: { id: userId },
            data: { crashCashBalance: { increment: amount } }
        })
        
        console.log(`✅ Balance updated: ${existingUser.crashCashBalance} → ${user.crashCashBalance}`)
        console.log(`✅ addCrashCash COMPLETE for ${existingUser.email}\n`)

        return {
            success: true,
            reward,
            newBalance: user.crashCashBalance
        }
    } catch (error) {
        console.error('❌ addCrashCash ERROR:', error.message)
        console.error('❌ Stack:', error.stack)
        console.error('❌ Details:', { userId, amount, source, orderId })
        return { success: false, error: error.message }
    }
}

/**
 * Deduct CrashCash from user account
 */
export async function deductCrashCash(userId, amount) {
    try {
        // Get active rewards ordered by expiry (FIFO)
        const rewards = await prisma.crashCashReward.findMany({
            where: {
                userId,
                status: 'active',
                expiresAt: { gte: new Date() }
            },
            orderBy: { expiresAt: 'asc' }
        })

        let remaining = amount
        const updates = []

        // Deduct from oldest rewards first
        for (const reward of rewards) {
            if (remaining <= 0) break
            
            if (reward.amount <= remaining) {
                // Use entire reward
                updates.push(
                    prisma.crashCashReward.update({
                        where: { id: reward.id },
                        data: { status: 'used', amount: 0 }
                    })
                )
                remaining -= reward.amount
            } else {
                // Partial use
                updates.push(
                    prisma.crashCashReward.update({
                        where: { id: reward.id },
                        data: { amount: reward.amount - remaining }
                    })
                )
                remaining = 0
            }
        }

        // Execute all updates + balance deduction
        const results = await prisma.$transaction([
            ...updates,
            prisma.user.update({
                where: { id: userId },
                data: { crashCashBalance: { decrement: amount } }
            })
        ])

        const user = results[results.length - 1]
        
        return {
            success: true,
            newBalance: user.crashCashBalance,
            deducted: amount
        }
    } catch (error) {
        console.error('Failed to deduct CrashCash:', error)
        return { success: false, error: error.message }
    }
}

/**
 * ========================================
 * CART MANAGEMENT
 * ========================================
 */

/**
 * Get user's cart items from server
 */
export async function getUserCart(userId) {
    try {
        const cartItems = await prisma.cartItem.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' }
        })
        
        return cartItems
    } catch (error) {
        console.error('Failed to get cart:', error)
        return []
    }
}

/**
 * Add item to cart (server-only)
 */
export async function addToCart(userId, productId, quantity = 1, price) {
    try {
        const cartItem = await prisma.cartItem.upsert({
            where: {
                userId_productId: { userId, productId }
            },
            update: {
                quantity: { increment: quantity },
                price, // Update price to current
                updatedAt: new Date()
            },
            create: {
                userId,
                productId,
                quantity,
                price
            }
        })
        
        return { success: true, cartItem }
    } catch (error) {
        console.error('Failed to add to cart:', error)
        return { success: false, error: error.message }
    }
}

/**
 * Update cart item quantity
 */
export async function updateCartItem(userId, productId, quantity) {
    try {
        if (quantity <= 0) {
            // Remove item if quantity is 0
            await prisma.cartItem.delete({
                where: { userId_productId: { userId, productId } }
            })
            return { success: true, removed: true }
        }
        
        const cartItem = await prisma.cartItem.update({
            where: { userId_productId: { userId, productId } },
            data: { quantity, updatedAt: new Date() }
        })
        
        return { success: true, cartItem }
    } catch (error) {
        console.error('Failed to update cart item:', error)
        return { success: false, error: error.message }
    }
}

/**
 * Remove item from cart
 */
export async function removeFromCart(userId, productId) {
    try {
        await prisma.cartItem.delete({
            where: { userId_productId: { userId, productId } }
        })
        
        return { success: true }
    } catch (error) {
        console.error('Failed to remove from cart:', error)
        return { success: false, error: error.message }
    }
}

/**
 * Clear entire cart
 */
export async function clearCart(userId) {
    try {
        await prisma.cartItem.deleteMany({
            where: { userId }
        })
        
        return { success: true }
    } catch (error) {
        console.error('Failed to clear cart:', error)
        return { success: false, error: error.message }
    }
}

/**
 * ========================================
 * WISHLIST MANAGEMENT
 * ========================================
 */

/**
 * Get user's wishlist items from server
 */
export async function getUserWishlist(userId) {
    try {
        const wishlistItems = await prisma.wishlistItem.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' }
        })
        
        return wishlistItems
    } catch (error) {
        console.error('Failed to get wishlist:', error)
        return []
    }
}

/**
 * Add item to wishlist (server-only)
 */
export async function addToWishlist(userId, productId, priceAtAdd, notifyStock = true, notifyPrice = true) {
    try {
        const wishlistItem = await prisma.wishlistItem.create({
            data: {
                userId,
                productId,
                priceAtAdd,
                notifyStock,
                notifyPrice
            }
        })
        
        return { success: true, wishlistItem }
    } catch (error) {
        // If already exists, ignore error
        if (error.code === 'P2002') {
            return { success: true, alreadyExists: true }
        }
        console.error('Failed to add to wishlist:', error)
        return { success: false, error: error.message }
    }
}

/**
 * Remove item from wishlist
 */
export async function removeFromWishlist(userId, productId) {
    try {
        await prisma.wishlistItem.delete({
            where: { userId_productId: { userId, productId } }
        })
        
        return { success: true }
    } catch (error) {
        console.error('Failed to remove from wishlist:', error)
        return { success: false, error: error.message }
    }
}

/**
 * Check if product is in wishlist
 */
export async function isInWishlist(userId, productId) {
    try {
        const item = await prisma.wishlistItem.findUnique({
            where: { userId_productId: { userId, productId } }
        })
        
        return !!item
    } catch (error) {
        console.error('Failed to check wishlist:', error)
        return false
    }
}

/**
 * ========================================
 * MIGRATION HELPER
 * ========================================
 */

/**
 * Clear all localStorage data (call on login)
 */
export function clearLocalStorageData() {
    if (typeof window === 'undefined') return
    
    const keysToRemove = [
        // CrashCash keys
        'crashcashBalance',
        'orderCrashCashRewards',
        'scratchCardRewards',
        'discountRewards',
        'userCrashCash',
        'lastCrashcashWin',
        'users_crashcash',
        // Cart keys (if any localStorage cart exists)
        'cart',
        'cartItems',
        // Wishlist keys
        'wishlist',
        'wishlistItems'
    ]
    
    keysToRemove.forEach(key => {
        try {
            localStorage.removeItem(key)
        } catch (e) {
            console.warn(`Failed to remove ${key}:`, e)
        }
    })
    
    console.log('✅ Cleared all localStorage data - using server storage only')
}

export default {
    // CrashCash
    getUserCrashCashBalance,
    getUserCrashCashRewards,
    addCrashCash,
    deductCrashCash,
    // Cart
    getUserCart,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    // Wishlist
    getUserWishlist,
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
    // Migration
    clearLocalStorageData
}
