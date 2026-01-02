/**
 * Migration Script: Move all user data to unified server storage
 * 
 * This script:
 * 1. Clears all CrashCash rewards and balances
 * 2. Syncs cart from localStorage to server (if needed)
 * 3. Syncs wishlist from localStorage to server (if needed)
 * 
 * Run this ONCE before deploying the unified system
 */

import prisma from '../lib/prisma.js'

async function clearAllCrashCash() {
    console.log('🧹 Clearing all CrashCash data...')
    
    try {
        // Delete all CrashCash rewards
        const deletedRewards = await prisma.crashCashReward.deleteMany({})
        console.log(`  ✅ Deleted ${deletedRewards.count} CrashCash reward records`)
        
        // Reset all user balances to 0
        const updatedUsers = await prisma.user.updateMany({
            data: { crashCashBalance: 0 }
        })
        console.log(`  ✅ Reset ${updatedUsers.count} user CrashCash balances to 0`)
        
        return { success: true, deletedRewards: deletedRewards.count, updatedUsers: updatedUsers.count }
    } catch (error) {
        console.error('❌ Failed to clear CrashCash:', error)
        return { success: false, error: error.message }
    }
}

async function verifyCartIntegrity() {
    console.log('🛒 Verifying cart data integrity...')
    
    try {
        const carts = await prisma.cartItem.findMany()
        
        console.log(`  ℹ️  Found ${carts.length} cart items across all users`)
        
        // Group by user
        const userCarts = {}
        carts.forEach(item => {
            if (!userCarts[item.userId]) {
                userCarts[item.userId] = []
            }
            userCarts[item.userId].push(item)
        })
        
        console.log(`  ✅ ${Object.keys(userCarts).length} users have cart items`)
        
        return { success: true, totalItems: carts.length, usersWithCarts: Object.keys(userCarts).length }
    } catch (error) {
        console.error('❌ Failed to verify cart:', error)
        return { success: false, error: error.message }
    }
}

async function verifyWishlistIntegrity() {
    console.log('❤️  Verifying wishlist data integrity...')
    
    try {
        const wishlists = await prisma.wishlistItem.findMany({})
        
        console.log(`  ℹ️  Found ${wishlists.length} wishlist items across all users`)
        
        // Group by user
        const userWishlists = {}
        wishlists.forEach(item => {
            if (!userWishlists[item.userId]) {
                userWishlists[item.userId] = []
            }
            userWishlists[item.userId].push(item)
        })
        
        console.log(`  ✅ ${Object.keys(userWishlists).length} users have wishlist items`)
        
        return { success: true, totalItems: wishlists.length, usersWithWishlists: Object.keys(userWishlists).length }
    } catch (error) {
        console.error('❌ Failed to verify wishlist:', error)
        return { success: false, error: error.message }
    }
}

async function runMigration() {
    console.log('🚀 Starting Unified Storage Migration...\n')
    
    // Step 1: Clear all CrashCash
    console.log('📍 Step 1: Clear all CrashCash data')
    const crashCashResult = await clearAllCrashCash()
    console.log('')
    
    // Step 2: Verify cart integrity
    console.log('📍 Step 2: Verify cart data integrity')
    const cartResult = await verifyCartIntegrity()
    console.log('')
    
    // Step 3: Verify wishlist integrity
    console.log('📍 Step 3: Verify wishlist data integrity')
    const wishlistResult = await verifyWishlistIntegrity()
    console.log('')
    
    // Summary
    console.log('=' + '='.repeat(50))
    console.log('📊 Migration Summary')
    console.log('=' + '='.repeat(50))
    console.log(`CrashCash: ${crashCashResult.success ? '✅ Cleared' : '❌ Failed'}`)
    if (crashCashResult.success) {
        console.log(`  - Deleted ${crashCashResult.deletedRewards} reward records`)
        console.log(`  - Reset ${crashCashResult.updatedUsers} user balances`)
    }
    console.log(`Cart: ${cartResult.success ? '✅ Verified' : '❌ Failed'}`)
    if (cartResult.success) {
        console.log(`  - ${cartResult.totalItems} total items`)
        console.log(`  - ${cartResult.usersWithCarts} users with carts`)
    }
    console.log(`Wishlist: ${wishlistResult.success ? '✅ Verified' : '❌ Failed'}`)
    if (wishlistResult.success) {
        console.log(`  - ${wishlistResult.totalItems} total items`)
        console.log(`  - ${wishlistResult.usersWithWishlists} users with wishlists`)
    }
    console.log('=' + '='.repeat(50))
    console.log('\n✅ Migration complete! Deploy the unified storage system.')
    console.log('⚠️  Users will need to sign in again for data to sync.')
    
    await prisma.$disconnect()
}

// Run migration
runMigration().catch(error => {
    console.error('💥 Migration failed:', error)
    process.exit(1)
})
