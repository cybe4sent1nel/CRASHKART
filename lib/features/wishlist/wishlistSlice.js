import { createSlice } from '@reduxjs/toolkit'

const initialState = {
    items: [],
    total: 0
}

const wishlistSlice = createSlice({
    name: 'wishlist',
    initialState,
    reducers: {
        addToWishlist: (state, action) => {
            const exists = state.items.find(item => item.id === action.payload.id)
            if (!exists) {
                state.items.push(action.payload)
                state.total = state.items.length
            }
        },
        removeFromWishlist: (state, action) => {
            state.items = state.items.filter(item => item.id !== action.payload)
            state.total = state.items.length
        },
        clearWishlist: (state) => {
            state.items = []
            state.total = 0
        }
    }
})

export const { addToWishlist, removeFromWishlist, clearWishlist } = wishlistSlice.actions
export default wishlistSlice.reducer
