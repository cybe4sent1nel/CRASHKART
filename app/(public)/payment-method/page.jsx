'use client'
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CreditCard, Smartphone, MapPin, ShoppingBag, ChevronLeft, Lock, AlertCircle, Tag } from 'lucide-react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import LottieAnimation from '@/components/LottieAnimation'
import checkoutAnimData from '@/public/animations/pos mastercard.json'
import AnimationBackground from '@/components/AnimationBackground'

export default function PaymentMethod() {
     const router = useRouter()
     const [checkoutData, setCheckoutData] = useState(null)
     const [selectedMethod, setSelectedMethod] = useState(null)
     const [loading, setLoading] = useState(false)

    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '₹'

    useEffect(() => {
        const data = sessionStorage.getItem('checkoutData')
        if (!data) {
            router.push('/checkout')
            return
        }
        const parsed = JSON.parse(data)
        console.log('📋 Payment Method - CheckoutData from sessionStorage:', {
            hasOrderId: !!parsed.orderId,
            hasCashfreeOrderId: !!parsed.cashfreeOrderId,
            hasPaymentSessionId: !!parsed.paymentSessionId,
            hasTotal: !!parsed.total,
            keys: Object.keys(parsed)
        })
        setCheckoutData(parsed)
    }, [router])





    // Helper function to open Cashfree checkout
    const openCashfreeCheckout = (sessionId) => {
        try {
            // ALWAYS use sandbox for testing
            const cashfree = window.Cashfree({
                mode: 'sandbox'
            })
            
            const checkoutOptions = {
                paymentSessionId: sessionId,
                redirectTarget: '_self'
            }
            
            cashfree.checkout(checkoutOptions)
        } catch (err) {
            console.error('Cashfree SDK error:', err)
            toast.error('Failed to open payment checkout: ' + err.message)
            setLoading(false)
        }
    }

    const handlePayment = async () => {
        if (!selectedMethod) {
            toast.error('Please select a payment method')
            return
        }

        setLoading(true)
        try {
            const token = localStorage.getItem('token')
            if (!token) {
                toast.error('Please sign in to place the order')
                router.push('/login')
                return
            }

            // Cash on Delivery - create order directly without Cashfree
            if (selectedMethod === 'cod') {
                const paymentData = {
                    ...checkoutData,
                    paymentMethod: 'cod',
                    timestamp: new Date().toISOString()
                }

                const response = await fetch('/api/orders/create', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(paymentData)
                })

                const result = await response.json()

                if (response.status === 401) {
                    toast.error('Session expired. Please sign in again.')
                    localStorage.removeItem('token')
                    localStorage.removeItem('user')
                    router.push('/login')
                    return
                }

                if (!response.ok) {
                    throw new Error(result.message || 'Order creation failed')
                }

                if (result?.orderId) {
                    console.log('✅ COD Order created:', result)
                    toast.success('Order created successfully!')
                    
                    // Always log CrashCash status
                    console.log('💰 CrashCash earned from order:', result.crashCashEarned || 0)
                    
                    // Dispatch event if CrashCash was earned from order
                    if (result.crashCashEarned && result.crashCashEarned > 0) {
                        console.log(`💰 Dispatching order-completed event with ₹${result.crashCashEarned} CrashCash`)
                        window.dispatchEvent(new CustomEvent('order-completed', { 
                            detail: { 
                                orderId: result.orderId,
                                crashCashEarned: result.crashCashEarned 
                            } 
                        }))
                        window.dispatchEvent(new Event('crashcash-update'))
                        console.log('✅ Events dispatched: order-completed, crashcash-update')
                    } else {
                        console.log('⚠️ No CrashCash earned or CrashCash add failed, events not dispatched')
                    }
                    
                    sessionStorage.removeItem('checkoutData')
                    sessionStorage.removeItem('buyNowData')
                    router.push(`/order-success/${result.orderId}`)
                } else {
                    throw new Error('Invalid response from server')
                }
                return
            }

            // 💳 Card/UPI payment methods - Create Cashfree order NOW (not before!)
            if (selectedMethod === 'cashfree' || selectedMethod === 'card') {
                console.log('💳 User selected Card/UPI payment - Creating Cashfree order NOW...')
                
                // Create Cashfree order ONLY when user confirms Card/UPI payment
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
                    throw new Error(orderData.message || 'Failed to create payment order')
                }

                console.log('✅ Cashfree Order Created:', {
                    orderId: orderData.orderId,
                    cashfreeOrderId: orderData.cashfreeOrderId,
                    paymentSessionId: orderData.paymentSessionId?.substring(0, 30)
                })

                // Update checkout data with Cashfree details
                const updatedCheckoutData = {
                    ...checkoutData,
                    orderId: orderData.orderId,
                    cashfreeOrderId: orderData.cashfreeOrderId,
                    paymentSessionId: orderData.paymentSessionId
                }
                sessionStorage.setItem('checkoutData', JSON.stringify(updatedCheckoutData))
                
                // Use Cashfree JS SDK for checkout
                console.log('🔄 Opening Cashfree checkout with session:', orderData.paymentSessionId?.substring(0, 50))
                toast.success('Opening Cashfree checkout...')
                
                // Store order ID for potential return handling
                sessionStorage.setItem('cashfreeOrderId', orderData.orderId)
                
                // Load Cashfree SDK if not already loaded
                if (!window.Cashfree) {
                    console.log('Loading Cashfree SDK...')
                    const script = document.createElement('script')
                    script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js'
                    script.onload = () => {
                        openCashfreeCheckout(orderData.paymentSessionId)
                    }
                    script.onerror = () => {
                        throw new Error('Failed to load Cashfree SDK')
                    }
                    document.body.appendChild(script)
                } else {
                    openCashfreeCheckout(orderData.paymentSessionId)
                }
                return // Stop here, SDK will handle checkout
            }

        } catch (error) {
            toast.error(error.message || 'Payment processing failed')
            console.error('Payment error:', error)
        } finally {
            setLoading(false)
        }
    }

    if (!checkoutData) return null

    return (
        <>
            {/* Checkout Processing Animation Overlay */}
            {loading && (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                >
                    <motion.div 
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 max-w-md w-full text-center"
                    >
                        <LottieAnimation 
                            animationData={checkoutAnimData}
                            width={200}
                            height={200}
                            loop={true}
                        />
                        <motion.p 
                            className="text-xl font-semibold text-slate-800 dark:text-white mt-6 mb-2"
                            animate={{ opacity: [0.6, 1, 0.6] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                        >
                            {selectedMethod === 'cod' ? 'Processing Order...' : 'Processing Payment...'}
                        </motion.p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                            {selectedMethod === 'cod' 
                                ? 'Creating your Cash on Delivery order' 
                                : 'Redirecting to Cashfree Secure Checkout'}
                        </p>
                    </motion.div>
                </motion.div>
            )}
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-12 relative overflow-hidden">
            <AnimationBackground animationPath={'/Online Payments.json'} opacity={0.08} className="top-0 left-0 h-full w-full" />
            <div className="max-w-4xl mx-auto px-4">
                {/* Header */}
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-red-600 hover:text-red-700 font-semibold mb-6"
                >
                    <ChevronLeft size={20} />
                    Back to Checkout
                </button>

                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">Select Payment Method</h1>
                    <p className="text-slate-600 dark:text-slate-400">Choose how you'd like to pay for your order</p>
                </div>

                <div className="grid grid-cols-1 gap-8">
                    {/* Payment Methods */}
                    <div className="space-y-6">
                        {/* Order Review Summary */}
                        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-lg p-8">
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                                <ShoppingBag className="w-5 h-5 text-blue-600" />
                                Order Items ({checkoutData.items.length})
                            </h2>
                            <div className="space-y-3">
                                {checkoutData.items.map((item, index) => (
                                    <div key={index} className="flex justify-between text-sm">
                                        <span className="text-slate-600 dark:text-slate-400">{item.name} x{item.quantity}</span>
                                        <span className="font-semibold text-slate-800 dark:text-white">{currency}{(item.price * item.quantity).toLocaleString()}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="border-t border-slate-200 dark:border-slate-700 mt-4 pt-4">
                                <div className="flex justify-between">
                                    <span className="text-slate-600 dark:text-slate-400">Subtotal:</span>
                                    <span className="font-semibold text-slate-800 dark:text-white">{currency}{checkoutData.subtotal.toLocaleString()}</span>
                                </div>
                                {checkoutData.discount > 0 && (
                                    <div className="flex justify-between text-green-600">
                                        <span>💰 Coupon Discount:</span>
                                        <span>-{currency}{checkoutData.discount.toLocaleString()}</span>
                                    </div>
                                )}
                                {checkoutData.crashCashApplied > 0 && (
                                    <div className="flex justify-between text-yellow-600">
                                        <span>🎁 CrashCash Applied:</span>
                                        <span>-{currency}{checkoutData.crashCashApplied.toLocaleString()}</span>
                                    </div>
                                )}
                                {checkoutData.appliedCoupon && (
                                    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-2 mt-2">
                                        <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
                                            <Tag className="w-4 h-4" />
                                            <span>Coupon: <strong>{checkoutData.appliedCoupon.code}</strong></span>
                                        </div>
                                    </div>
                                )}
                                <div className="flex justify-between font-bold text-lg mt-2">
                                    <span className="text-slate-800 dark:text-white">Total:</span>
                                    <span className="text-red-600">{currency}{checkoutData.total.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>



                        {/* Online Payment Method - Routes to Cashfree */}
                        <div
                            onClick={() => setSelectedMethod('cashfree')}
                            className={`bg-white dark:bg-slate-800 rounded-3xl shadow-lg p-8 cursor-pointer transition border-2 ${
                                selectedMethod === 'cashfree'
                                    ? 'border-red-500 bg-red-50 dark:bg-red-900/10'
                                    : 'border-transparent hover:border-slate-300 dark:hover:border-slate-600'
                            }`}
                        >
                            <div className="flex items-start justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                        <Smartphone className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-800 dark:text-white">Online Payment</h3>
                                        <p className="text-sm text-slate-600 dark:text-slate-400">UPI, Google Pay, PhonePe, Wallets & More</p>
                                    </div>
                                </div>
                                <input
                                    type="radio"
                                    name="payment"
                                    checked={selectedMethod === 'cashfree'}
                                    onChange={() => setSelectedMethod('cashfree')}
                                    className="w-5 h-5 cursor-pointer"
                                />
                            </div>

                            {selectedMethod === 'cashfree' && checkoutData && (
                                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex gap-3">
                                    <Lock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-1">
                                            Secure Cashfree Checkout
                                        </p>
                                        <p className="text-xs text-blue-700 dark:text-blue-400">
                                            Fast and secure payment options including UPI, digital wallets, and more.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Card Payment Method - Routes to Cashfree */}
                        <div
                            onClick={() => setSelectedMethod('card')}
                            className={`bg-white dark:bg-slate-800 rounded-3xl shadow-lg p-8 cursor-pointer transition border-2 ${
                                selectedMethod === 'card'
                                    ? 'border-red-500 bg-red-50 dark:bg-red-900/10'
                                    : 'border-transparent hover:border-slate-300 dark:hover:border-slate-600'
                            }`}
                        >
                            <div className="flex items-start justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                                        <CreditCard className="w-6 h-6 text-purple-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-800 dark:text-white">Card Payment</h3>
                                        <p className="text-sm text-slate-600 dark:text-slate-400">Credit/Debit Card, Net Banking</p>
                                    </div>
                                </div>
                                <input
                                    type="radio"
                                    name="payment"
                                    checked={selectedMethod === 'card'}
                                    onChange={() => setSelectedMethod('card')}
                                    className="w-5 h-5 cursor-pointer"
                                />
                            </div>

                            {selectedMethod === 'card' && checkoutData && (
                                <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4 flex gap-3">
                                    <Lock className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-semibold text-purple-900 dark:text-purple-300 mb-1">
                                            Secure Card Checkout
                                        </p>
                                        <p className="text-xs text-purple-700 dark:text-purple-400">
                                            Pay safely with your credit/debit card or net banking.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Cash on Delivery */}
                        <div
                            onClick={() => setSelectedMethod('cod')}
                            className={`bg-white dark:bg-slate-800 rounded-3xl shadow-lg p-8 cursor-pointer transition border-2 ${
                                selectedMethod === 'cod'
                                    ? 'border-red-500 bg-red-50 dark:bg-red-900/10'
                                    : 'border-transparent hover:border-slate-300 dark:hover:border-slate-600'
                            }`}
                        >
                            <div className="flex items-start justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                                        <ShoppingBag className="w-6 h-6 text-green-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-800 dark:text-white">Cash on Delivery</h3>
                                        <p className="text-sm text-slate-600 dark:text-slate-400">Pay when you receive your order</p>
                                    </div>
                                </div>
                                <input
                                    type="radio"
                                    name="payment"
                                    checked={selectedMethod === 'cod'}
                                    onChange={() => setSelectedMethod('cod')}
                                    className="w-5 h-5 cursor-pointer"
                                />
                            </div>

                            {selectedMethod === 'cod' && (
                                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex gap-3">
                                    <Lock className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-semibold text-green-900 dark:text-green-300 mb-1">
                                            No Online Payment Needed
                                        </p>
                                        <p className="text-xs text-green-700 dark:text-green-400">
                                            Your order will be created immediately. Pay the amount to the delivery person.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Payment Button */}
                        <button
                            onClick={handlePayment}
                            disabled={loading || !selectedMethod}
                            className="w-full px-6 py-4 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 disabled:from-slate-400 disabled:to-slate-400 text-white font-bold rounded-lg transition shadow-lg hover:shadow-xl disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-95"
                        >
                            {loading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <Lock size={20} />
                                    Complete Payment
                                </>
                            )}
                        </button>
                        </div>
                        </div>
                        </div>
                        </div>
                        </>
                        )
                        }
