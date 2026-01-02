'use client'
import React, { useState, useEffect, Suspense } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { CheckCircle2, ShoppingBag, Truck, MapPin, Phone, Mail, Edit2, Plus, AlertCircle, Share2, CreditCard } from 'lucide-react'
import { allProductsData, productDummyData } from '@/assets/assets'
import AddressForm from '@/components/AddressForm'
import { validateCoupon } from '@/lib/coupons'
import PaymentAnimation from '@/components/animations/PaymentAnimation'
import SuccessAnimation from '@/components/animations/SuccessAnimation'
import { Boxes } from '@/components/ui/boxes'
import ScratchCard from '@/components/ScratchCard'
import { getUserCrashCash, deductUserCrashCash, setUserCrashCash, migrateOldCrashCash } from '@/lib/userCrashcashUtils'
import { getUserAddresses, saveUserAddresses, initializeUserProfile, migrateUserData, addUserOrder } from '@/lib/userDataStorage'

function PlaceOrderContent() {
    const router = useRouter()
    const dispatch = useDispatch()
    const searchParams = useSearchParams()
    const cartItems = useSelector(state => state?.cart?.items || [], (prev, next) => 
        Array.isArray(prev) && Array.isArray(next) ? prev.length === next.length && prev.every((item, idx) => item?.id === next[idx]?.id) : prev === next
    )
    const [isProcessing, setIsProcessing] = useState(false)
    const [orderPlaced, setOrderPlaced] = useState(false)
    const [productData, setProductData] = useState(null)
    const [showAddressForm, setShowAddressForm] = useState(false)
    const [addresses, setAddresses] = useState([])
    const [selectedAddressId, setSelectedAddressId] = useState(null)
    const [couponCode, setCouponCode] = useState('')
    const [couponError, setCouponError] = useState('')
    const [appliedCoupon, setAppliedCoupon] = useState(null)
    const [orderId, setOrderId] = useState('')
    const [showPaymentProcessing, setShowPaymentProcessing] = useState(false)
    const [showConfirmation, setShowConfirmation] = useState(false)
    const [paymentMethod, setPaymentMethod] = useState('COD')
    const [showScratchCard, setShowScratchCard] = useState(false)
    const [scratchReward, setScratchReward] = useState(null)
    const [userCrashCash, setUserCrashCash] = useState([])
    const [appliedCrashCash, setAppliedCrashCash] = useState(0)
    const [useCrashCash, setUseCrashCash] = useState(false)

    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '₹'

    // Load addresses and crash cash from per-user storage
    useEffect(() => {
        const userData = localStorage.getItem('user')
        if (!userData) return

        try {
            const user = JSON.parse(userData)
            const email = user.email
            
            if (!email) return
            
            // Migrate and initialize user data
            migrateUserData(email)
            initializeUserProfile(email, user)
            
            // Fetch addresses from API
            const fetchAddresses = async () => {
                try {
                    const token = localStorage.getItem('token')
                    const response = await fetch('/api/user/addresses', {
                        headers: {
                            'x-user-email': email,
                            ...(token && { 'Authorization': `Bearer ${token}` })
                        }
                    })

                    if (response.ok) {
                        const data = await response.json()
                        if (data.addresses && data.addresses.length > 0) {
                            setAddresses(data.addresses)
                            // Auto-select first address or default
                            if (!selectedAddressId) {
                                const defaultAddr = data.addresses.find(addr => addr.isDefault) || data.addresses[0]
                                setSelectedAddressId(defaultAddr.id)
                            }
                        } else {
                            // No addresses in database, show empty state
                            setAddresses([])
                        }
                    }
                } catch (error) {
                    console.error('Error fetching addresses:', error)
                }
            }
            
            fetchAddresses()

            // Load user's CrashCash from server as single source; fallback to local if server fails
            const loadServerCrashCash = async () => {
                try {
                    const resp = await fetch(`/api/crashcash/rewards?userId=${user.id}`)
                    if (resp.ok) {
                        const data = await resp.json()
                        const active = data.activeRewards || []
                        const mapped = active.map(r => ({
                            id: r.id,
                            amount: r.amount || r.crashcash || 0,
                            expiryDate: r.expiresAt,
                            source: r.source,
                            earnedAt: r.earnedAt || r.awardedAt || r.scratchedAt || null
                        }))
                        setUserCrashCash(mapped)
                        return true
                    }
                } catch (err) {
                    console.warn('Checkout: server crashcash fetch failed, using local', err)
                }
                return false
            }

            const fallbackLocalCrashCash = () => {
                // Migrate old crash cash on first load
                migrateOldCrashCash(email)
                const userCashData = getUserCrashCash(email)

                // Merge CrashCash from local rewards storage (scratch/discountRewards)
                const extraCrashCash = []
                try {
                    const discountRewards = JSON.parse(localStorage.getItem('discountRewards') || '[]')
                    discountRewards.forEach(r => {
                        const isCash = r.rewardType === 'crashcash' || (!r.rewardType && !r.discount && (r.amount || r.bonusCrashcash || r.crashcash))
                        if (isCash) {
                            extraCrashCash.push({
                                id: r.id || `cash_${Date.now()}`,
                                amount: r.amount || r.bonusCrashcash || r.crashcash || 0,
                                expiryDate: r.expiresAt || r.expiryDate,
                                source: r.source || 'scratch_card',
                                earnedAt: r.earnedAt || r.scratchedAt || r.wonDate || null
                            })
                        }
                    })

                    const scratchRewards = JSON.parse(localStorage.getItem('scratchCardRewards') || '[]')
                    scratchRewards.forEach(r => {
                        const isCash = r.rewardType === 'crashcash' || (!r.rewardType && r.crashcash)
                        if (isCash) {
                            extraCrashCash.push({
                                id: r.id || r.code || `cash_${Date.now()}`,
                                amount: r.crashcash || 0,
                                expiryDate: r.expiresAt || r.expiryDate,
                                source: 'scratch_card',
                                earnedAt: r.scratchedAt || r.wonDate || r.earnedAt || null
                            })
                        }
                    })
                } catch (mergeErr) {
                    console.warn('Checkout: failed to merge extra crashcash', mergeErr)
                }

                const mergedItems = [...(userCashData.items || []), ...extraCrashCash]
                if (mergedItems.length > 0) {
                    setUserCrashCash(mergedItems)
                }
            }

            loadServerCrashCash().then(ok => {
                if (!ok) fallbackLocalCrashCash()
            })
        } catch (error) {
            console.error('Error loading user data:', error)
        }
    }, [selectedAddressId])

    // Get product data from URL params
    useEffect(() => {
        const productId = searchParams.get('productId')
        const productName = searchParams.get('productName')
        const productPrice = searchParams.get('productPrice')
        const quantity = searchParams.get('quantity')

        if (productId && productName && productPrice) {
            const fullProduct = allProductsData.find(p => p.id === productId)
            
            setProductData({
                id: productId,
                name: decodeURIComponent(productName),
                price: parseFloat(productPrice),
                quantity: parseInt(quantity) || 1,
                image: fullProduct?.images?.[0] || null
            })
        }
    }, [searchParams])

    const calculateTotal = () => {
        if (productData) {
            return productData.price * productData.quantity
        }
        if (cartItems && cartItems.length > 0) {
            return cartItems.reduce((total, item) => total + ((item.price || 0) * (item.quantity || 1)), 0)
        }
        return 0
    }

    // Calculate maximum CrashCash that can be redeemed based on product prices
    const calculateMaxRedeemableCrashCash = () => {
        let maxRedeemable = 0
        
        if (productData) {
            // For single product, max redeemable is up to 5% of product price
            maxRedeemable = Math.round((productData.price * 5) / 100) * productData.quantity
        } else if (cartItems && cartItems.length > 0) {
            // For cart items, sum up max redeemable for each
            cartItems.forEach(item => {
                const itemMaxRedeemable = Math.round((item.price * 5) / 100) * item.quantity
                maxRedeemable += itemMaxRedeemable
            })
        }
        
        return maxRedeemable
    }

    const handleAddAddress = async (addressData) => {
        // The AddressForm component already handles the API call
        // Just refresh the addresses list and close the form
        setShowAddressForm(false)
        
        // Refresh addresses from API
        try {
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
                    if (data.addresses && data.addresses.length > 0) {
                        setAddresses(data.addresses)
                        // Auto-select the newly added address (usually the last one)
                        const newAddress = data.addresses[data.addresses.length - 1]
                        setSelectedAddressId(newAddress.id)
                    }
                }
            }
        } catch (error) {
            console.error('Error refreshing addresses:', error)
        }
    }

    const handleApplyCoupon = async () => {
        setCouponError('')
        try {
            const totalAmount = calculateTotal()
            const productIds = productData ? [productData.id] : (cartItems || []).map(i => i.id)
            const result = await validateCoupon(couponCode, totalAmount, productIds)

            if (result && result.valid) {
                setAppliedCoupon({
                    ...result.coupon,
                    code: result.coupon?.code || couponCode.toUpperCase(),
                    discount: result.discount || 0
                })
            } else {
                setCouponError(result?.message || 'Invalid coupon')
            }
        } catch (err) {
            console.error('Error applying coupon:', err)
            setCouponError('Failed to validate coupon. Please try again.')
        }
    }

    const handleRemoveCoupon = () => {
        setAppliedCoupon(null)
        setCouponCode('')
    }

    const getTotalCrashCashAvailable = () => {
        return userCrashCash.reduce((sum, item) => sum + Number(item.amount || 0), 0)
    }

    const getTotalAfterDiscount = () => {
        const total = calculateTotal()
        let finalTotal = total
        
        // Apply coupon discount
        if (appliedCoupon) {
            finalTotal = Math.max(0, finalTotal - appliedCoupon.discount)
        }
        
        // Apply crash cash discount
        if (useCrashCash && appliedCrashCash > 0) {
            finalTotal = Math.max(0, finalTotal - appliedCrashCash)
        }
        
        return finalTotal
    }

    const handleApplyCrashCash = () => {
        const total = calculateTotal()
        const totalCouponDiscount = appliedCoupon?.discount || 0
        const totalAfterCoupon = total - totalCouponDiscount
        const availableCash = getTotalCrashCashAvailable()
        const maxRedeemable = calculateMaxRedeemableCrashCash()
        
        // Apply only the amount that meets all constraints:
        // 1. Cannot exceed available balance
        // 2. Cannot exceed max redeemable (5% of product prices)
        // 3. Cannot exceed remaining total after coupon discount
        const cashToApply = Math.min(availableCash, maxRedeemable, totalAfterCoupon)
        
        setAppliedCrashCash(cashToApply)
        setUseCrashCash(true)
    }

    const handleRemoveCrashCash = () => {
        setAppliedCrashCash(0)
        setUseCrashCash(false)
    }

    const handlePlaceOrder = async () => {
        if (!selectedAddressId) {
            setCouponError('Please select a delivery address')
            return
        }

        // Show payment processing animation
        setShowPaymentProcessing(true)

        // After 3 seconds, show success
        setTimeout(() => {
            setShowPaymentProcessing(false)
            setShowConfirmation(true)
        }, 3000)
    }

    const generateScratchReward = () => {
        const rewards = [
            { type: 'discount', value: 10, minOrder: 999 },
            { type: 'discount', value: 15, minOrder: 1499 },
            { type: 'discount', value: 20, minOrder: 1999 },
            { type: 'cashback', value: 50, minOrder: 499 },
            { type: 'cashback', value: 100, minOrder: 999 },
            { type: 'cashback', value: 200, minOrder: 1999 },
        ]
        
        const randomReward = rewards[Math.floor(Math.random() * rewards.length)]
        const code = `CK${Math.random().toString(36).substr(2, 8).toUpperCase()}`
        const expiryDate = new Date()
        expiryDate.setDate(expiryDate.getDate() + 30) // Valid for 30 days
        
        return {
            ...randomReward,
            code,
            expiryDate: expiryDate.toISOString(),
            earnedOn: new Date().toISOString()
        }
    }

    const getRandomCrashcashFromOrder = (minAmount = 5, maxAmount) => {
        // If maxAmount is not provided, default to 50
        const max = maxAmount || 50
        if (max < minAmount) {
            return minAmount
        }
        return Math.floor(Math.random() * (max - minAmount + 1)) + minAmount
    }

    const awardCrashcashForOrder = (orderProducts) => {
        // Calculate total crashcash from all products in order
        let totalCrashcash = 0
        let productCount = 0
        const itemBreakdown = []

        // Handle both single product and cart items
        if (orderProducts && orderProducts.length > 0) {
            orderProducts.forEach(item => {
                // Try to get the full product data
                let minCrashCash = 10
                let maxCrashCash = 240
                
                // If item has ID, try to find in allProductsData
                if (item.id) {
                    const fullProduct = allProductsData.find(p => p.id === item.id)
                    if (fullProduct) {
                        minCrashCash = fullProduct.crashCashMin || 10
                        maxCrashCash = fullProduct.crashCashMax || 240
                    }
                }
                // If item itself has crashCashMin/Max properties (for backward compatibility)
                else if (item.crashCashMin && item.crashCashMax) {
                    minCrashCash = item.crashCashMin
                    maxCrashCash = item.crashCashMax
                }
                // Fallback to crashCashValue if present
                else if (item.crashCashValue) {
                    maxCrashCash = item.crashCashValue
                    minCrashCash = Math.floor(item.crashCashValue * 0.1) || 10
                }
                
                // Award random amount between min and max
                const reward = getRandomCrashcashFromOrder(minCrashCash, maxCrashCash)
                totalCrashcash += reward
                
                itemBreakdown.push({
                    productId: item.id,
                    productName: item.name,
                    earned: reward,
                    min: minCrashCash,
                    max: maxCrashCash
                })
                productCount++
            })
        }

        // Add to total balance (always add, whether they win scratchcard or not)
         if (totalCrashcash > 0) {
             // Get user email for per-user crash cash storage
             const userData = localStorage.getItem('user')
             const userEmail = userData ? JSON.parse(userData).email : null
             
             if (userEmail) {
                 // Load existing user crash cash
                 const existingData = getUserCrashCash(userEmail)
                 
                 // Create wallet entry for crash cash earned
                 const expiryDate = new Date()
                 expiryDate.setDate(expiryDate.getDate() + 30) // Valid for 30 days
                 
                 const orderId = `ORD${Math.random().toString(36).substr(2, 9).toUpperCase()}`
                 const newItem = {
                     code: `ORDER-${orderId}`,
                     amount: totalCrashcash,
                     source: 'Order Purchase',
                     orderId: orderId,
                     itemBreakdown: itemBreakdown,
                     earnedAt: new Date().toISOString(),
                      orderDate: new Date().toISOString(),
                      expiryDate: expiryDate.toISOString(),
                      status: 'active'
                     }
                     
                     // Add new item to existing items and update balance
                     const updatedItems = [...(existingData.items || []), newItem]
                     const newBalance = existingData.balance + totalCrashcash
                     
                     // Save updated crash cash for user
                     setUserCrashCash(userEmail, newBalance, updatedItems)
                     
                     // Record the order reward for history
                     const orderRewards = JSON.parse(localStorage.getItem('orderCrashCashRewards') || '[]')
                     orderRewards.push({
                      orderId: orderId,
                      amount: totalCrashcash,
                      itemCount: productCount,
                      itemBreakdown: itemBreakdown,
                      awardedAt: new Date().toLocaleString(),
                      orderDate: new Date().toLocaleString(),
                      expiryDate: expiryDate.toLocaleString(),
                      userEmail: userEmail
                     })
                     localStorage.setItem('orderCrashCashRewards', JSON.stringify(orderRewards))
                     }

            // Dispatch events to update counter (multiple times to ensure it's caught)
            window.dispatchEvent(new Event('storage'))
            window.dispatchEvent(new Event('crashcash-update'))
            setTimeout(() => {
                window.dispatchEvent(new Event('storage'))
                window.dispatchEvent(new Event('crashcash-update'))
            }, 100)
        }

        return totalCrashcash
    }

    const handleOrderConfirm = () => {
         const selectedAddress = addresses.find(a => a.id === selectedAddressId)
         const newOrderId = `ORD${Math.random().toString(36).substr(2, 9).toUpperCase()}`
         
         // Get products - store only references that can be serialized
         let orderProducts = []
         if (productData) {
             // Single product order
             orderProducts = [{
                 id: productData.id,
                 name: productData.name,
                 price: productData.price,
                 quantity: productData.quantity || 1
             }]
         } else {
             // Cart order - keep only serializable data
             orderProducts = cartItems.map(item => ({
                 id: item.id,
                 name: item.name,
                 price: item.price,
                 quantity: item.quantity || 1
             }))
         }
         
         const order = {
             id: newOrderId,
             orderItems: orderProducts.map((item, idx) => ({
                 orderId: newOrderId,
                 productId: item.id,
                 quantity: item.quantity || 1,
                 price: item.price,
                 product: {
                     id: item.id,
                     name: item.name
                 }
             })),
             address: selectedAddress,
             coupon: appliedCoupon,
             crashCashApplied: useCrashCash ? appliedCrashCash : 0,
             subtotal: calculateTotal(),
             discount: appliedCoupon?.discount || 0,
             total: getTotalAfterDiscount(),
             status: 'confirmed',
             createdAt: new Date().toISOString(),
             updatedAt: new Date().toISOString()
         }

         // Deduct applied crash cash from user's wallet
         if (useCrashCash && appliedCrashCash > 0) {
             let remainingToDeduct = appliedCrashCash
             const updatedCrashCash = userCrashCash.map(item => {
                 if (remainingToDeduct <= 0) return item
                 
                 if (item.amount <= remainingToDeduct) {
                     remainingToDeduct -= item.amount
                     return null // Remove completely used items
                 } else {
                     const newAmount = item.amount - remainingToDeduct
                     remainingToDeduct = 0
                     return { ...item, amount: newAmount }
                 }
             }).filter(item => item !== null)
             
             localStorage.setItem('userCrashCash', JSON.stringify(updatedCrashCash))
         }

         // Save order to localStorage
         const existingOrders = localStorage.getItem('userOrders')
         const orders = existingOrders ? JSON.parse(existingOrders) : []
         orders.push(order)
         localStorage.setItem('userOrders', JSON.stringify(orders))

         // Award crashcash for this order based on product's crashCashValue
         const crashcashAwarded = awardCrashcashForOrder(orderProducts)
         
         // Log for debugging
         console.log('✅ Order placed - CrashCash awarded:', crashcashAwarded)
         console.log('📦 Order products:', orderProducts)
         console.log('💰 Current balance:', JSON.parse(localStorage.getItem('crashcashBalance') || '0'))

         // Generate scratch card reward
         const reward = generateScratchReward()
         setScratchReward(reward)

         if (typeof window !== 'undefined') {
             window.__disableNavigationLoader = false
         }

         setOrderId(newOrderId)
         setShowConfirmation(false)
         setShowScratchCard(true)
     }

     const handleScratchReveal = () => {
         // Save reward to localStorage
         const existingRewards = localStorage.getItem('userRewards')
         const rewards = existingRewards ? JSON.parse(existingRewards) : []
         rewards.push(scratchReward)
         localStorage.setItem('userRewards', JSON.stringify(rewards))
     }

     const handleScratchComplete = () => {
         setTimeout(() => {
             router.push('/rewards')
         }, 2000)
     }

    const selectedAddress = addresses.find(a => a.id === selectedAddressId)

    // Scratch Card Screen
    if (showScratchCard && scratchReward) {
        return (
            <div className='fixed inset-0 bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center z-[100] overflow-hidden'>
                <div className='max-w-2xl w-full mx-6'>
                    <div className='text-center mb-8'>
                        <div className='flex items-center justify-center gap-3 mb-4'>
                            <img src="/logo.bmp" alt="CrashKart" className="w-12 h-12" />
                            <h1 className='text-4xl font-bold text-slate-800 dark:text-white'>
                                Congratulations!
                            </h1>
                        </div>
                        <p className='text-slate-600 dark:text-slate-400 text-lg'>
                            Your order is confirmed! Scratch the card below to reveal your reward
                        </p>
                    </div>

                    <ScratchCard reward={scratchReward} onReveal={handleScratchReveal} />

                    <div className='text-center mt-8'>
                        <button
                            onClick={handleScratchComplete}
                            className='px-8 py-3 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white rounded-full font-semibold transition shadow-lg hover:shadow-xl'
                        >
                            View My Rewards
                        </button>
                        <p className='text-sm text-slate-500 dark:text-slate-400 mt-4'>
                            Your reward has been saved to your account
                        </p>
                    </div>
                </div>
            </div>
        )
    }

    // Payment Processing Screen
    if (showPaymentProcessing) {
        return (
            <div className='fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[100] overflow-hidden'>
                <div className='absolute inset-0 w-full h-full'>
                    <Boxes className='opacity-50' />
                </div>
                <div className='bg-white dark:bg-slate-800 rounded-lg shadow-2xl p-8 max-w-md w-full mx-6 text-center relative z-10'>
                    <div className='flex justify-center mb-4'>
                        <PaymentAnimation width='250px' height='250px' />
                    </div>
                    <h2 className='text-2xl font-bold text-slate-800 dark:text-white mb-2'>Processing Payment</h2>
                    <p className='text-slate-600 dark:text-slate-400'>Please wait while we securely process your payment...</p>
                </div>
            </div>
        )
    }

    // Success Confirmation Screen
    if (showConfirmation) {
        const trackingLink = typeof window !== 'undefined' ? `${window.location.origin}/my-orders` : ''
        
        return (
            <div className='fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[100] overflow-hidden'>
                <div className='absolute inset-0 w-full h-full'>
                    <Boxes className='opacity-50' />
                </div>
                <div className='bg-white dark:bg-slate-800 rounded-lg shadow-2xl p-8 max-w-md w-full mx-6 relative z-10'>
                    <div className='text-center mb-6'>
                         <div className='flex justify-center mb-4'>
                              <SuccessAnimation width='200px' height='200px' animationPath="/animations/Sucesso.json" />
                          </div>
                         
                         <h2 className='text-2xl font-bold text-green-600 mb-2'>Order Placed Successfully!</h2>
                         <p className='text-slate-600 dark:text-slate-400 mb-6'>Your order has been confirmed. We'll send you updates soon.</p>
                    </div>

                    {/* Order Details */}
                    <div className='bg-slate-50 dark:bg-slate-700 rounded-lg p-4 mb-6 space-y-2'>
                        <div className='flex justify-between'>
                            <span className='text-slate-600 dark:text-slate-400'>Subtotal</span>
                            <span className='font-semibold text-slate-800 dark:text-white'>{currency}{calculateTotal().toFixed(2)}</span>
                        </div>
                        {appliedCoupon && (
                            <div className='flex justify-between text-green-600'>
                                <span>Coupon Discount</span>
                                <span className='font-semibold'>-{currency}{appliedCoupon.discount.toFixed(2)}</span>
                            </div>
                        )}
                        {useCrashCash && appliedCrashCash > 0 && (
                            <div className='flex justify-between text-amber-600'>
                                <div className='flex items-center gap-2'>
                                    <img src="/crashcash.ico" alt="Crash Cash" className="w-4 h-4" />
                                    <span>Crash Cash</span>
                                </div>
                                <span className='font-semibold'>-{currency}{appliedCrashCash.toFixed(2)}</span>
                            </div>
                        )}
                        <div className='border-t border-slate-200 dark:border-slate-600 pt-2 flex justify-between'>
                            <span className='text-slate-600 dark:text-slate-400 font-bold'>Total</span>
                            <span className='font-bold text-slate-800 dark:text-white'>{currency}{getTotalAfterDiscount().toFixed(2)}</span>
                        </div>
                        <div className='flex justify-between'>
                            <span className='text-slate-600 dark:text-slate-400'>Delivery</span>
                            <span className='font-semibold text-slate-800 dark:text-white'>3-5 Days</span>
                        </div>
                    </div>

                    {/* Share Tracking Link Button */}
                    <button
                        onClick={() => {
                            if (typeof navigator !== 'undefined' && navigator.share) {
                                navigator.share({
                                    title: `Order Tracking`,
                                    text: `Track my order`,
                                    url: trackingLink
                                }).catch(err => console.log('Share error:', err))
                            } else {
                                if (typeof navigator !== 'undefined' && navigator.clipboard) {
                                    navigator.clipboard.writeText(trackingLink)
                                    toast.success('📋 Tracking link copied to clipboard!', { duration: 3000 })
                                }
                            }
                        }}
                        className='w-full mb-3 px-4 py-2.5 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:hover:bg-blue-800 text-blue-700 dark:text-blue-300 rounded-lg font-medium transition text-sm flex items-center justify-center gap-2'
                    >
                        <Share2 size={16} />
                        Share Order Tracking Link
                    </button>

                    {/* Action Buttons */}
                    <div className='space-y-2'>
                        <button
                            onClick={handleOrderConfirm}
                            className='w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition'
                        >
                            Go to My Orders
                        </button>
                        <button
                            onClick={() => {
                                setShowConfirmation(false)
                                router.push('/shop')
                            }}
                            className='w-full px-6 py-3 border-2 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-white rounded-lg font-semibold transition'
                        >
                            Continue Shopping
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    if (orderPlaced) {
        return (
            <div className='min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center px-4 py-12'>
                <div className='max-w-md w-full bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-8 text-center'>
                    <div className='mb-6'>
                        <CheckCircle2 className='w-20 h-20 text-green-600 mx-auto animate-bounce' />
                    </div>
                    <h1 className='text-3xl font-bold text-slate-900 dark:text-white mb-3'>Order Placed!</h1>
                    <p className='text-slate-600 dark:text-slate-400 mb-8'>
                        Order ID: <span className='font-bold text-green-600'>#{orderId}</span>
                    </p>
                    <button
                        onClick={() => router.push('/my-orders')}
                        className='w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold py-3 rounded-lg hover:shadow-lg transition-all duration-300'
                    >
                        View All Orders
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className='min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-12'>
            <div className='max-w-3xl mx-auto px-4'>
                {/* Header */}
                <div className='text-center mb-12'>
                    <ShoppingBag className='w-16 h-16 mx-auto text-blue-600 mb-4' />
                    <h1 className='text-4xl font-bold text-slate-900 dark:text-white mb-2'>Review Your Order</h1>
                    <p className='text-slate-600 dark:text-slate-400'>Please review your items and confirm delivery details before placing the order</p>
                </div>

                {/* Order Items */}
                <div className='bg-white dark:bg-slate-800 rounded-3xl shadow-lg dark:shadow-slate-900/50 p-8 mb-8'>
                    <h2 className='text-2xl font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2'>
                        <ShoppingBag className='w-6 h-6 text-blue-600' />
                        Order Items
                    </h2>

                    {productData ? (
                        <div className='space-y-4 mb-6'>
                            <div className='flex items-center gap-4 pb-4 border-b border-slate-200 dark:border-slate-700'>
                                <div className='w-24 h-24 bg-gradient-to-br from-slate-200 dark:from-slate-700 to-slate-300 dark:to-slate-600 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center'>
                                    {productData.image ? (
                                        <Image
                                            src={productData.image}
                                            alt={productData.name}
                                            width={96}
                                            height={96}
                                            className='w-full h-full object-cover'
                                        />
                                    ) : (
                                        <ShoppingBag className='w-10 h-10 text-slate-400' />
                                    )}
                                </div>
                                <div className='flex-1'>
                                    <h3 className='font-bold text-lg text-slate-800 dark:text-white'>{productData.name}</h3>
                                    <p className='text-sm text-slate-600 dark:text-slate-400 mt-1'>Quantity: {productData.quantity}</p>
                                    <p className='text-lg font-bold text-blue-600 mt-2'>
                                        {currency}{(productData.price * productData.quantity).toFixed(2)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : !cartItems || cartItems.length === 0 ? (
                        <div className='text-center py-12'>
                            <p className='text-slate-600 dark:text-slate-400 mb-4'>Your cart is empty</p>
                            <button
                                onClick={() => router.push('/shop')}
                                className='bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-all'
                            >
                                Continue Shopping
                            </button>
                        </div>
                    ) : (
                        <div className='space-y-4 mb-6'>
                            {cartItems.map(item => (
                                <div key={item.id || item.productId} className='flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-700'>
                                    <div className='flex-1'>
                                        <h3 className='font-semibold text-slate-800 dark:text-white'>{item.name || 'Product'}</h3>
                                        <p className='text-sm text-slate-600 dark:text-slate-400'>Quantity: {item.quantity || 1}</p>
                                    </div>
                                    <div className='text-right'>
                                        <p className='font-bold text-slate-900 dark:text-white'>{currency}{((item.price || 0) * (item.quantity || 1)).toFixed(2)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Coupon Section */}
                    <div className='bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-700 rounded-xl p-4 mb-6'>
                        {!appliedCoupon ? (
                            <div className='space-y-3'>
                                <label className='block text-sm font-bold text-slate-700 dark:text-slate-300'>Have a coupon?</label>
                                <div className='flex gap-2'>
                                    <input
                                        type='text'
                                        value={couponCode}
                                        onChange={(e) => {
                                            setCouponCode(e.target.value.toUpperCase())
                                            setCouponError('')
                                        }}
                                        placeholder='Enter coupon code (e.g., NEW20, FLASH30)'
                                        className='flex-1 px-4 py-2 border-2 border-blue-300 dark:border-blue-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 rounded-lg focus:outline-none focus:border-blue-600'
                                    />
                                    <button
                                        onClick={handleApplyCoupon}
                                        className='px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-all text-sm'
                                    >
                                        Apply
                                    </button>
                                </div>
                                {couponError && !appliedCoupon && (
                                    <p className='text-red-600 dark:text-red-400 text-xs flex items-center gap-1'>
                                        <AlertCircle size={14} /> {couponError}
                                    </p>
                                )}
                            </div>
                        ) : (
                            <div className='flex items-center justify-between'>
                                <div>
                                    <p className='text-sm font-bold text-slate-700 dark:text-slate-300'>Coupon Applied</p>
                                    <p className='text-lg font-bold text-green-600'>{appliedCoupon.code}</p>
                                </div>
                                <button
                                    onClick={handleRemoveCoupon}
                                    className='px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all text-sm font-bold'
                                >
                                    Remove
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Crash Cash Section */}
                    {getTotalCrashCashAvailable() > 0 && (
                        <div className='bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-300 dark:border-amber-700 rounded-xl p-4 mb-6'>
                            {!useCrashCash ? (
                                <div className='space-y-3'>
                                    <div className='flex items-center justify-between'>
                                        <div>
                                            <div className='flex items-center gap-2 mb-1'>
                                                <img src="/crashcash.ico" alt="Crash Cash" className="w-4 h-4" />
                                                <label className='text-sm font-bold text-amber-900 dark:text-amber-300'>Use Crash Cash</label>
                                            </div>
                                            <p className='text-xs text-amber-800 dark:text-amber-400 mt-1'>Available: {currency}{getTotalCrashCashAvailable()}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleApplyCrashCash}
                                        className='w-full px-6 py-2 bg-amber-600 text-white font-bold rounded-lg hover:bg-amber-700 transition-all text-sm'
                                    >
                                        Apply Crash Cash
                                    </button>
                                </div>
                            ) : (
                                <div className='flex items-center justify-between'>
                                    <div>
                                        <div className='flex items-center gap-2 mb-1'>
                                            <img src="/crashcash.ico" alt="Crash Cash" className="w-4 h-4" />
                                            <p className='text-sm font-bold text-amber-900 dark:text-amber-300'>Crash Cash Applied</p>
                                        </div>
                                        <p className='text-lg font-bold text-amber-700 dark:text-amber-400'>{currency}{appliedCrashCash}</p>
                                        <p className='text-xs text-amber-800 dark:text-amber-400 mt-1'>Remaining: {currency}{getTotalCrashCashAvailable() - appliedCrashCash}</p>
                                    </div>
                                    <button
                                        onClick={handleRemoveCrashCash}
                                        className='px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all text-sm font-bold'
                                    >
                                        Remove
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Price Summary */}
                    <div className='space-y-3'>
                        <div className='flex justify-between text-slate-700 dark:text-slate-300'>
                            <span>Subtotal:</span>
                            <span className='font-semibold'>{currency}{calculateTotal().toFixed(2)}</span>
                        </div>
                        {appliedCoupon && (
                            <div className='flex justify-between text-green-600'>
                                <span>Discount ({appliedCoupon.type === 'percentage' ? appliedCoupon.discount + '%' : 'Flat'}):</span>
                                <span className='font-semibold'>-{currency}{appliedCoupon.discount.toFixed(2)}</span>
                            </div>
                        )}
                        {useCrashCash && appliedCrashCash > 0 && (
                            <div className='flex justify-between text-amber-600'>
                                <div className='flex items-center gap-2'>
                                    <img src="/crashcash.ico" alt="Crash Cash" className="w-4 h-4" />
                                    <span>Crash Cash Discount:</span>
                                </div>
                                <span className='font-semibold'>-{currency}{appliedCrashCash.toFixed(2)}</span>
                            </div>
                        )}
                        <div className='border-t-2 border-slate-200 dark:border-slate-700 pt-3 flex justify-between items-center'>
                            <span className='text-xl font-bold text-slate-800 dark:text-white'>Total Amount:</span>
                            <span className='text-3xl font-bold text-blue-600'>{currency}{getTotalAfterDiscount().toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                {/* Delivery Address */}
                <div className='bg-white dark:bg-slate-800 rounded-3xl shadow-lg dark:shadow-slate-900/50 p-8 mb-8'>
                    <h2 className='text-2xl font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2'>
                        <Truck className='w-6 h-6 text-emerald-600' />
                        Delivery Address
                    </h2>

                    {selectedAddress ? (
                        <div className='space-y-4'>
                            <div className='bg-gradient-to-br from-emerald-50 dark:from-emerald-900/20 to-cyan-50 dark:to-cyan-900/20 border-2 border-emerald-200 dark:border-emerald-700 rounded-2xl p-6'>
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
                                <div className='space-y-3'>
                                    <div className='flex items-start gap-3'>
                                        <div className='font-bold text-lg text-emerald-600 bg-white dark:bg-slate-700 rounded-full w-8 h-8 flex items-center justify-center'>👤</div>
                                        <div>
                                            <p className='text-xs text-slate-600 dark:text-slate-400'>Name</p>
                                            <p className='font-bold text-slate-800 dark:text-white'>{selectedAddress.name}</p>
                                        </div>
                                    </div>
                                    <div className='flex items-start gap-3'>
                                        <Mail className='w-5 h-5 text-emerald-600 mt-1 flex-shrink-0' />
                                        <div>
                                            <p className='text-xs text-slate-600 dark:text-slate-400'>Email</p>
                                            <p className='font-semibold text-slate-800 dark:text-white'>{selectedAddress.email}</p>
                                        </div>
                                    </div>
                                    <div className='flex items-start gap-3'>
                                        <Phone className='w-5 h-5 text-emerald-600 mt-1 flex-shrink-0' />
                                        <div>
                                            <p className='text-xs text-slate-600 dark:text-slate-400'>Phone</p>
                                            <p className='font-semibold text-slate-800 dark:text-white'>{selectedAddress.phone}</p>
                                        </div>
                                    </div>
                                    <div className='flex items-start gap-3'>
                                        <MapPin className='w-5 h-5 text-emerald-600 mt-1 flex-shrink-0' />
                                        <div>
                                            <p className='text-xs text-slate-600 dark:text-slate-400'>Address</p>
                                            <p className='font-semibold text-slate-800 dark:text-white'>{selectedAddress.street}</p>
                                            <p className='text-sm text-slate-600 dark:text-slate-400'>{selectedAddress.city}, {selectedAddress.state} {selectedAddress.zipCode}, {selectedAddress.country}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Address Selection and Actions */}
                            <div className='flex flex-col sm:flex-row gap-3'>
                                {addresses.length > 1 && (
                                    <select
                                        value={selectedAddressId}
                                        onChange={(e) => setSelectedAddressId(e.target.value)}
                                        className='flex-1 px-4 py-3 border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white rounded-lg focus:outline-none focus:border-blue-600 font-semibold'
                                    >
                                        {addresses.map(addr => (
                                            <option key={addr.id} value={addr.id}>
                                                {addr.name} - {addr.city}
                                            </option>
                                        ))}
                                    </select>
                                )}
                                <button
                                    onClick={() => setShowAddressForm(true)}
                                    className='flex items-center justify-center gap-2 px-6 py-3 border-2 border-blue-600 text-blue-600 dark:text-blue-400 font-bold rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all'
                                >
                                    <Plus size={20} />
                                    New Address
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className='text-center py-12'>
                            <MapPin className='w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto mb-4' />
                            <p className='text-slate-600 dark:text-slate-400 mb-4'>No address added yet</p>
                            <button
                                onClick={() => setShowAddressForm(true)}
                                className='px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-bold'
                            >
                                Add Address
                            </button>
                        </div>
                    )}
                </div>

                {/* Payment Method */}
                <div className='bg-white dark:bg-slate-800 rounded-3xl shadow-lg dark:shadow-slate-900/50 p-8 mb-8'>
                    <h2 className='text-2xl font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2'>
                        <CreditCard className='w-6 h-6 text-blue-600' />
                        Payment Method
                    </h2>

                    <div className='space-y-3 mb-6'>
                        <label className='flex items-center gap-3 p-4 border-2 border-slate-300 dark:border-slate-600 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-all dark:bg-slate-800'>
                            <input type="radio" value="COD" checked={paymentMethod === 'COD'} onChange={(e) => setPaymentMethod(e.target.value)} className='w-4 h-4' />
                            <span className='font-semibold text-slate-800 dark:text-white'>Cash on Delivery (COD)</span>
                        </label>
                        <label className='flex items-center gap-3 p-4 border-2 border-slate-300 dark:border-slate-600 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-all dark:bg-slate-800'>
                            <input type="radio" value="UPI" checked={paymentMethod === 'UPI'} onChange={(e) => setPaymentMethod(e.target.value)} className='w-4 h-4' />
                            <span className='font-semibold text-slate-800 dark:text-white'>UPI Payment</span>
                        </label>
                        <label className='flex items-center gap-3 p-4 border-2 border-slate-300 dark:border-slate-600 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-all dark:bg-slate-800'>
                            <input type="radio" value="WALLET" checked={paymentMethod === 'WALLET'} onChange={(e) => setPaymentMethod(e.target.value)} className='w-4 h-4' />
                            <span className='font-semibold text-slate-800 dark:text-white'>Digital Wallet</span>
                        </label>
                    </div>

                    {paymentMethod === 'UPI' && (
                        <div className='bg-slate-50 dark:bg-slate-700 rounded-lg p-6'>
                            <input
                                type="text"
                                placeholder='UPI ID (example@upi)'
                                className='w-full px-4 py-2 border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 rounded-lg focus:outline-none focus:border-blue-600'
                            />
                        </div>
                    )}

                    {paymentMethod === 'WALLET' && (
                        <div className='bg-slate-50 dark:bg-slate-700 rounded-lg p-6'>
                            <select className='w-full px-4 py-2 border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-white rounded-lg focus:outline-none focus:border-blue-600 font-semibold'>
                                <option>Select Wallet</option>
                                <option>Google Pay</option>
                                <option>PhonePe</option>
                                <option>Paytm</option>
                            </select>
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                 <div className='grid grid-cols-2 gap-4 mb-8'>
                     <button
                         onClick={() => router.back()}
                         className='bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white font-bold py-3 px-6 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-all duration-300 active:scale-95'
                     >
                         Back
                     </button>
                     <button
                         onClick={handlePlaceOrder}
                         disabled={isProcessing || !selectedAddressId}
                         className={`font-bold py-3 px-6 rounded-lg transition-all duration-300 active:scale-95 ${
                             isProcessing || !selectedAddressId
                                 ? 'bg-gray-400 text-white cursor-not-allowed'
                                 : 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:shadow-lg cursor-pointer'
                         }`}
                     >
                         {isProcessing ? 'Processing...' : 'Place Order'}
                     </button>
                 </div>

                {/* Info */}
                <div className='bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-700 rounded-2xl p-6'>
                    <div className='flex gap-3'>
                        <CheckCircle2 className='w-6 h-6 text-blue-600 flex-shrink-0' />
                        <div>
                            <h3 className='font-bold text-slate-900 dark:text-white mb-2'>Order Confirmation</h3>
                            <p className='text-slate-700 dark:text-slate-300 text-sm'>
                                Once you place this order, you'll receive a confirmation with your order ID and tracking details. You can track your order anytime from the "My Orders" section.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Address Form Modal */}
             {showAddressForm && (
                 <AddressForm
                     onSave={handleAddAddress}
                     onClose={() => setShowAddressForm(false)}
                 />
             )}
            </div>
            )
            }

            export default function PlaceOrder() {
            return (
            <Suspense fallback={<div className="p-8">Loading...</div>}>
            <PlaceOrderContent />
            </Suspense>
            )
            }
