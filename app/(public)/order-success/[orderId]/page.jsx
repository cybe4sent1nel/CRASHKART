'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, Package, Truck, MapPin, Mail, Phone, ArrowRight, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'
import ScratchCard from '@/components/ScratchCard'
import SuccessAnimation from '@/components/animations/SuccessAnimation'
import LottieAnimation from '@/components/LottieAnimation'
import toast from 'react-hot-toast'
import successAnimData from '@/public/animations/Sucesso.json'
import { saveCrashCashReward } from '@/lib/crashcashStorage'

export default function OrderSuccess() {
    const router = useRouter()
    const params = useParams()
    const orderId = params?.orderId
    const [order, setOrder] = useState(null)
    const [loading, setLoading] = useState(true)
    const [showScratchCard, setShowScratchCard] = useState(false)
    const [scratchReward, setScratchReward] = useState(null)

    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '₹'

    useEffect(() => {
         if (!orderId) {
             router.push('/checkout')
             return
         }

         const fetchOrderDetails = async () => {
             try {
                 setLoading(true)
                 
                 // Get auth token
                 const token = localStorage.getItem('token')
                 const headers = { 'Content-Type': 'application/json' }
                 if (token) {
                     headers['Authorization'] = `Bearer ${token}`
                 }
                 
                 // Fetch order from API
                 const response = await fetch(`/api/orders/${orderId}`, {
                     method: 'GET',
                     headers
                 })

                 if (response.ok) {
                     const data = await response.json()
                     setOrder(data.order)
                     
                     console.log('💰 Order data received:', {
                         orderId: data.order?.id,
                         crashCashEarned: data.crashCashEarned,
                         total: data.order?.total
                     })
                     
                     // Save CrashCash reward to localStorage with 30-day expiry
                     if (data.crashCashEarned && data.crashCashEarned > 0) {
                         console.log(`💾 Saving ₹${data.crashCashEarned} CrashCash to localStorage`)
                         const saved = saveCrashCashReward(orderId, data.crashCashEarned, 'order')
                         
                         if (saved) {
                             console.log('✅ CrashCash saved successfully to localStorage')
                             toast.success(`₹${data.crashCashEarned} CrashCash added to your account!`, {
                                 icon: '💰',
                                 duration: 4000
                             })
                         } else {
                             console.error('❌ Failed to save CrashCash to localStorage')
                         }
                     } else {
                         console.warn('⚠️ No CrashCash earned data in response')
                     }
                     
                     // Automatically mark order as paid/confirmed when user reaches success page
                     // This replaces webhook dependency - if user sees this page, payment flow completed
                     // For Cashfree: User was redirected here after successful payment
                     // For COD: User selected COD and order was confirmed
                     if (data.order) {
                         const isCOD = data.order.paymentMethod === 'COD' || data.order.paymentMethod === 'cod'
                         
                         // For COD: Don't change anything, order is already correctly set up
                         // For Cashfree: Only update if payment isn't already marked as paid
                         const needsUpdate = !isCOD && (!data.order.isPaid || data.order.status === 'PAYMENT_PENDING')
                         
                         if (needsUpdate) {
                             console.log('🔄 Updating Cashfree payment status - user reached success page after payment')
                             console.log(`   Payment Method: ${data.order.paymentMethod}`)
                             console.log(`   Current Status: ${data.order.status}`)
                             console.log(`   Current isPaid: ${data.order.isPaid}`)
                             
                             try {
                                 const updateResponse = await fetch(`/api/orders/${orderId}/payment-status`, {
                                     method: 'PUT',
                                     headers,
                                     body: JSON.stringify({
                                         isPaid: true, // Mark as paid for Cashfree
                                         status: 'ORDER_PLACED' // Confirmed order status
                                     })
                                 })
                                 
                                 if (updateResponse.ok) {
                                     console.log('✅ Cashfree payment confirmed - Order marked as PAID')
                                     // Refresh order data
                                     const updatedData = await updateResponse.json()
                                     setOrder(updatedData.order)
                                 } else {
                                     console.warn('⚠️ Failed to update payment status:', updateResponse.status)
                                 }
                             } catch (updateError) {
                                 console.error('❌ Failed to update payment status:', updateError)
                             }
                         } else if (isCOD) {
                             console.log('✅ COD order confirmed - No payment status update needed')
                             console.log('   Order will be paid on delivery')
                         } else {
                             console.log('✅ Order already processed and marked as paid')
                         }
                     }
                 } else {
                     // Fallback: try to get from sessionStorage (in case order was just created)
                     const checkoutData = sessionStorage.getItem('checkoutData')
                     if (checkoutData) {
                         const data = JSON.parse(checkoutData)
                         setOrder({
                             id: orderId,
                             items: data.items,
                             subtotal: data.subtotal,
                             discount: data.discount,
                             total: data.total,
                             selectedAddressId: data.selectedAddressId
                         })
                     }
                 }

                 // Calculate CrashCash reward (10% of order total)
                 const reward = order?.total ? Math.floor(order.total * 0.1) : 50
                 setScratchReward(reward)
                 
             } catch (error) {
                 console.error('Error fetching order:', error)
                 toast.error('Could not fetch order details')
             } finally {
                 setLoading(false)
             }
         }

         fetchOrderDetails()
     }, [orderId, router, order?.total])

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-red-200 border-t-red-600 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-600">Loading your order...</p>
                </div>
            </div>
        )
    }

    if (!order && !loading) {
        return (
            <div className="min-h-screen flex items-center justify-center px-4">
                <div className="text-center">
                    <p className="text-slate-600 mb-6">Order not found</p>
                    <Link href="/shop" className="inline-block px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700">
                        Back to Shopping
                    </Link>
                </div>
            </div>
        )
    }

    // Show scratch card instead of confirmation if enabled
    if (showScratchCard) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-12">
                <div className="max-w-2xl mx-auto">
                    <ScratchCard 
                        reward={scratchReward}
                        onReveal={(reward) => {
                            console.log('Scratch card revealed:', reward)
                        }}
                    />
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-cyan-50 dark:from-slate-900 dark:to-slate-800 py-12 px-4">
            <div className="max-w-2xl mx-auto">
                {/* Success Animation - Sucesso.json */}
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-8 flex justify-center"
                >
                    <LottieAnimation 
                        animationData={successAnimData}
                        width={250}
                        height={250}
                        loop={true}
                    />
                </motion.div>

                {/* Success Message */}
                <motion.div
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                    className="text-center mb-8"
                >
                    <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
                        Order Confirmed!
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400 text-lg">
                        Thank you for your purchase
                    </p>
                </motion.div>

                {/* Order Details Card */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8 mb-6"
                >
                    {/* Order ID */}
                    <div className="mb-6 pb-6 border-b border-slate-200 dark:border-slate-700">
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Order ID</p>
                        <p className="font-mono text-xl font-bold text-slate-800 dark:text-white break-all">
                            {order?.id}
                        </p>
                    </div>

                    {/* Order Items */}
                    <div className="mb-6 pb-6 border-b border-slate-200 dark:border-slate-700">
                        <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                            <Package size={20} className="text-blue-600" />
                            Order Items ({order?.items?.length || 0})
                        </h3>
                        <div className="space-y-3">
                            {order?.items?.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                                    <div>
                                        <p className="font-medium text-slate-800 dark:text-white">{item.name}</p>
                                        <p className="text-sm text-slate-600 dark:text-slate-400">Qty: {item.quantity || item.qty}</p>
                                    </div>
                                    <p className="font-bold text-slate-800 dark:text-white">
                                        {currency}{((item.price || item.originalPrice || 0) * (item.quantity || item.qty || 1)).toLocaleString()}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Order Summary */}
                    <div className="mb-6 pb-6 border-b border-slate-200 dark:border-slate-700 space-y-2">
                        <div className="flex justify-between">
                            <span className="text-slate-600 dark:text-slate-400">Subtotal:</span>
                            <span className="font-semibold text-slate-800 dark:text-white">
                                {currency}{(order?.subtotal || 0).toLocaleString()}
                            </span>
                        </div>
                        {order?.discount > 0 && (
                            <div className="flex justify-between text-green-600 dark:text-green-400">
                                <span>Discount:</span>
                                <span className="font-semibold">-{currency}{order.discount.toLocaleString()}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-lg font-bold pt-2">
                            <span className="text-slate-800 dark:text-white">Total:</span>
                            <span className="text-red-600">{currency}{(order?.total || 0).toLocaleString()}</span>
                        </div>
                    </div>

                    {/* CrashCash Earned */}
                    {scratchReward && (
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="mb-6 p-4 bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30 rounded-lg border border-yellow-300 dark:border-yellow-700"
                        >
                            <div className="flex items-center gap-3">
                                <Sparkles className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                                <div>
                                    <p className="text-sm text-yellow-700 dark:text-yellow-300 font-medium">Bonus Earned</p>
                                    <p className="text-lg font-bold text-yellow-800 dark:text-yellow-200">
                                        {currency}{scratchReward} CrashCash Reward
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Tracking Info */}
                    <div className="mb-6 pb-6 border-b border-slate-200 dark:border-slate-700">
                        <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                            <Truck size={20} className="text-emerald-600" />
                            Track Your Order
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                            You can track your order status on the "My Orders" page
                        </p>
                        <Link 
                            href={`/track/${order?.id}`}
                            className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                        >
                            View Tracking Link <ArrowRight size={16} />
                        </Link>
                    </div>

                    {/* Confirmation Email */}
                    <div className="mb-6 pb-6 border-b border-slate-200 dark:border-slate-700">
                        <h3 className="font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
                            <Mail size={20} className="text-blue-600" />
                            Confirmation Email
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                            A confirmation email with order details and tracking information has been sent to your registered email address.
                        </p>
                    </div>

                    {/* Next Steps */}
                    <div>
                        <h3 className="font-bold text-slate-800 dark:text-white mb-3">Next Steps</h3>
                        <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                            <li className="flex gap-2">
                                <CheckCircle size={16} className="text-green-600 flex-shrink-0 mt-0.5" />
                                <span>Your order has been placed successfully</span>
                            </li>
                            <li className="flex gap-2">
                                <CheckCircle size={16} className="text-green-600 flex-shrink-0 mt-0.5" />
                                <span>We'll start processing your order shortly</span>
                            </li>
                            <li className="flex gap-2">
                                <CheckCircle size={16} className="text-green-600 flex-shrink-0 mt-0.5" />
                                <span>You'll receive shipping updates via SMS and email</span>
                            </li>
                        </ul>
                    </div>
                </motion.div>

                {/* Action Buttons */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="flex flex-col gap-3 sm:flex-row"
                >
                    <Link
                        href="/my-orders"
                        className="flex-1 px-6 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold rounded-lg transition text-center"
                    >
                        Go to My Orders
                    </Link>
                    <Link
                        href="/shop"
                        className="flex-1 px-6 py-4 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-white font-bold rounded-lg transition text-center"
                    >
                        Continue Shopping
                    </Link>
                    {scratchReward && (
                        <button
                            onClick={() => setShowScratchCard(true)}
                            className="flex-1 px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold rounded-lg transition flex items-center justify-center gap-2"
                        >
                            <Sparkles size={18} />
                            Reveal Scratch Card
                        </button>
                    )}
                </motion.div>

                {/* Additional Info */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
                >
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                        <span className="font-semibold">Need help?</span> Our support team is available 24/7. Check your email for order confirmation and tracking details.
                    </p>
                </motion.div>
            </div>
        </div>
    )
}
