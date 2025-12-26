'use client'
import React, { useState } from 'react'
import { X, MapPin, Phone, Mail, User, Star } from 'lucide-react'
import NeonCheckbox from '@/components/NeonCheckbox'
import FreeLocationPicker from '@/components/FreeLocationPicker'
import toast from 'react-hot-toast'

export default function AddressForm({ onSave, onClose, initialData = null }) {
    const [formData, setFormData] = useState(initialData || {
        name: '',
        email: '',
        phone: '',
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'India',
        isDefault: false,
        latitude: null,
        longitude: null
    })
    const [showLocationPicker, setShowLocationPicker] = useState(false)

    const [errors, setErrors] = useState({})

    const validateForm = () => {
        const newErrors = {}
        if (!formData.name) newErrors.name = 'Name is required'
        if (!formData.email) newErrors.email = 'Email is required'
        if (!formData.phone) newErrors.phone = 'Phone is required'
        if (!formData.street) newErrors.street = 'Street is required'
        if (!formData.city) newErrors.city = 'City is required'
        if (!formData.state) newErrors.state = 'State is required'
        if (!formData.zipCode) newErrors.zipCode = 'Zip code is required'
        if (!formData.country) newErrors.country = 'Country is required'
        
        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
    }

    const handleLocationSelect = (location) => {
        setFormData(prev => ({
            ...prev,
            street: location.address,
            zipCode: location.pincode,
            latitude: location.latitude,
            longitude: location.longitude
        }))
        setShowLocationPicker(false)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!validateForm()) {
            return
        }

        try {
            // Get user email from localStorage
            const userData = localStorage.getItem('user')
            if (!userData) {
                toast.error('Please login to save address')
                return
            }
            
            const user = JSON.parse(userData)
            const email = user.email

            // Save address to database
            const response = await fetch('/api/user/addresses', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-email': email
                },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email || email,
                    phone: formData.phone,
                    street: formData.street,
                    city: formData.city,
                    state: formData.state,
                    zip: formData.zipCode,
                    country: formData.country || 'India',
                    isDefault: formData.isDefault || false,
                    latitude: formData.latitude,
                    longitude: formData.longitude
                })
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || 'Failed to save address')
            }

            const savedAddress = await response.json()
            toast.success('Address saved successfully!')
            
            // Call the onSave callback with the saved address
            onSave(savedAddress)
        } catch (error) {
            console.error('Error saving address:', error)
            toast.error(error.message || 'Failed to save address')
        }
    }

    return (
        <div className='fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4'>
            <div className='bg-white rounded-3xl w-full max-w-2xl max-h-screen overflow-y-auto shadow-2xl'>
                {/* Header */}
                <div className='sticky top-0 bg-gradient-to-r from-blue-600 to-cyan-600 text-white p-6 flex items-center justify-between'>
                    <div className='flex items-center gap-3'>
                        <MapPin className='w-6 h-6' />
                        <h2 className='text-2xl font-bold'>Delivery Address</h2>
                    </div>
                    <button onClick={onClose} className='hover:bg-white/20 p-2 rounded-full transition'>
                        <X size={24} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className='p-8 space-y-6'>
                    {/* Name and Email Row */}
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                        <div>
                            <label className='block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2'>
                                <User size={16} />
                                Full Name
                            </label>
                            <input
                                type='text'
                                name='name'
                                value={formData.name}
                                onChange={handleChange}
                                placeholder='John Doe'
                                className='w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 transition'
                            />
                            {errors.name && <p className='text-red-500 text-xs mt-1'>{errors.name}</p>}
                        </div>

                        <div>
                            <label className='block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2'>
                                <Mail size={16} />
                                Email
                            </label>
                            <input
                                type='email'
                                name='email'
                                value={formData.email}
                                onChange={handleChange}
                                placeholder='john@example.com'
                                className='w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 transition'
                            />
                            {errors.email && <p className='text-red-500 text-xs mt-1'>{errors.email}</p>}
                        </div>
                    </div>

                    {/* Phone */}
                    <div>
                        <label className='block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2'>
                            <Phone size={16} />
                            Phone Number
                        </label>
                        <input
                            type='tel'
                            name='phone'
                            value={formData.phone}
                            onChange={handleChange}
                            placeholder='+1 (555) 000-0000'
                            className='w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 transition'
                        />
                        {errors.phone && <p className='text-red-500 text-xs mt-1'>{errors.phone}</p>}
                    </div>

                    {/* Street with Map Button */}
                    <div>
                        <label className='block text-sm font-bold text-slate-700 mb-2'>Street Address</label>
                        <div className='flex gap-2'>
                            <input
                                type='text'
                                name='street'
                                value={formData.street}
                                onChange={handleChange}
                                placeholder='123 Main Street, Apt 4B'
                                className='flex-1 px-4 py-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 transition'
                            />
                            <button
                                type='button'
                                onClick={() => setShowLocationPicker(true)}
                                className='px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition flex items-center gap-2'
                            >
                                <MapPin size={18} />
                                Map
                            </button>
                        </div>
                        {errors.street && <p className='text-red-500 text-xs mt-1'>{errors.street}</p>}
                    </div>

                    {/* City, State, Zip Row */}
                    <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                        <div>
                            <label className='block text-sm font-bold text-slate-700 mb-2'>City</label>
                            <input
                                type='text'
                                name='city'
                                value={formData.city}
                                onChange={handleChange}
                                placeholder='New York'
                                className='w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 transition'
                            />
                            {errors.city && <p className='text-red-500 text-xs mt-1'>{errors.city}</p>}
                        </div>

                        <div>
                            <label className='block text-sm font-bold text-slate-700 mb-2'>State</label>
                            <input
                                type='text'
                                name='state'
                                value={formData.state}
                                onChange={handleChange}
                                placeholder='NY'
                                className='w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 transition'
                            />
                            {errors.state && <p className='text-red-500 text-xs mt-1'>{errors.state}</p>}
                        </div>

                        <div>
                            <label className='block text-sm font-bold text-slate-700 mb-2'>Zip Code</label>
                            <input
                                type='text'
                                name='zipCode'
                                value={formData.zipCode}
                                onChange={handleChange}
                                placeholder='10001'
                                className='w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 transition'
                            />
                            {errors.zipCode && <p className='text-red-500 text-xs mt-1'>{errors.zipCode}</p>}
                        </div>
                    </div>

                    {/* Country */}
                    <div>
                        <label className='block text-sm font-bold text-slate-700 mb-2'>Country</label>
                        <input
                            type='text'
                            name='country'
                            value={formData.country}
                            onChange={handleChange}
                            placeholder='United States'
                            className='w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 transition'
                        />
                        {errors.country && <p className='text-red-500 text-xs mt-1'>{errors.country}</p>}
                    </div>

                    {/* Set as Default Address */}
                    <div className='flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/50 rounded-xl'>
                        <NeonCheckbox 
                            checked={formData.isDefault}
                            onChange={() => setFormData(prev => ({ ...prev, isDefault: !prev.isDefault }))}
                            size={22}
                        />
                        <div className='flex items-center gap-2'>
                            <Star className='w-4 h-4 text-amber-500' />
                            <span className='text-slate-700 dark:text-slate-200 font-medium'>Set as default delivery address</span>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className='flex gap-4 pt-6 border-t border-slate-200'>
                        <button
                            type='button'
                            onClick={onClose}
                            className='flex-1 px-6 py-3 border-2 border-slate-300 text-slate-800 font-bold rounded-lg hover:bg-slate-50 transition'
                        >
                            Cancel
                        </button>
                        <button
                            type='submit'
                            className='flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold rounded-lg hover:shadow-lg transition'
                        >
                            Save Address
                        </button>
                    </div>
                </form>
            </div>

            {/* Location Picker Modal */}
            {showLocationPicker && (
                <div className='fixed inset-0 bg-black/50 z-[999] flex items-center justify-center p-4'>
                    <div className='bg-white rounded-3xl w-full max-w-3xl max-h-screen overflow-y-auto shadow-2xl'>
                        <div className='sticky top-0 bg-gradient-to-r from-blue-600 to-cyan-600 text-white p-6 flex items-center justify-between'>
                            <h2 className='text-2xl font-bold flex items-center gap-2'>
                                <MapPin className='w-6 h-6' />
                                Select Location on Map
                            </h2>
                            <button 
                                onClick={() => setShowLocationPicker(false)} 
                                className='hover:bg-white/20 p-2 rounded-full transition'
                            >
                                <X size={24} />
                            </button>
                        </div>
                        <div className='p-8'>
                            <FreeLocationPicker 
                                onLocationSelect={handleLocationSelect}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
