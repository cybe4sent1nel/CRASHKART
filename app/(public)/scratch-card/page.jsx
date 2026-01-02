"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import ScratchCard from '@/components/ScratchCard'
import { Sparkles } from 'lucide-react'

export default function ScratchCardPage() {
    const [reward, setReward] = useState(0)
    const [orderId, setOrderId] = useState(null)

    useEffect(() => {
        try {
            const last = JSON.parse(localStorage.getItem('lastCrashcashWin') || 'null')
            if (last && last.amount) {
                setReward(last.amount)
            }
            const checkout = JSON.parse(sessionStorage.getItem('checkoutData') || 'null')
            if (checkout?.orderId) setOrderId(checkout.orderId)
        } catch (e) {}
    }, [])

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-cyan-50 dark:from-slate-900 dark:to-slate-800 py-12 px-4">
            <div className="max-w-2xl mx-auto">
                <div className="text-center mb-6">
                    <h1 className="text-3xl font-bold text-slate-900">Your Scratch Card</h1>
                    <p className="text-slate-600 mt-2">Scratch to reveal your bonus reward</p>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6">
                    <ScratchCard reward={reward} onReveal={() => { /* no-op */ }} />
                    <div className="mt-6 flex gap-3">
                        <Link 
                            href="/my-orders" 
                            onClick={() => localStorage.removeItem('currentScratchCardRevealed')}
                            className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg text-center"
                        >
                            My Orders
                        </Link>
                        <Link 
                            href="/shop" 
                            onClick={() => localStorage.removeItem('currentScratchCardRevealed')}
                            className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-700 rounded-lg text-center"
                        >
                            Continue Shopping
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
