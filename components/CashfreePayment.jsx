'use client'
import React, { useState, useEffect } from 'react'
import AnimationBackground from './AnimationBackground'
import { useRouter } from 'next/navigation'
import { Lock, AlertCircle, Loader } from 'lucide-react'
import toast from 'react-hot-toast'

export function CashfreePaymentWrapper({ onSuccess, checkoutData, isLoading: externalLoading }) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const router = useRouter()

    const handleInitiatePayment = async () => {
        if (!checkoutData) {
            toast.error('Checkout data is missing')
            return
        }

        setLoading(true)
        setError(null)

        try {
            // Get token from localStorage
            const token = localStorage.getItem('token')
            console.log('🔍 Payment Component Debug:')
            console.log('  Token in localStorage:', token ? `Yes (${token.length} chars)` : 'No')
            
            // Create order on Cashfree
            const headers = { 'Content-Type': 'application/json' }
            if (token) {
                headers['Authorization'] = `Bearer ${token}`
                console.log('  Authorization header set: Yes')
            } else {
                console.log('  Authorization header set: No - Token missing!')
            }
            
            const response = await fetch('/api/payments/cashfree-order', {
                method: 'POST',
                headers,
                body: JSON.stringify(checkoutData)
            })

            const result = await response.json()

            if (!response.ok) {
                throw new Error(result.message || 'Failed to create payment order')
            }

            if (result.paymentLink) {
                // Store the order ID for later use
                sessionStorage.setItem('cashfreeOrderId', result.orderId)
                
                // Redirect to Cashfree payment gateway
                window.location.href = result.paymentLink
            } else {
                throw new Error('No payment link received from Cashfree')
            }

        } catch (err) {
            console.error('Payment initiation error:', err)
            let errorMessage = err.message || 'Failed to initiate payment'
            
            // Provide better error messages
            if (errorMessage.includes('Unauthorized') || errorMessage.includes('401')) {
                errorMessage = 'Please log in to continue with payment'
                setTimeout(() => router.push('/login'), 2000)
            } else if (errorMessage.includes('not configured')) {
                errorMessage = 'Payment gateway is not configured. Please contact support.'
            }
            
            setError(errorMessage)
            toast.error(errorMessage)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="relative">
            <AnimationBackground animationPath={'/Online Payments.json'} opacity={0.06} />
            <div className="space-y-6 relative z-10">
            {/* Payment Info */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex gap-3">
                <Lock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                    <p className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-1">
                        Secure Payment via Cashfree
                    </p>
                    <p className="text-xs text-blue-700 dark:text-blue-400">
                        You will be redirected to Cashfree's secure payment gateway to complete your payment. 
                        Supports UPI, Cards, Net Banking, and more.
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

            {/* Payment Details */}
            <div className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg p-4">
                <div className="flex justify-between mb-2">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Amount to Pay:</span>
                    <span className="font-bold text-slate-800 dark:text-white">
                        ₹{checkoutData?.total?.toLocaleString?.()}
                    </span>
                </div>
                {checkoutData?.discount > 0 && (
                    <div className="flex justify-between text-green-600 dark:text-green-400 text-sm mb-2">
                        <span>Discount Applied:</span>
                        <span>-₹{checkoutData.discount.toLocaleString()}</span>
                    </div>
                )}
                <div className="border-t border-slate-200 dark:border-slate-600 pt-2 mt-2">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        You will be redirected to Cashfree checkout where you can choose your preferred payment method.
                    </p>
                </div>
            </div>

            {/* Pay Button */}
            <button
                onClick={handleInitiatePayment}
                disabled={loading}
                className="w-full px-6 py-4 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 disabled:from-slate-400 disabled:to-slate-400 text-white font-bold rounded-lg transition shadow-lg hover:shadow-xl disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-95"
            >
                {loading ? (
                    <>
                        <Loader className="w-5 h-5 animate-spin" />
                        Initiating Payment...
                    </>
                ) : (
                    <>
                        <Lock size={20} />
                        Proceed to Payment
                    </>
                )}
            </button>

                <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
                    Powered by Cashfree | Secure & PCI Compliant
                </p>
            </div>
        </div>
    )
}

export default CashfreePaymentWrapper
