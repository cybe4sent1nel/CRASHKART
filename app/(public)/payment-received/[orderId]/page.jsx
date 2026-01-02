"use client"

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import LottieAnimation from '@/components/LottieAnimation'
import sentAnimData from '@/public/animations/Message Sent.json'
// scratch card and crashcash are intentionally not used on this page
import toast from 'react-hot-toast'

export default function PaymentReceivedPage() {
    const router = useRouter()
    const params = useParams()
    const orderId = params?.orderId
    const [loading, setLoading] = useState(true)
    const [order, setOrder] = useState(null)

    useEffect(() => {
        if (!orderId) return router.push('/')

        const confirmPayment = async () => {
            try {
                setLoading(true)
                const token = localStorage.getItem('token')
                const headers = { 'Content-Type': 'application/json' }
                if (token) headers['Authorization'] = `Bearer ${token}`

                // Mark order as paid (frontend confirmation) - server will also process webhook
                // Use a dedicated endpoint for the payment-received page so we send a "payment received" email here
                await fetch(`/api/orders/${orderId}/payment-received`, {
                    method: 'PUT',
                    headers,
                    body: JSON.stringify({ isPaid: true, status: 'PAYMENT_RECEIVED' })
                })

                // Fetch order details for display
                const resp = await fetch(`/api/orders/${orderId}`, { headers })
                if (resp.ok) {
                    const data = await resp.json()
                    setOrder(data.order)
                    // Note: do not add CrashCash or show scratch-card on the payment-received page.
                    // CrashCash and order-confirmation flows are handled on the dedicated order-success page.
                }
            } catch (err) {
                console.error('Payment received page error:', err)
                toast.error('Could not confirm payment. Please check your orders page.')
            } finally {
                setLoading(false)
            }
        }

        confirmPayment()
    }, [orderId, router])

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
                <div className="w-16 h-16 border-4 border-red-200 border-t-red-600 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-slate-600">Confirming your payment...</p>
            </div>
        </div>
    )

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-cyan-50 dark:from-slate-900 dark:to-slate-800 py-12">
            <div className="max-w-xl mx-auto text-center">
                <div className="mb-6">
                    <LottieAnimation animationData={sentAnimData} width={300} height={300} loop={true} />
                </div>

                {/* Payment received - no scratch card or CrashCash awarded on this page */}
                <h1 className="text-3xl font-bold text-slate-900 mb-2">Payment Received</h1>
                <p className="text-slate-600 mb-4">Thanks — we've received your payment and are processing your order.</p>

                {order?.id && (
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-6 mb-4">
                        <p className="text-sm text-slate-500">Order ID</p>
                        <p className="font-mono font-bold break-all">{order.id}</p>
                        <p className="mt-2 text-sm text-slate-600">Total: {process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '₹'}{(order.total || 0).toLocaleString()}</p>
                    </div>
                )}

                <div className="flex gap-3 justify-center">
                    <Link href="/my-orders" className="px-6 py-3 bg-blue-600 text-white rounded-lg">Go to My Orders</Link>
                    <Link href="/shop" className="px-6 py-3 bg-slate-100 dark:bg-slate-700 rounded-lg">Continue Shopping</Link>
                </div>
            </div>
        </div>
    )
}
