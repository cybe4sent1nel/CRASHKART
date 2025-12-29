import { createSlice } from '@reduxjs/toolkit'

// Load initial state from localStorage
const loadCartFromStorage = () => {
    if (typeof window !== 'undefined') {
        const savedCart = localStorage.getItem('cart')
        if (savedCart) {
            return JSON.parse(savedCart)
        }
    }
    return {
        total: 0,
        cartItems: {},
    }
}

const cartSlice = createSlice({
    name: 'cart',
    initialState: loadCartFromStorage(),
    reducers: {
        addToCart: (state, action) => {
            const { productId } = action.payload
            if (state.cartItems[productId]) {
                state.cartItems[productId]++
            } else {
                state.cartItems[productId] = 1
            }
            state.total += 1
            if (typeof window !== 'undefined') {
                localStorage.setItem('cart', JSON.stringify(state))
            }
        },
        removeFromCart: (state, action) => {
            const { productId } = action.payload
            if (state.cartItems[productId]) {
                state.cartItems[productId]--
                if (state.cartItems[productId] === 0) {
                    delete state.cartItems[productId]
                }
            }
            state.total -= 1
            if (typeof window !== 'undefined') {
                localStorage.setItem('cart', JSON.stringify(state))
            }
        },
        deleteItemFromCart: (state, action) => {
            const { productId } = action.payload
            state.total -= state.cartItems[productId] ? state.cartItems[productId] : 0
            delete state.cartItems[productId]
            if (typeof window !== 'undefined') {
                localStorage.setItem('cart', JSON.stringify(state))
            }
        },
        clearCart: (state) => {
            state.cartItems = {}
            state.total = 0
            if (typeof window !== 'undefined') {
                localStorage.setItem('cart', JSON.stringify(state))
            }
        },
    }
})

export const { addToCart, removeFromCart, clearCart, deleteItemFromCart } = cartSlice.actions

export default cartSlice.reducer
