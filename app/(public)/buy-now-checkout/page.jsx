'use client'
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { ShoppingBag, Truck, MapPin, Phone, Mail, Plus, AlertCircle, Tag, ChevronRight, Edit2 } from 'lucide-react'
import { useSelector } from 'react-redux'
import AddressForm from '@/components/AddressForm'
import { validateCoupon } from '@/lib/coupons'
import PageTitle from '@/components/PageTitle'
import toast from 'react-hot-toast'

export default function BuyNowCheckout() {
    const router = useRouter()
    
    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '₹'

    const [cartArray, setCartArray] = useState([])
    const [totalPrice, setTotalPrice] = useState(0)
    const [addresses, setAddresses] = useState([])
    const [loadingAddresses, setLoadingAddresses] = useState(false)
    const [selectedAddressId, setSelectedAddressId] = useState(null)
    const [showAddressForm, setShowAddressForm] = useState(false)
    const [couponCode, setCouponCode] = useState('')
    const [couponError, setCouponError] = useState('')
    const [appliedCoupon, setAppliedCoupon] = useState(null)
    const [mobileNumber, setMobileNumber] = useState('')
    const [mobileError, setMobileError] = useState('')
    const [isEditingPhone, setIsEditingPhone] = useState(false)
    const [phoneFromProfile, setPhoneFromProfile] = useState(null)

    // Load Buy Now product data
    useEffect(() => {
        const loadBuyNowData = () => {
            const buyNowData = sessionStorage.getItem('buyNowData')
            
            if (!buyNowData) {
                // No Buy Now data, redirect to cart checkout
                router.push('/checkout')
                return
            }

            try {
                const data = JSON.parse(buyNowData)
                if (data.isBuyNow && data.product) {
                     const product = data.product
                     // Use flash sale price if available, otherwise use regular price
                     const effectivePrice = product.salePrice || product.price || 0
                     const items = [{
                         ...product,
                         id: product.id,
                         quantity: product.quantity || 1,
                         storeId: product.storeId || product.store_id,
                         price: effectivePrice  // Ensure flash sale price is used
                     }]
                     const total = effectivePrice * (product.quantity || 1)
                     
                     setCartArray(items)
                     setTotalPrice(total)
                 }
            } catch (err) {
                console.error('Error parsing Buy Now data:', err)
                toast.error('Error loading product data')
                router.push('/checkout')
            }
        }

        loadBuyNowData()
    }, [router])
    
    // Fetch addresses from API
    useEffect(() => {
        const fetchAddresses = async () => {
            setLoadingAddresses(true)
            try {
                const userData = localStorage.getItem('user')
                if (!userData) {
                    console.error('No user data found')
                    setLoadingAddresses(false)
                    return
                }
                
                const user = JSON.parse(userData)
                const email = user.email
                
                if (!email) {
                    console.error('No email found in user data')
                    setLoadingAddresses(false)
                    return
                }
                
                const token = localStorage.getItem('token')
                const response = await fetch('/api/user/addresses', {
                    headers: {
                        'x-user-email': email,
                        ...(token && { 'Authorization': `Bearer ${token}` })
                    }
                })

                if (response.ok) {
                    const data = await response.json()
                    console.log('Buy Now Checkout - Fetched addresses:', data)
                    setAddresses(data.addresses || [])
                } else {
                    const errorText = await response.text()
                    console.error('Failed to fetch addresses:', response.status, errorText)
                }
            } catch (error) {
                console.error('Error fetching addresses:', error)
            } finally {
                setLoadingAddresses(false)
            }
        }

        fetchAddresses()
    }, [])


    // Auto-select first address
    useEffect(() => {
       if (addresses && addresses.length > 0 && !selectedAddressId) {
           const defaultAddr = addresses.find(addr => addr.isDefault) || addresses[0]
           setSelectedAddressId(defaultAddr.id)
       }
    }, [addresses, selectedAddressId])

    // Load phone number from user profile
    useEffect(() => {
       const userData = localStorage.getItem('user')
       if (userData) {
           try {
               const user = JSON.parse(userData)
               if (user.phone) {
                   setPhoneFromProfile(user.phone)
                   // Auto-fill mobile number from profile
                   if (!mobileNumber) {
                       setMobileNumber(user.phone)
                   }
               }
           } catch (err) {
               console.error('Error loading user profile:', err)
           }
       }
    }, [])

    const selectedAddress = addresses?.find(a => a.id === selectedAddressId)

    const handleApplyCoupon = () => {
        setCouponError('')
        const result = validateCoupon(couponCode, totalPrice)

        if (result.valid) {
            setAppliedCoupon({
                code: result.coupon.code,
                discount: result.discount,
                type: result.coupon.type
            })
            toast.success('Coupon applied successfully!')
        } else {
            setCouponError(result.message)
        }
    }

    const handleRemoveCoupon = () => {
        setAppliedCoupon(null)
        setCouponCode('')
    }

    const validateMobileNumber = () => {
        const cleaned = mobileNumber.replace(/\D/g, '')
        if (cleaned.length < 10) {
            setMobileError('Mobile number must be at least 10 digits')
            return false
        }
        setMobileError('')
        return true
    }

    const getTotalAfterDiscount = () => {
        let total = totalPrice
        if (appliedCoupon) {
            total -= appliedCoupon.discount
        }
        return Math.max(0, total)
    }

    const handleProceedToPayment = async () => {
         // Validate
         if (!selectedAddressId) {
             toast.error('Please select a delivery address')
             return
         }

         if (!mobileNumber) {
             setMobileError('Mobile number is required')
             return
         }

         if (!validateMobileNumber()) {
             return
         }

         // Prepare checkout data
          const checkoutData = {
              selectedAddressId,
              mobileNumber,
              appliedCoupon,
              items: cartArray.map(item => ({
                  ...item,
                  // Ensure storeId is included (required for order creation)
                  storeId: item.storeId || item.store_id
              })),
              subtotal: totalPrice,
              discount: appliedCoupon?.discount || 0,
              total: getTotalAfterDiscount(),
              isBuyNow: true
          }

         try {
             // First, create the order on Cashfree to get the payment session
             const token = localStorage.getItem('token')
             const response = await fetch('/api/payments/cashfree-order', {
                 method: 'POST',
                 headers: {
                     'Content-Type': 'application/json',
                     'Authorization': `Bearer ${token}`
                 },
                 body: JSON.stringify(checkoutData)
             })

             const orderData = await response.json()

             if (!response.ok) {
                 throw new Error(orderData.message || 'Failed to create order')
             }

             console.log('✅ Cashfree Order Created:', {
                 orderId: orderData.orderId,
                 cashfreeOrderId: orderData.cashfreeOrderId,
                 paymentSessionId: orderData.paymentSessionId?.substring(0, 30),
                 total: orderData.total
             })

             // Store complete order data with session ID
             // IMPORTANT: Only use the session ID from orderData, don't merge duplicates
             const completeCheckoutData = {
                 ...checkoutData,
                 orderId: orderData.orderId,
                 cashfreeOrderId: orderData.cashfreeOrderId,
                 paymentSessionId: orderData.paymentSessionId,  // Use server's clean version
                 paymentLink: orderData.paymentLink
             }

             console.log('💾 Storing in sessionStorage:', {
                 hasPaymentSessionId: !!completeCheckoutData.paymentSessionId,
                 sessionIdLength: completeCheckoutData.paymentSessionId?.length,
                 sessionIdStart: completeCheckoutData.paymentSessionId?.substring(0, 50)
             })
          
             sessionStorage.setItem('checkoutData', JSON.stringify(completeCheckoutData))
             router.push('/payment-method')

         } catch (error) {
             console.error('Payment initialization error:', error)
             toast.error(error.message || 'Failed to initialize payment')
         }
     }

    if (cartArray.length === 0) {
        return (
            <div className="min-h-[70vh] flex items-center justify-center">
                <div className="text-center">
                    <ShoppingBag className="w-16 h-16 mx-auto text-slate-400 mb-4" />
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Loading...</h2>
                    <button
                        onClick={() => router.push('/shop')}
                        className="mt-4 px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                    >
                        Continue Shopping
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-12">
            <div className="max-w-4xl mx-auto px-4">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">Buy Now Checkout</h1>
                    <p className="text-slate-600 dark:text-slate-400">Review your order and proceed to payment</p>
                </div>

                <div className="grid grid-cols-1 gap-8">
                    {/* Main Content */}
                    <div className="space-y-6">
                        {/* Order Items */}
                        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-lg p-8">
                            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                                <ShoppingBag className="w-6 h-6 text-blue-600" />
                                Order Item
                            </h2>

                            <div className="space-y-4">
                                {cartArray.map((item, index) => (
                                    <div key={index} className="flex gap-4 pb-4 border-b border-slate-200 dark:border-slate-700 last:border-0">
                                        <div className="relative w-20 h-20 bg-slate-100 dark:bg-slate-700 rounded-lg overflow-hidden flex-shrink-0">
                                            {item.images && item.images.length > 0 ? (
                                                <Image 
                                                    src={item.images[0]} 
                                                    alt={item.name}
                                                    width={80}
                                                    height={80}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-slate-300 dark:bg-slate-600 flex items-center justify-center text-slate-500">
                                                    No Image
                                                </div>
                                            )}
                                            
                                            {/* Out of Stock Overlay - Only show if product quantity is explicitly 0 */}
                                            {item.quantity === 0 && (
                                                <div className='absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg'>
                                                    <span className='bg-red-600 text-white px-1 py-0.5 rounded text-xs font-semibold'>
                                                        OOS
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-slate-800 dark:text-white">{item.name}</h3>
                                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Qty: {item.quantity}</p>
                                            <p className="text-lg font-bold text-red-500 mt-2">{currency}{((item.salePrice || item.price || item.originalPrice || 0) * item.quantity).toLocaleString()}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Coupon Section */}
                        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-lg p-8">
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4">Apply Coupon</h2>
                            {!appliedCoupon ? (
                                <div className="space-y-3">
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={couponCode}
                                            onChange={(e) => {
                                                setCouponCode(e.target.value.toUpperCase())
                                                setCouponError('')
                                            }}
                                            placeholder="Enter coupon code (e.g., NEW20, FLASH30)"
                                            className="flex-1 px-4 py-3 border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white rounded-lg focus:outline-none focus:border-blue-600"
                                        />
                                        <button
                                            onClick={handleApplyCoupon}
                                            className="px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition"
                                        >
                                            Apply
                                        </button>
                                    </div>
                                    {couponError && (
                                        <p className="text-red-600 dark:text-red-400 text-sm flex items-center gap-1">
                                            <AlertCircle size={14} /> {couponError}
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <div className="flex items-center justify-between bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                                    <div>
                                        <p className="text-sm text-slate-600 dark:text-slate-400">Coupon Applied</p>
                                        <p className="text-lg font-bold text-green-600">{appliedCoupon.code}</p>
                                    </div>
                                    <button
                                        onClick={handleRemoveCoupon}
                                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                                    >
                                        Remove
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Delivery Address */}
                        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-lg p-8">
                            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                                <Truck className="w-6 h-6 text-emerald-600" />
                                Delivery Address
                            </h2>

                            {selectedAddress ? (
                                <div className="space-y-4">
                                    <div className="bg-gradient-to-br from-emerald-50 dark:from-emerald-900/20 to-cyan-50 dark:to-cyan-900/20 border-2 border-emerald-200 dark:border-emerald-700 rounded-2xl p-6">
                                        <div className="flex items-start justify-between mb-3">
                                            <h3 className="font-bold text-emerald-700 dark:text-emerald-400">Delivery To:</h3>
                                            <button
                                                onClick={() => setShowAddressForm(true)}
                                                className="px-3 py-1.5 text-sm bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition flex items-center gap-1"
                                            >
                                                <Edit2 size={14} />
                                                Edit
                                            </button>
                                        </div>
                                        <div className="space-y-3">
                                            <div className="flex items-start gap-3">
                                                <div className="font-bold text-lg text-emerald-600 bg-white dark:bg-slate-700 rounded-full w-8 h-8 flex items-center justify-center">👤</div>
                                                <div>
                                                    <p className="text-xs text-slate-600 dark:text-slate-400">Name</p>
                                                    <p className="font-bold text-slate-800 dark:text-white">{selectedAddress.name}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-3">
                                                <Phone className="w-5 h-5 text-emerald-600 mt-1 flex-shrink-0" />
                                                <div>
                                                    <p className="text-xs text-slate-600 dark:text-slate-400">Phone</p>
                                                    <p className="font-semibold text-slate-800 dark:text-white">{selectedAddress.phone}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-3">
                                                <MapPin className="w-5 h-5 text-emerald-600 mt-1 flex-shrink-0" />
                                                <div>
                                                    <p className="text-xs text-slate-600 dark:text-slate-400">Address</p>
                                                    <p className="font-semibold text-slate-800 dark:text-white">{selectedAddress.street}</p>
                                                    <p className="text-sm text-slate-600 dark:text-slate-400">{selectedAddress.city}, {selectedAddress.state} {selectedAddress.zip}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {addresses.length > 1 && (
                                        <div>
                                            <label className="text-sm text-slate-600 dark:text-slate-400 mb-2 block">Change Address</label>
                                            <select
                                                value={selectedAddressId || ''}
                                                onChange={(e) => setSelectedAddressId(e.target.value)}
                                                className="w-full px-4 py-3 border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white rounded-lg"
                                            >
                                                {addresses.map(addr => (
                                                    <option key={addr.id} value={addr.id}>
                                                        {addr.name} - {addr.city}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    )}

                                    <button
                                        onClick={() => setShowAddressForm(true)}
                                        className="w-full flex items-center justify-center gap-2 px-6 py-3 border-2 border-blue-600 text-blue-600 dark:text-blue-400 font-bold rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition"
                                    >
                                        <Plus size={20} />
                                        Add New Address
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setShowAddressForm(true)}
                                    className="w-full px-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold"
                                >
                                    Add Address
                                </button>
                            )}
                        </div>

                        {/* Mobile Number */}
                         <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-lg p-8">
                             <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                                 <Phone className="w-6 h-6 text-blue-600" />
                                 Contact Number
                             </h2>
                             <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                                 We'll use this number to send you tracking updates via SMS and WhatsApp
                             </p>
                             <div className="space-y-2">
                                 {phoneFromProfile && !isEditingPhone ? (
                                     // Show phone with edit button
                                     <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-700 rounded-lg border-2 border-slate-200 dark:border-slate-600">
                                         <div className="flex-1">
                                             <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Phone Number</p>
                                             <p className="text-lg font-semibold text-slate-800 dark:text-white">{mobileNumber}</p>
                                         </div>
                                         <button
                                             type="button"
                                             onClick={() => setIsEditingPhone(true)}
                                             className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition text-sm font-medium"
                                         >
                                             Edit
                                         </button>
                                     </div>
                                 ) : (
                                     // Show input field
                                     <>
                                         <input
                                             type="tel"
                                             value={mobileNumber}
                                             onChange={(e) => {
                                                 setMobileNumber(e.target.value)
                                                 setMobileError('')
                                             }}
                                             onBlur={validateMobileNumber}
                                             placeholder="Enter 10-digit mobile number"
                                             className={`w-full px-4 py-3 border-2 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:outline-none transition ${
                                                 mobileError
                                                     ? 'border-red-500 dark:border-red-500'
                                                     : 'border-slate-300 dark:border-slate-600 focus:border-blue-600'
                                             }`}
                                         />
                                         {phoneFromProfile && isEditingPhone && (
                                             <button
                                                 type="button"
                                                 onClick={() => {
                                                     setMobileNumber(phoneFromProfile)
                                                     setIsEditingPhone(false)
                                                     setMobileError('')
                                                 }}
                                                 className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                                             >
                                                 ← Use original number
                                             </button>
                                         )}
                                     </>
                                 )}
                                 {mobileError && (
                                     <p className="text-red-600 dark:text-red-400 text-sm flex items-center gap-1">
                                         <AlertCircle size={14} /> {mobileError}
                                     </p>
                                 )}
                             </div>
                         </div>

                        {/* Proceed to Payment Button */}
                        <button
                            onClick={handleProceedToPayment}
                            className="w-full px-6 py-4 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold rounded-lg transition shadow-lg hover:shadow-xl flex items-center justify-center gap-2 active:scale-95"
                        >
                            Proceed to Payment
                            <ChevronRight size={20} />
                        </button>
                        </div>
                        </div>
                        </div>

                        {/* Address Form Modal */}
            {showAddressForm && (
                <AddressForm
                    onSave={async () => {
                        setShowAddressForm(false)
                        toast.success('Address added successfully!')
                        // Refresh addresses list
                        try {
                            setLoadingAddresses(true)
                            const userData = localStorage.getItem('user')
                            if (userData) {
                                const user = JSON.parse(userData)
                                const email = user.email
                                
                                const token = localStorage.getItem('token')
                                const response = await fetch('/api/user/addresses', {
                                    headers: {
                                        'x-user-email': email,
                                        ...(token && { 'Authorization': `Bearer ${token}` })
                                    }
                                })

                                if (response.ok) {
                                    const data = await response.json()
                                    setAddresses(data.addresses || [])
                                    // Auto-select the newly added address (usually the last one)
                                    if (data.addresses && data.addresses.length > 0) {
                                        const newAddress = data.addresses[data.addresses.length - 1]
                                        setSelectedAddressId(newAddress.id)
                                    }
                                }
                            }
                        } catch (error) {
                            console.error('Error refreshing addresses:', error)
                        } finally {
                            setLoadingAddresses(false)
                        }
                    }}
                    onClose={() => setShowAddressForm(false)}
                />
            )}
        </div>
    )
}
