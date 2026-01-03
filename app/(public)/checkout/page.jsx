'use client'
import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { ShoppingBag, Truck, MapPin, Phone, Mail, Plus, AlertCircle, Tag, ChevronRight, Edit2, X } from 'lucide-react'
import { allProductsData } from '@/assets/assets'
import AddressForm from '@/components/AddressForm'
import { validateCoupon } from '@/lib/coupons'
import PageTitle from '@/components/PageTitle'
import toast from 'react-hot-toast'
import OutOfStockDisplay from '@/components/OutOfStockDisplay'
import { updateCrashCashBalance } from '@/lib/crashcashStorage'
import dynamic from 'next/dynamic'
import AnimationBackground from '@/components/AnimationBackground'

const Lottie = dynamic(() => import('lottie-react'), { ssr: false })

export default function Checkout() {
    const router = useRouter()
    const cartItems = useSelector(state => state?.cart?.cartItems || {})
    const products = useSelector(state => state.product.list)

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
    const [crashCashBalance, setCrashCashBalance] = useState(0)
    const [crashCashToUse, setCrashCashToUse] = useState(0)
    const [appliedCrashCash, setAppliedCrashCash] = useState(0)
    const [showCouponAnimation, setShowCouponAnimation] = useState(false)
    const [showCrashCashAnimation, setShowCrashCashAnimation] = useState(false)
    const [animationMessage, setAnimationMessage] = useState('')
    const [couponAnimationData, setCouponAnimationData] = useState(null)
    const [crashCashAnimationData, setCrashCashAnimationData] = useState(null)
    const [allowCoupons, setAllowCoupons] = useState(true) // Default true for non-flash-sale items
    const [allowCrashCash, setAllowCrashCash] = useState(true) // Default true for non-flash-sale items
    const [charges, setCharges] = useState({ shippingFee: 40, freeAbove: 999, convenienceFee: 0, platformFee: 0 })

    // Load Lottie animations
    useEffect(() => {
        fetch('/animations/Discount Coupon.json')
            .then(res => res.json())
            .then(data => setCouponAnimationData(data))
            .catch(err => console.error('Error loading coupon animation:', err))
        // Use cash jump animation for CrashCash popups
        fetch('/animations/cash jump.json')
            .then(res => res.json())
            .then(data => setCrashCashAnimationData(data))
            .catch(err => console.error('Error loading crash cash animation (cash jump):', err))
    }, [])

    // Load cart data only (not Buy Now)
    useEffect(() => {
        const loadCartData = async () => {
            let totalPrice = 0
            const cartArray = []
            
            // Check if user came from Buy Now instead of cart
            const buyNowData = sessionStorage.getItem('buyNowData')
            if (buyNowData) {
                // Redirect to dedicated Buy Now checkout route
                router.push('/buy-now-checkout')
                return
            }
            
            // Load cart items from Redux state
            const reduxCartItems = cartItems || {}
            
            // Use products from Redux, fallback to allProductsData
            const allProducts = products && products.length > 0 ? products : allProductsData
            
            for (const [key, value] of Object.entries(reduxCartItems)) {
                // Try multiple ID matching strategies
                let product = allProducts.find(p => 
                    p.id === key || 
                    p._id === key ||
                    String(p.id) === String(key)
                )
                
                if (product) {
                    // Use flash sale price if available, otherwise use regular price
                    let price = product.salePrice || product.price || product.originalPrice || 0
                    try {
                        const { CartOverrides } = await import('@/lib/cartOverrides')
                        const override = CartOverrides.get(product.id)
                        if (override && override.salePrice) {
                            if (!override.expiresAt || Number(override.expiresAt) > Date.now()) {
                                price = override.salePrice
                            } else {
                                CartOverrides.remove(product.id)
                            }
                        }
                    } catch (e) {
                        // ignore
                    }
                    cartArray.push({
                        ...product,
                        id: product.id || product._id,
                        quantity: value,
                        price: price  // Ensure price is set correctly
                    })
                    totalPrice += price * value
                }
            }
            
            setCartArray(cartArray)
            setTotalPrice(totalPrice)
            
            // Check if any items are flash sale items and get their settings
            checkFlashSaleSettings(cartArray)
        }

        loadCartData()
    }, [router]) // Added router to deps

    // Check flash sale settings for cart items
    const checkFlashSaleSettings = async (items) => {
        try {
            // Get active flash sales
            const response = await fetch('/api/admin/flash-sales?isActive=true')
            if (!response.ok) return
            
            const flashSales = await response.json()
            if (!flashSales || flashSales.length === 0) {
                // No active flash sales, allow all discounts
                setAllowCoupons(true)
                setAllowCrashCash(true)
                return
            }
            
            // Check if any cart items are in active flash sales
            const cartProductIds = items.map(item => item.id || item._id)
            let hasSaleItemsWithoutCoupons = false
            let hasSaleItemsWithoutCrashCash = false
            
            for (const sale of flashSales) {
                const saleProductIds = sale.products || []
                const hasMatch = cartProductIds.some(id => saleProductIds.includes(id))
                
                if (hasMatch) {
                    if (sale.allowCoupons === false) {
                        hasSaleItemsWithoutCoupons = true
                    }
                    if (sale.allowCrashCash === false) {
                        hasSaleItemsWithoutCrashCash = true
                    }
                }
            }
            
            // If any flash sale item restricts coupons/crashcash, disable them
            setAllowCoupons(!hasSaleItemsWithoutCoupons)
            setAllowCrashCash(!hasSaleItemsWithoutCrashCash)
        } catch (error) {
            console.error('Error checking flash sale settings:', error)
            // On error, allow both by default
            setAllowCoupons(true)
            setAllowCrashCash(true)
        }
    }

    // Fetch admin charges
    useEffect(() => {
        const fetchCharges = async () => {
            try {
                const res = await fetch('/api/admin/charges')
                if (res.ok) {
                    const data = await res.json()
                    if (data.success) setCharges(data.charges)
                }
            } catch (e) {
                console.error('Failed to load admin charges', e)
            }
        }
        fetchCharges()
    }, [])

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
                    console.log('Checkout - Fetched addresses:', data)
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

    // Load phone number from user profile and CrashCash balance from server (fallback to local)
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

        const loadServerCrashCash = async (user) => {
            if (!user?.id) return false
            try {
                const resp = await fetch(`/api/crashcash/rewards?userId=${user.id}`, {
                    credentials: 'include'
                })
                if (resp.ok) {
                    const data = await resp.json()
                    const active = data.activeRewards || []
                    const total = active.reduce((sum, r) => sum + Number(r.amount || r.crashcash || 0), 0)
                    setCrashCashBalance(total)
                    console.log('💰 Loaded CrashCash balance from server:', total)
                    return true
                }
            } catch (err) {
                console.warn('Checkout: server crashcash fetch failed, using local fallback', err)
            }
            return false
        }

        // Load CrashCash balance; prefer server, fallback to local merged storage
        const loadCrashCashBalance = async () => {
            try {
                const user = userData ? JSON.parse(userData) : null
                const ok = await loadServerCrashCash(user)
                if (ok) return

                const balance = updateCrashCashBalance()
                setCrashCashBalance(balance)
                console.log('💰 Loaded CrashCash balance from local fallback:', balance)
            } catch (error) {
                console.error('Error loading CrashCash balance:', error)
                setCrashCashBalance(0)
            }
        }

        loadCrashCashBalance()

        // Listen for CrashCash updates
        const handleCrashCashUpdate = () => {
            loadCrashCashBalance()
        }
        window.addEventListener('crashcash-update', handleCrashCashUpdate)

        return () => {
            window.removeEventListener('crashcash-update', handleCrashCashUpdate)
        }
    }, [])

    const fetchCrashCashBalance = async (email) => {
        // This function is no longer needed - keeping for backward compatibility
        // CrashCash is now stored in localStorage only
        return
    }

    const selectedAddress = addresses?.find(a => a.id === selectedAddressId)

    const handleApplyCoupon = async () => {
        setCouponError('')
        try {
            const productIds = cartArray.map(p => p.id || p._id)
            const result = await validateCoupon(couponCode, totalPrice, productIds)

            if (result && result.valid) {
                // Preserve full coupon object so couponType / waive flags remain available
                setAppliedCoupon({
                    ...result.coupon,
                    code: result.coupon?.code || couponCode.toUpperCase(),
                    discount: result.discount || 0
                })
                // Show animation popup
                setAnimationMessage('Coupon has been applied successfully!')
                setShowCouponAnimation(true)
                setTimeout(() => setShowCouponAnimation(false), 3000)
            } else {
                setCouponError(result?.message || 'Invalid coupon')
            }
        } catch (err) {
            console.error('Error applying coupon:', err)
            setCouponError('Failed to apply coupon. Please try again.')
        }
    }

    const handleRemoveCoupon = () => {
        setAppliedCoupon(null)
        setCouponCode('')
    }

    // Calculate maximum CrashCash that can be redeemed based on product prices
    const calculateMaxRedeemableCrashCash = () => {
        let maxRedeemable = 0
        
        // For each product in cart, calculate max redeemable as percentage of price
        cartArray.forEach(item => {
            // Max redeemable is up to 5% of product price per item
            const itemMaxRedeemable = Math.round((item.price * 5) / 100) * item.quantity
            maxRedeemable += itemMaxRedeemable
        })
        
        return maxRedeemable
    }

    const handleApplyCrashCash = () => {
        const amount = Number(crashCashToUse)
        if (isNaN(amount) || amount <= 0) {
            toast.error('Please enter a valid amount')
            return
        }
        if (amount > crashCashBalance) {
            toast.error(`You only have ₹${crashCashBalance} CrashCash available`)
            return
        }
        
        // Calculate max redeemable crashcash for this order
        const maxRedeemable = calculateMaxRedeemableCrashCash()
        if (amount > maxRedeemable) {
            toast.error(`Maximum ₹${maxRedeemable} CrashCash can be redeemed for this order (up to 5% of product prices)`)
            return
        }
        
        // Calculate remaining amount after coupon discount
        let remainingTotal = totalPrice
        if (appliedCoupon) {
            remainingTotal -= appliedCoupon.discount
        }
        if (amount > remainingTotal) {
            toast.error(`Maximum ₹${remainingTotal} can be applied to this order`)
            return
        }
        setAppliedCrashCash(amount)
        // Show animation popup
        setAnimationMessage(`₹${amount} CrashCash applied successfully!`)
        setShowCrashCashAnimation(true)
        setTimeout(() => setShowCrashCashAnimation(false), 3000)
    }

    const handleRemoveCrashCash = () => {
        setAppliedCrashCash(0)
        setCrashCashToUse(0)
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
        if (appliedCrashCash > 0) {
            total -= appliedCrashCash
        }
        return Math.max(0, total)
    }

    // Compute delivery/convenience/platform fees based on admin charges and applied coupon
    const computeDeliveryFees = () => {
        const items = cartArray || []
        const admin = charges || { global: { shippingFee: 40, freeAbove: 999, convenienceFee: 0, platformFee: 0 }, rules: [] }
        const global = admin.global || {}

        // For each item, find most specific rule (product > category > all)
        const matched = items.map(item => {
            const pid = item.id || item._id
            const category = item.category || ''
            let rule = (admin.rules || []).find(r => r.scopeType === 'product' && String(r.scope) === String(pid))
            if (!rule && category) rule = (admin.rules || []).find(r => r.scopeType === 'category' && String(r.scope).toLowerCase() === String(category).toLowerCase())
            if (!rule) rule = (admin.rules || []).find(r => r.scopeType === 'all' || r.scope === '*')
            return {
                shippingFee: Number(rule?.shippingFee ?? global.shippingFee ?? 0),
                convenienceFee: Number(rule?.convenienceFee ?? global.convenienceFee ?? 0),
                platformFee: Number(rule?.platformFee ?? global.platformFee ?? 0)
            }
        })

        const baseShipping = matched.length ? Math.max(...matched.map(m => m.shippingFee)) : Number(global.shippingFee || 0)
        const convenience = matched.length ? Math.max(...matched.map(m => m.convenienceFee)) : Number(global.convenienceFee || 0)
        const platformFee = matched.length ? Math.max(...matched.map(m => m.platformFee)) : Number(global.platformFee || 0)

        // Determine waived categories from coupon (prefer appliesToCharges array)
        const waived = Array.isArray(appliedCoupon?.appliesToCharges) ? appliedCoupon.appliesToCharges.map(x => String(x).toLowerCase()) : []
        const isFreeDeliveryCoupon = !!(
            (appliedCoupon && ((appliedCoupon.couponType && String(appliedCoupon.couponType).toLowerCase().includes('free')) || (appliedCoupon.type && String(appliedCoupon.type).toLowerCase().includes('free'))))
        )

        let ship = baseShipping
        let conv = convenience
        let plat = platformFee

        if (waived.includes('shipping') || isFreeDeliveryCoupon) ship = 0
        if (waived.includes('convenience')) conv = 0
        if (waived.includes('platform')) plat = 0

        const subtotalAfterDiscount = getTotalAfterDiscount()
        const freeAbove = Number(global.freeAbove || 999)
        const feesAreFreeByThreshold = subtotalAfterDiscount >= freeAbove
        if (feesAreFreeByThreshold) {
            ship = 0
            conv = 0
            plat = 0
        }

        const deliveryCharge = Number(ship + conv + plat)
        return { shipping: ship, convenience: conv, platform: plat, deliveryCharge, freeAbove }
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

         // Calculate delivery/convenience/platform fees using admin charges and coupon waivers
         const subtotalAfterDiscount = getTotalAfterDiscount()
         const fees = computeDeliveryFees()
         const deliveryCharge = fees.deliveryCharge
         const finalTotal = subtotalAfterDiscount + deliveryCharge

         // Prepare checkout data (NO Cashfree order creation yet)
          const checkoutData = {
              selectedAddressId,
              mobileNumber,
              appliedCoupon,
              appliedCrashCash,
              items: cartArray.map(item => {
                  // Calculate random CrashCash earned (1-5% of product price)
                  const randomPercentage = Math.floor(Math.random() * 5) + 1
                  const itemPrice = item.salePrice || item.price || item.originalPrice || 0
                  const earnedCrashCash = Math.round((itemPrice * randomPercentage) / 100)
                  
                  return {
                      ...item,
                      // Ensure storeId is included (required for order creation)
                      storeId: item.storeId || item.store_id,
                      // Ensure price includes flash sale price if available
                      price: itemPrice,
                      // Add randomized CrashCash earning for this item
                      earnedCrashCash: earnedCrashCash,
                      crashCashPercentage: randomPercentage
                  }
              }),
              subtotal: totalPrice,
              discount: appliedCoupon?.discount || 0,
              crashCashDiscount: appliedCrashCash,
              deliveryCharge: deliveryCharge,
              total: finalTotal,
              isBuyNow: false
          }

         try {
             // ✅ Store checkout data and proceed to payment method selection
             // Cashfree order will be created ONLY when user selects Card/UPI and clicks "Complete Payment"
             console.log('💾 Storing checkout data (Cashfree order NOT created yet)')
             sessionStorage.setItem('checkoutData', JSON.stringify(checkoutData))
             router.push('/payment-method')

         } catch (error) {
             console.error('Checkout error:', error)
             toast.error(error.message || 'Failed to proceed to payment', {
                 duration: 4000
             })
         }
     }

    if (cartArray.length === 0) {
        return (
            <div className="min-h-[70vh] flex items-center justify-center">
                <div className="text-center">
                    <ShoppingBag className="w-16 h-16 mx-auto text-slate-400 mb-4" />
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Your cart is empty</h2>
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

    const fees = computeDeliveryFees()

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-12">
            <div className="max-w-4xl mx-auto px-4">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">Checkout</h1>
                    <p className="text-slate-600 dark:text-slate-400">Review your order and proceed to payment</p>
                </div>

                <div className="grid grid-cols-1 gap-8">
                    {/* Main Content */}
                    <div className="space-y-6">
                        {/* Order Items */}
                        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-lg p-8">
                            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                                <ShoppingBag className="w-6 h-6 text-blue-600" />
                                Order Items ({cartArray.length})
                            </h2>

                            <div className="space-y-4">
                                {cartArray.map((item, index) => (
                                    <div key={index} className="flex gap-4 pb-4 border-b border-slate-200 dark:border-slate-700 last:border-0">
                                         <div className="relative w-20 h-20 bg-slate-100 dark:bg-slate-700 rounded-lg overflow-hidden flex-shrink-0">
                                             {!item.inStock ? (
                                                 <>
                                                     {/* Show product image with out of stock overlay */}
                                                     {item.images && item.images.length > 0 ? (
                                                         <Image 
                                                             src={item.images[0]} 
                                                             alt={item.name}
                                                             width={80}
                                                             height={80}
                                                             className="w-full h-full object-cover opacity-30"
                                                         />
                                                     ) : (
                                                         <div className="w-full h-full bg-slate-300 dark:bg-slate-600 flex items-center justify-center text-slate-500 opacity-30">
                                                             No Image
                                                         </div>
                                                     )}
                                                     {/* Out of stock animation overlay */}
                                                     <div className='absolute inset-0 flex items-center justify-center'>
                                                         <OutOfStockDisplay size="small" />
                                                     </div>
                                                 </>
                                             ) : (
                                                 <>
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
                                                 </>
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

                        {/* Coupon Section - Only show if allowed */}
                        {allowCoupons && (
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
                        )}

                        {/* CrashCash Section - Only show if allowed */}
                        {allowCrashCash && (
                        <div className="bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-orange-950/20 dark:to-yellow-950/20 rounded-3xl shadow-lg p-8 border-2 border-orange-200 dark:border-orange-800">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-xl">
                                    <img src="/crashcash.ico" alt="CrashCash" className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">Use CrashCash</h2>
                                    <p className="text-sm text-orange-700 dark:text-orange-300">Available: ₹{crashCashBalance.toFixed(2)}</p>
                                </div>
                            </div>

                            {appliedCrashCash === 0 ? (
                                <div className="space-y-3">
                                    <div className="flex gap-2">
                                        <input
                                            type="number"
                                            value={crashCashToUse}
                                            onChange={(e) => setCrashCashToUse(Math.max(0, Number(e.target.value)))}
                                            placeholder={`Enter amount (Max: ₹${Math.min(crashCashBalance, calculateMaxRedeemableCrashCash())})`}
                                            max={Math.min(crashCashBalance, calculateMaxRedeemableCrashCash())}
                                            className="flex-1 px-4 py-3 border-2 border-orange-300 dark:border-orange-700 bg-white dark:bg-slate-700 text-slate-800 dark:text-white rounded-lg focus:outline-none focus:border-orange-600"
                                        />
                                        <button
                                            onClick={handleApplyCrashCash}
                                            className="px-6 py-3 bg-gradient-to-r from-orange-500 to-yellow-500 text-white font-bold rounded-lg hover:from-orange-600 hover:to-yellow-600 transition shadow-lg"
                                        >
                                            Apply
                                        </button>
                                    </div>
                                    <div className="flex gap-2 flex-wrap">
                                        <p className="text-xs text-orange-700 dark:text-orange-300 w-full mb-1">Quick Apply:</p>
                                        {[50, 100, 200].filter(amt => amt <= crashCashBalance && amt <= calculateMaxRedeemableCrashCash()).map(amount => (
                                            <button
                                                key={amount}
                                                onClick={() => {
                                                    setCrashCashToUse(amount)
                                                    setAppliedCrashCash(amount)
                                                    setAnimationMessage(`₹${amount} CrashCash applied successfully!`)
                                                    setShowCrashCashAnimation(true)
                                                    setTimeout(() => setShowCrashCashAnimation(false), 3000)
                                                }}
                                                className="px-4 py-2 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border border-orange-300 dark:border-orange-700 rounded-lg hover:bg-orange-200 dark:hover:bg-orange-900/50 transition text-sm font-semibold"
                                            >
                                                ₹{amount}
                                            </button>
                                        ))}
                                    </div>
                                    <p className="text-xs text-orange-700 dark:text-orange-300 flex items-start gap-1">
                                        <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
                                        </svg>
                                        <span>CrashCash is instant discount money in your wallet. Use it just like Flipkart SuperCoins!</span>
                                    </p>
                                </div>
                            ) : (
                                <div className="flex items-center justify-between bg-gradient-to-r from-orange-100 to-yellow-100 dark:from-orange-900/30 dark:to-yellow-900/30 p-4 rounded-lg border-2 border-orange-300 dark:border-orange-700">
                                    <div>
                                        <p className="text-sm text-orange-700 dark:text-orange-300">CrashCash Applied</p>
                                        <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">-₹{appliedCrashCash.toFixed(2)}</p>
                                        <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">Remaining: ₹{(crashCashBalance - appliedCrashCash).toFixed(2)}</p>
                                    </div>
                                    <button
                                        onClick={handleRemoveCrashCash}
                                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-semibold shadow-lg"
                                    >
                                        Remove
                                    </button>
                                </div>
                            )}
                        </div>
                        )}

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

                        {/* Price Summary */}
                        <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 rounded-2xl p-6 border-2 border-slate-200 dark:border-slate-700">
                            <h3 className="font-bold text-slate-800 dark:text-white mb-4 text-lg">Price Breakdown</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between text-slate-700 dark:text-slate-300">
                                    <span>Subtotal ({cartArray.length} items)</span>
                                    <span className="font-semibold">₹{totalPrice.toLocaleString()}</span>
                                </div>
                                {appliedCoupon && (
                                    <div className="flex justify-between text-green-600 dark:text-green-400">
                                        <span>Coupon Discount ({appliedCoupon.code})</span>
                                        <span className="font-semibold">-₹{appliedCoupon.discount.toLocaleString()}</span>
                                    </div>
                                )}
                                {appliedCrashCash > 0 && (
                                    <div className="flex justify-between text-orange-600 dark:text-orange-400">
                                        <span>CrashCash Discount</span>
                                        <span className="font-semibold">-₹{appliedCrashCash.toLocaleString()}</span>
                                    </div>
                                )}
                                {/* Delivery Charge */}
                                <div className="flex justify-between text-slate-700 dark:text-slate-300">
                                    <span className="flex items-center gap-2">
                                        <Truck size={16} />
                                        Delivery Charge
                                        {getTotalAfterDiscount() >= (fees.freeAbove || 999) && (
                                            <span className="text-xs text-green-600 dark:text-green-400 font-semibold">FREE</span>
                                        )}
                                    </span>
                                    <span className={`font-semibold ${getTotalAfterDiscount() >= (fees.freeAbove || 999) ? 'line-through text-slate-400' : ''}`}>
                                        ₹{(getTotalAfterDiscount() >= (fees.freeAbove || 999) ? 0 : fees.deliveryCharge).toLocaleString()}
                                    </span>
                                </div>
                                <div className="border-t-2 border-slate-300 dark:border-slate-600 pt-3">
                                    <div className="flex justify-between text-slate-900 dark:text-white text-xl font-bold">
                                        <span>Total Amount</span>
                                        <span className="text-red-600 dark:text-red-400">₹{(getTotalAfterDiscount() + fees.deliveryCharge).toLocaleString()}</span>
                                    </div>
                                </div>
                                {(appliedCoupon || appliedCrashCash > 0) && (
                                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-3 mt-2">
                                        <p className="text-sm text-green-700 dark:text-green-300 font-semibold">
                                            🎉 You're saving ₹{((appliedCoupon?.discount || 0) + appliedCrashCash).toLocaleString()}!
                                        </p>
                                    </div>
                                )}
                                {getTotalAfterDiscount() < (fees.freeAbove || 999) && (
                                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3">
                                        <p className="text-sm text-blue-700 dark:text-blue-300">
                                            💡 Add ₹{((fees.freeAbove || 999) - getTotalAfterDiscount()).toLocaleString()} more to get FREE delivery!
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Proceed to Payment Button */}
                        <button
                            onClick={handleProceedToPayment}
                            className="w-full px-6 py-4 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold rounded-lg transition shadow-lg hover:shadow-xl flex items-center justify-center gap-2 active:scale-95"
                        >
                            Proceed to Payment • ₹{(getTotalAfterDiscount() + fees.deliveryCharge).toLocaleString()}
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

            {/* Coupon Animation Popup */}
            {showCouponAnimation && couponAnimationData && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-8 max-w-md w-full mx-4 relative animate-in fade-in zoom-in duration-300">
                        <button
                            onClick={() => setShowCouponAnimation(false)}
                            className="absolute top-4 right-4 p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition"
                        >
                            <X size={20} className="text-slate-600 dark:text-slate-400" />
                        </button>
                        <div className="w-48 h-48 mx-auto">
                            <Lottie
                                animationData={couponAnimationData}
                                loop={true}
                                autoplay={true}
                            />
                        </div>
                        <p className="text-center text-xl font-bold text-green-600 dark:text-green-400 mt-4">
                            {animationMessage}
                        </p>
                    </div>
                </div>
            )}

            {/* CrashCash Animation Popup */}
            {showCrashCashAnimation && crashCashAnimationData && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-orange-950/90 dark:to-yellow-950/90 rounded-3xl shadow-2xl p-8 max-w-md w-full mx-4 relative animate-in fade-in zoom-in duration-300 border-2 border-orange-300 dark:border-orange-700">
                        <button
                            onClick={() => setShowCrashCashAnimation(false)}
                            className="absolute top-4 right-4 p-2 hover:bg-orange-100 dark:hover:bg-orange-900/50 rounded-full transition"
                        >
                            <X size={20} className="text-orange-600 dark:text-orange-400" />
                        </button>
                        <div className="w-48 h-48 mx-auto">
                            <Lottie
                                animationData={crashCashAnimationData}
                                loop={true}
                                autoplay={true}
                            />
                        </div>
                        <p className="text-center text-xl font-bold text-orange-600 dark:text-orange-400 mt-4">
                            {animationMessage}
                        </p>
                    </div>
                </div>
            )}
        </div>
    )
}
