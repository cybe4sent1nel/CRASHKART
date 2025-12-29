import { createSlice } from '@reduxjs/toolkit'

// Load initial state from localStorage
const loadWishlistFromStorage = () => {
    if (typeof window !== 'undefined') {
        const savedWishlist = localStorage.getItem('wishlist')
        if (savedWishlist) {
            return JSON.parse(savedWishlist)
        }
    }
    return {
        items: [],
        total: 0
    }
}

const wishlistSlice = createSlice({
    name: 'wishlist',
    initialState: loadWishlistFromStorage(),
    reducers: {
        addToWishlist: (state, action) => {
            const exists = state.items.find(item => item.id === action.payload.id)
            if (!exists) {
                state.items.push(action.payload)
                state.total = state.items.length
                if (typeof window !== 'undefined') {
                    localStorage.setItem('wishlist', JSON.stringify(state))
                }
            }
        },
        removeFromWishlist: (state, action) => {
            state.items = state.items.filter(item => item.id !== action.payload)
            state.total = state.items.length
            if (typeof window !== 'undefined') {
                localStorage.setItem('wishlist', JSON.stringify(state))
            }
        },
        clearWishlist: (state) => {
            state.items = []
            state.total = 0
            if (typeof window !== 'undefined') {
                localStorage.setItem('wishlist', JSON.stringify(state))
            }
        }
    }
})

export const { addToWishlist, removeFromWishlist, clearWishlist } = wishlistSlice.actions
export default wishlistSlice.reducer
