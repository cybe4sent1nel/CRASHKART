'use client'
import React, { useState } from 'react'
import { Lock, AlertCircle, Loader } from 'lucide-react'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'

export function InternalPaymentWrapper({ orderData }) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    const handlePayment = async () => {
        if (!orderData?.paymentSessionId) {
            const msg = 'Payment session not initialized'
            setError(msg)
            toast.error(msg)
            return
        }

        setLoading(true)
        setError(null)

        try {
            // Extract clean session ID (remove paymentpayment suffix if present)
            let sessionId = orderData.paymentSessionId
            
            console.log('🔍 Original Session ID:', sessionId)
            console.log('  Length:', sessionId.length)
            
            // Remove all "paymentpayment" suffixes
            while (sessionId.includes('paymentpayment')) {
                console.log('⚠️  Found "paymentpayment" - removing...')
                sessionId = sessionId.replace(/paymentpayment$/g, '')
                console.log('  After removal:', sessionId)
                console.log('  New length:', sessionId.length)
            }
            
            // Also trim any whitespace
            sessionId = sessionId.trim()

            console.log('✅ Clean Session ID:', sessionId)
            console.log('  Final length:', sessionId.length)

            // Store order ID for webhook processing
            sessionStorage.setItem('cashfreeOrderId', orderData.orderId)
            
            // Redirect to Cashfree's hosted checkout (same as external method)
            const checkoutUrl = `https://payments-test.cashfree.com/?sessionId=${sessionId}`
            
            console.log('📍 Redirect URL:', checkoutUrl)
            
            window.location.href = checkoutUrl

        } catch (err) {
            console.error('Payment redirect error:', err)
            const msg = err.message || 'Failed to redirect to payment page'
            setError(msg)
            toast.error(msg)
            setLoading(false)
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex gap-3">
                <Lock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                    <p className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-1">
                        Secure Payment via Cashfree
                    </p>
                    <p className="text-xs text-blue-700 dark:text-blue-400">
                        You will be redirected to Cashfree's secure payment gateway to complete your payment. 
                        Supports UPI, Cards, Net Banking, Wallets, and more.
                    </p>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700 dark:text-red-300">
                        {error}
                    </p>
                </div>
            )}

            {/* Payment Amount */}
            <div className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg p-4">
                <div className="flex justify-between mb-2">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Amount to Pay:</span>
                    <span className="font-bold text-lg text-slate-800 dark:text-white">
                        ₹{orderData?.total?.toLocaleString?.()}
                    </span>
                </div>
                {orderData?.discount > 0 && (
                    <div className="flex justify-between text-green-600 dark:text-green-400 text-sm mb-2">
                        <span>Discount Applied:</span>
                        <span>-₹{orderData.discount.toLocaleString()}</span>
                    </div>
                )}
                <div className="border-t border-slate-200 dark:border-slate-600 pt-2 mt-2">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        You will be redirected to Cashfree's secure checkout to choose your preferred payment method.
                    </p>
                </div>
            </div>

            {/* Available Payment Methods */}
            <div className="bg-gradient-to-br from-purple-50 dark:from-purple-900/20 to-pink-50 dark:to-pink-900/20 border border-purple-200 dark:border-purple-700 rounded-lg p-4">
                <p className="text-sm font-semibold text-purple-900 dark:text-purple-300 mb-3">
                    Available Payment Methods:
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs text-purple-800 dark:text-purple-300">
                    <div className="flex items-center gap-2">
                        <span>📱</span>
                        <span>UPI (Google Pay, PhonePe, Paytm)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span>💳</span>
                        <span>Credit/Debit Cards</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span>🏦</span>
                        <span>Net Banking</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span>👛</span>
                        <span>Digital Wallets</span>
                    </div>
                </div>
            </div>

            {/* Pay Button */}
            <button
                onClick={handlePayment}
                disabled={loading || !orderData?.paymentSessionId}
                className="w-full px-6 py-4 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 disabled:from-slate-400 disabled:to-slate-400 text-white font-bold rounded-lg transition shadow-lg hover:shadow-xl disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-95"
            >
                {loading ? (
                    <>
                        <Loader className="w-5 h-5 animate-spin" />
                        Redirecting to Cashfree...
                    </>
                ) : (
                    <>
                        <Lock size={20} />
                        Proceed to Secure Checkout
                    </>
                )}
            </button>

            <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
                Powered by Cashfree | Secure & PCI Compliant
            </p>
        </div>
    )
}

export default InternalPaymentWrapper
