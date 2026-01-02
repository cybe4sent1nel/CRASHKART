// Helper to store price overrides for cart items (used for flash-sale persistence)
export const CartOverrides = {
    key: 'cartPriceOverrides',

    _load() {
        if (typeof window === 'undefined') return {}
        try {
            const raw = localStorage.getItem(this.key)
            return raw ? JSON.parse(raw) : {}
        } catch (e) {
            console.error('Failed to load cart overrides', e)
            return {}
        }
    },

    _save(obj) {
        if (typeof window === 'undefined') return
        try {
            localStorage.setItem(this.key, JSON.stringify(obj))
        } catch (e) {
            console.error('Failed to save cart overrides', e)
        }
    },

    set(productId, data) {
        const all = this._load()
        all[String(productId)] = data
        this._save(all)
    },

    get(productId) {
        const all = this._load()
        return all ? all[String(productId)] : undefined
    },

    remove(productId) {
        const all = this._load()
        if (all && all[String(productId)]) {
            delete all[String(productId)]
            this._save(all)
        }
    },

    clear() {
        if (typeof window === 'undefined') return
        localStorage.removeItem(this.key)
    }
}

export default CartOverrides
