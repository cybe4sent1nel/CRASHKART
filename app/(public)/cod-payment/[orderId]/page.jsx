'use client'
import { useRouter, useParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { Lock, ChevronLeft, CreditCard, Smartphone, ShoppingBag } from 'lucide-react'
import LottieAnimation from '@/components/LottieAnimation'
import checkoutAnimData from '@/public/animations/pos mastercard.json'

export default function CODPayment() {
    const router = useRouter()
    const params = useParams()
    const orderId = params.orderId
    const [orderData, setOrderData] = useState(null)
    const [selectedMethod, setSelectedMethod] = useState(null)
    const [loading, setLoading] = useState(false)

    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '₹'

    useEffect(() => {
        // Load order data from sessionStorage
        const codPaymentData = sessionStorage.getItem('codPaymentOrder')
        if (codPaymentData) {
            setOrderData(JSON.parse(codPaymentData))
        }
    }, [])

    const handlePaymentMethodSelect = (method) => {
        if (method === 'online') {
            // Redirect to Cashfree payment
            handleOnlinePayment()
        }
    }

    const handleOnlinePayment = async () => {
        if (!selectedMethod) {
            toast.error('Please select a payment method')
            return
        }

        setLoading(true)
        try {
            // Get the order from database
            const token = localStorage.getItem('token')
            const response = await fetch(`/api/orders/${orderId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            })

            if (!response.ok) {
                throw new Error('Failed to fetch order')
            }

            const orderDetails = await response.json()

            // Ensure items exist
            const orderItems = orderDetails.items || orderDetails.orderItems || []
            if (orderItems.length === 0) {
                toast.error('No items in order')
                setLoading(false)
                return
            }

            // Create Cashfree payment session for this order
            const cashfreeResponse = await fetch('/api/payments/cashfree-order-payment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    orderId: orderId,
                    total: orderDetails.total,
                    items: orderDetails.items,
                    isCODConversion: true
                })
            })

            const cashfreeData = await cashfreeResponse.json()

            if (!cashfreeResponse.ok) {
                throw new Error(cashfreeData.message || 'Failed to initiate payment')
            }

            // Store session ID and open Cashfree
            if (!window.Cashfree) {
                const script = document.createElement('script')
                script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js'
                script.onload = () => {
                    openCashfreeCheckout(cashfreeData.paymentSessionId)
                }
                script.onerror = () => {
                    throw new Error('Failed to load Cashfree SDK')
                }
                document.body.appendChild(script)
            } else {
                openCashfreeCheckout(cashfreeData.paymentSessionId)
            }
        } catch (error) {
            toast.error(error.message || 'Payment initialization failed')
            console.error('Payment error:', error)
        } finally {
            setLoading(false)
        }
    }

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

    if (!orderData) return null

    return (
        <>
            {/* Payment Processing Animation */}
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
                            Processing Payment...
                        </motion.p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                            Redirecting to Cashfree Secure Checkout
                        </p>
                    </motion.div>
                </motion.div>
            )}

            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-12">
                <div className="max-w-2xl mx-auto px-4">
                    {/* Header */}
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-red-600 hover:text-red-700 font-semibold mb-6"
                    >
                        <ChevronLeft size={20} />
                        Back to Order
                    </button>

                    <div className="mb-8">
                        <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">Pay for Order</h1>
                        <p className="text-slate-600 dark:text-slate-400">Complete payment for your Cash on Delivery order</p>
                    </div>

                    <div className="grid grid-cols-1 gap-8">
                        {/* Order Summary */}
                        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-lg p-8">
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                                <ShoppingBag className="w-5 h-5 text-blue-600" />
                                Order Summary
                            </h2>
                            <div className="space-y-3">
                                {orderData.items?.map((item, index) => (
                                    <div key={index} className="flex justify-between text-sm">
                                        <span className="text-slate-600 dark:text-slate-400">{item.name} x{item.qty || item.quantity}</span>
                                        <span className="font-semibold text-slate-800 dark:text-white">{currency}{(item.price * (item.qty || item.quantity)).toLocaleString()}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="border-t border-slate-200 dark:border-slate-700 mt-4 pt-4">
                                <div className="flex justify-between font-bold text-lg">
                                    <span className="text-slate-800 dark:text-white">Total Amount:</span>
                                    <span className="text-red-600">{currency}{orderData.total.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>

                        {/* Payment Methods */}
                        <div className="space-y-4">
                            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">Select Payment Method</h2>

                            {/* Online Payment Option */}
                            <div
                                onClick={() => {
                                    setSelectedMethod('online')
                                    handlePaymentMethodSelect('online')
                                }}
                                className={`bg-white dark:bg-slate-800 rounded-3xl shadow-lg p-8 cursor-pointer transition border-2 ${
                                    selectedMethod === 'online'
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
                                            <p className="text-sm text-slate-600 dark:text-slate-400">Pay via UPI, Cards, Wallets & More</p>
                                        </div>
                                    </div>
                                    <input
                                        type="radio"
                                        name="payment"
                                        checked={selectedMethod === 'online'}
                                        onChange={() => setSelectedMethod('online')}
                                        className="w-5 h-5 cursor-pointer"
                                    />
                                </div>

                                {selectedMethod === 'online' && (
                                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex gap-3">
                                        <Lock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-1">
                                                Secure Cashfree Checkout
                                            </p>
                                            <p className="text-xs text-blue-700 dark:text-blue-400">
                                                Your payment will be processed securely via Cashfree.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* COD Info Card */}
                            <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800 rounded-3xl p-8">
                                <h3 className="text-lg font-bold text-green-900 dark:text-green-300 mb-2">You can also pay at delivery</h3>
                                <p className="text-sm text-green-700 dark:text-green-400">
                                    Skip online payment and pay the amount to the delivery person when your order arrives. This option is always available.
                                </p>
                            </div>
                        </div>

                        {/* Pay Now Button */}
                        <button
                            onClick={handleOnlinePayment}
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
                                    Pay {currency}{orderData.total.toLocaleString()} Now
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </>
    )
}
