export async function performLogout({ allDevices = false } = {}) {
    if (typeof window === 'undefined') return

    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null

    if (allDevices && token) {
        try {
            await fetch('/api/auth/logout-all', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })
        } catch (error) {
            console.error('Failed to logout from all devices:', error)
        }
    }

    const keysToClear = [
        'user',
        'token',
        // CrashCash (unified system uses server only)
        'crashcashBalance',
        'orderCrashCashRewards',
        'scratchCardRewards',
        'discountRewards',
        'userCrashCash',
        'lastCrashcashWin',
        'users_crashcash',
        'currentScratchCardRevealed',
        'lastScratchCardRedeemed',
        // Cart/Wishlist (unified system uses server only)
        'cart',
        'cartItems',
        'wishlist',
        'wishlistItems'
    ]

    keysToClear.forEach((key) => {
        try {
            localStorage.removeItem(key)
        } catch (err) {
            console.warn(`Could not clear ${key}:`, err)
        }
    })

    // Notify listeners to refresh their state
    try {
        window.dispatchEvent(new Event('storage'))
        window.dispatchEvent(new Event('crashcash-update'))
        window.dispatchEvent(new Event('cart-update'))
        window.dispatchEvent(new Event('wishlist-update'))
        window.dispatchEvent(new Event('profileUpdated'))
    } catch (err) {
        console.warn('Dispatch events failed on logout:', err)
    }
    
    console.log('✅ Logged out - all localStorage cleared (unified storage)')
}
