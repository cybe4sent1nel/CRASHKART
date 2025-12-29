/**
 * Data Synchronization Utility
 * Syncs local user data (cart, wishlist, coupons, scratch cards) between localStorage and database
 */

export const DataSync = {
    // Sync cart from server
    async syncCartFromServer() {
        try {
            const response = await fetch('/api/cart', {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            })

            if (!response.ok) throw new Error('Failed to fetch cart')

            const data = await response.json()
            
            if (data.success) {
                // Store in localStorage for offline access
                localStorage.setItem('cartItems', JSON.stringify(data.items))
                return data.items
            }
        } catch (error) {
            console.error('Cart sync error:', error)
            // Return cached cart if available
            const cached = localStorage.getItem('cartItems')
            return cached ? JSON.parse(cached) : []
        }
    },

    // Sync wishlist from server
    async syncWishlistFromServer() {
        try {
            const response = await fetch('/api/wishlist', {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            })

            if (!response.ok) throw new Error('Failed to fetch wishlist')

            const data = await response.json()
            
            if (data.success) {
                localStorage.setItem('wishlistItems', JSON.stringify(data.items))
                return data.items
            }
        } catch (error) {
            console.error('Wishlist sync error:', error)
            const cached = localStorage.getItem('wishlistItems')
            return cached ? JSON.parse(cached) : []
        }
    },

    // Sync coupons from server
    async syncCouponsFromServer() {
        try {
            const response = await fetch('/api/coupons', {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            })

            if (!response.ok) throw new Error('Failed to fetch coupons')

            const data = await response.json()
            
            if (data.success) {
                localStorage.setItem('userCoupons', JSON.stringify(data.coupons))
                return data.coupons
            }
        } catch (error) {
            console.error('Coupon sync error:', error)
            const cached = localStorage.getItem('userCoupons')
            return cached ? JSON.parse(cached) : []
        }
    },

    // Sync scratch cards from server
    async syncScratchCardsFromServer() {
        try {
            const response = await fetch('/api/scratchcard', {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            })

            if (!response.ok) throw new Error('Failed to fetch scratch cards')

            const data = await response.json()
            
            if (data.success) {
                localStorage.setItem('scratchCards', JSON.stringify(data.rewards))
                return data.rewards
            }
        } catch (error) {
            console.error('Scratch card sync error:', error)
            const cached = localStorage.getItem('scratchCards')
            return cached ? JSON.parse(cached) : []
        }
    },

    // Add item to cart (local + server)
    async addToCart(productId, quantity, price) {
        try {
            const response = await fetch('/api/cart', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productId, quantity, price })
            })

            if (!response.ok) throw new Error('Failed to add to cart')

            const data = await response.json()
            
            if (data.success) {
                await this.syncCartFromServer()
                return data.cartItem
            }
        } catch (error) {
            console.error('Add to cart error:', error)
            // Fallback to local storage
            const cart = this.getLocalCart()
            const existing = cart.find(item => item.productId === productId)
            
            if (existing) {
                existing.quantity = quantity
            } else {
                cart.push({ productId, quantity, price })
            }
            
            localStorage.setItem('cartItems', JSON.stringify(cart))
            return { productId, quantity, price }
        }
    },

    // Add item to wishlist (local + server)
    async addToWishlist(productId, priceAtAdd) {
        try {
            const response = await fetch('/api/wishlist', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productId, priceAtAdd })
            })

            if (!response.ok) throw new Error('Failed to add to wishlist')

            const data = await response.json()
            
            if (data.success) {
                await this.syncWishlistFromServer()
                return data.wishlistItem
            }
        } catch (error) {
            console.error('Add to wishlist error:', error)
            const wishlist = this.getLocalWishlist()
            
            if (!wishlist.find(item => item.productId === productId)) {
                wishlist.push({ productId, priceAtAdd })
            }
            
            localStorage.setItem('wishlistItems', JSON.stringify(wishlist))
            return { productId, priceAtAdd }
        }
    },

    // Remove from cart
    async removeFromCart(productId) {
        try {
            const response = await fetch('/api/cart', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productId })
            })

            if (!response.ok) throw new Error('Failed to remove from cart')

            await this.syncCartFromServer()
            return true
        } catch (error) {
            console.error('Remove from cart error:', error)
            const cart = this.getLocalCart()
            const filtered = cart.filter(item => item.productId !== productId)
            localStorage.setItem('cartItems', JSON.stringify(filtered))
            return true
        }
    },

    // Remove from wishlist
    async removeFromWishlist(productId) {
        try {
            const response = await fetch('/api/wishlist', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productId })
            })

            if (!response.ok) throw new Error('Failed to remove from wishlist')

            await this.syncWishlistFromServer()
            return true
        } catch (error) {
            console.error('Remove from wishlist error:', error)
            const wishlist = this.getLocalWishlist()
            const filtered = wishlist.filter(item => item.productId !== productId)
            localStorage.setItem('wishlistItems', JSON.stringify(filtered))
            return true
        }
    },

    // Local storage getters
    getLocalCart() {
        if (typeof window === 'undefined') return []
        const cached = localStorage.getItem('cartItems')
        return cached ? JSON.parse(cached) : []
    },

    getLocalWishlist() {
        if (typeof window === 'undefined') return []
        const cached = localStorage.getItem('wishlistItems')
        return cached ? JSON.parse(cached) : []
    },

    getLocalCoupons() {
        if (typeof window === 'undefined') return []
        const cached = localStorage.getItem('userCoupons')
        return cached ? JSON.parse(cached) : []
    },

    getLocalScratchCards() {
        if (typeof window === 'undefined') return []
        const cached = localStorage.getItem('scratchCards')
        return cached ? JSON.parse(cached) : []
    },

    // Sync all data on user login
    async syncAllOnLogin() {
        try {
            await Promise.all([
                this.syncCartFromServer(),
                this.syncWishlistFromServer(),
                this.syncCouponsFromServer(),
                this.syncScratchCardsFromServer()
            ])
            return true
        } catch (error) {
            console.error('Sync all error:', error)
            return false
        }
    },

    // Clear all local data (on logout)
    clearAllLocalData() {
        if (typeof window === 'undefined') return
        localStorage.removeItem('cartItems')
        localStorage.removeItem('wishlistItems')
        localStorage.removeItem('userCoupons')
        localStorage.removeItem('scratchCards')
    }
}
