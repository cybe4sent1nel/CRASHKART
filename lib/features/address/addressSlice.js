import { addressDummyData } from '@/assets/assets'
import { createSlice } from '@reduxjs/toolkit'

const addressSlice = createSlice({
    name: 'address',
    initialState: {
        list: [{ ...addressDummyData, isDefault: true }],
        selectedAddressId: addressDummyData.id,
    },
    reducers: {
        addAddress: (state, action) => {
            const newAddress = {
                ...action.payload,
                id: action.payload.id || `addr_${Date.now()}`,
                isDefault: action.payload.isDefault || false
            }
            // If new address is default, unset previous defaults
            if (newAddress.isDefault) {
                state.list = state.list.map(addr => ({ ...addr, isDefault: false }))
            }
            state.list.push(newAddress)
            if (newAddress.isDefault) {
                state.selectedAddressId = newAddress.id
            }
        },
        updateAddress: (state, action) => {
            const index = state.list.findIndex(addr => addr.id === action.payload.id)
            if (index !== -1) {
                state.list[index] = { ...state.list[index], ...action.payload }
            }
        },
        deleteAddress: (state, action) => {
            const addressToDelete = state.list.find(addr => addr.id === action.payload)
            state.list = state.list.filter(addr => addr.id !== action.payload)
            // If deleted address was default, set first address as default
            if (addressToDelete?.isDefault && state.list.length > 0) {
                state.list[0].isDefault = true
                state.selectedAddressId = state.list[0].id
            }
        },
        setDefaultAddress: (state, action) => {
            state.list = state.list.map(addr => ({
                ...addr,
                isDefault: addr.id === action.payload
            }))
            state.selectedAddressId = action.payload
        },
        selectAddress: (state, action) => {
            state.selectedAddressId = action.payload
        }
    }
})

export const { addAddress, updateAddress, deleteAddress, setDefaultAddress, selectAddress } = addressSlice.actions

export default addressSlice.reducer