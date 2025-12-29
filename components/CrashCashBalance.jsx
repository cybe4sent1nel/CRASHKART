'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, Gift, Calendar, ShoppingCart, Clock, CheckCircle, AlertCircle } from 'lucide-react'
import { removeDuplicateRewards } from '@/lib/fixCrashcashBalance'
import { updateCrashCashBalance } from '@/lib/crashcashStorage'

export default function CrashCashBalance() {
    const [balance, setBalance] = useState(0)
    const [scratchRewards, setScratchRewards] = useState([])
    const [orderRewards, setOrderRewards] = useState([])
    const [lastWin, setLastWin] = useState(null)
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        const loadData = () => {
            // Remove any duplicate rewards (this will recalculate balance correctly)
            removeDuplicateRewards()
            
            // Use unified balance calculation from crashcashStorage
            const calculatedBalance = updateCrashCashBalance()
            setBalance(calculatedBalance)
            console.log('💰 CrashCash page loaded balance:', calculatedBalance)
            
            // Get scratch card rewards
            const saved = JSON.parse(localStorage.getItem('scratchCardRewards') || '[]')
            const scratchRewardsOnly = saved.filter(r => r.type === 'reward') || []
            setScratchRewards(scratchRewardsOnly)

            // Get order rewards
            const orders = JSON.parse(localStorage.getItem('orderCrashCashRewards') || '[]')
            setOrderRewards(orders || [])

            // Get last win info
            const lastWinInfo = JSON.parse(localStorage.getItem('lastCrashcashWin') || 'null')
            setLastWin(lastWinInfo)
        }

        loadData()
        setMounted(true)

        // Listen for storage changes
        const handleStorageChange = () => {
            loadData()
        }

        window.addEventListener('storage', handleStorageChange)
        window.addEventListener('crashcash-update', handleStorageChange)
        const interval = setInterval(loadData, 500)

        return () => {
            window.removeEventListener('storage', handleStorageChange)
            window.removeEventListener('crashcash-update', handleStorageChange)
            clearInterval(interval)
        }
    }, [])

    if (!mounted) {
        return (
            <div className="w-full max-w-4xl mx-auto px-4 py-6">
                <div className="bg-gradient-to-br from-amber-100 to-yellow-100 rounded-2xl p-6 animate-pulse">
                    <div className="h-12 bg-amber-400 rounded w-32"></div>
                </div>
            </div>
        )
    }

    const allRewards = [...scratchRewards, ...orderRewards].sort((a, b) => {
        const dateA = new Date(a.scratchedAt || a.awardedAt || 0)
        const dateB = new Date(b.scratchedAt || b.awardedAt || 0)
        return dateB - dateA
    })

    return (
        <div className="w-full max-w-4xl mx-auto px-4 py-6 space-y-6">
            {/* Main Balance Card */}
            <div className="bg-gradient-to-br from-amber-100 to-yellow-100 rounded-2xl p-8 shadow-lg">
                <div className="flex items-center gap-4">
                    <div className="bg-gradient-to-br from-amber-400 to-yellow-500 rounded-full p-4">
                        <img src="/crashcash.ico" alt="CrashCash" className="w-12 h-12" />
                    </div>
                    <div>
                        <p className="text-sm text-slate-600 font-semibold">Your CrashCash Balance</p>
                        <p className="text-4xl font-bold text-slate-900">₹{balance}</p>
                    </div>
                </div>
            </div>

            {/* Last Win Info */}
            {lastWin && (
                <div className="bg-gradient-to-br from-green-100 to-emerald-100 rounded-2xl p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <TrendingUp size={20} className="text-green-600" />
                        <h3 className="font-bold text-slate-900 text-lg">Last Win</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white/50 rounded-lg p-4">
                            <p className="text-xs text-slate-600 mb-1 font-semibold">Amount Won</p>
                            <p className="text-2xl font-bold text-green-600">₹{lastWin.amount}</p>
                        </div>
                        {lastWin.discount && (
                            <div className="bg-white/50 rounded-lg p-4">
                                <p className="text-xs text-slate-600 mb-1 font-semibold">Discount Offer</p>
                                <p className="text-2xl font-bold text-green-600">{lastWin.discount}% OFF</p>
                            </div>
                        )}
                        {lastWin.code && (
                            <div className="bg-white/50 rounded-lg p-4 md:col-span-2">
                                <p className="text-xs text-slate-600 mb-1 font-semibold">Coupon Code</p>
                                <p className="font-mono font-bold text-sm bg-white p-2 rounded">{lastWin.code}</p>
                            </div>
                        )}
                        <div className="bg-white/50 rounded-lg p-4 md:col-span-2">
                            <p className="text-xs text-slate-600 mb-1 font-semibold">Won On</p>
                            <p className="text-sm text-slate-900">{lastWin.date}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Scratch Card Rewards */}
            {scratchRewards.length > 0 && (
                <div className="bg-white rounded-2xl p-6 shadow-md border border-slate-200">
                    <div className="flex items-center gap-2 mb-4">
                        <Gift size={20} className="text-purple-600" />
                        <h3 className="text-xl font-bold text-slate-900">Scratch Card Rewards ({scratchRewards.length})</h3>
                    </div>
                    <div className="space-y-3">
                        {scratchRewards.map((reward) => (
                            <div key={reward.id} className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border-l-4 border-purple-500">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex-1">
                                        <p className="font-semibold text-slate-900">
                                            {reward.rewardType === 'crashcash' 
                                                ? `₹${reward.crashcash} CrashCash Won` 
                                                : `${reward.discount}% Discount + ₹${reward.crashcash || 0} Bonus`}
                                        </p>
                                        <p className="text-xs text-slate-600 flex items-center gap-1 mt-1">
                                            <Calendar size={14} />
                                            {reward.scratchedAt}
                                        </p>
                                    </div>
                                </div>
                                {reward.code && (
                                    <div className="bg-white rounded p-2 mb-2">
                                        <p className="text-xs text-slate-600 mb-1">Coupon Code</p>
                                        <p className="font-mono font-bold text-sm">{reward.code}</p>
                                    </div>
                                )}
                                {reward.expiryDate && (
                                    <p className="text-xs flex items-center gap-1 mt-2">
                                        {new Date(reward.expiryDate) < new Date() ? (
                                            <>
                                                <AlertCircle size={14} className="text-red-600" />
                                                <span className="text-red-600 font-semibold">Expired</span>
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle size={14} className="text-green-600" />
                                                <span className="text-green-600 font-semibold">Valid till {new Date(reward.expiryDate).toLocaleDateString()}</span>
                                            </>
                                        )}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Order Rewards */}
            {orderRewards.length > 0 && (
                <div className="bg-white rounded-2xl p-6 shadow-md border border-slate-200">
                    <div className="flex items-center gap-2 mb-4">
                        <ShoppingCart size={20} className="text-blue-600" />
                        <h3 className="text-xl font-bold text-slate-900">Order Rewards ({orderRewards.length})</h3>
                    </div>
                    <div className="space-y-3">
                        {orderRewards.map((reward, idx) => (
                            <div key={idx} className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-4 border-l-4 border-blue-500">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex-1">
                                        <p className="font-semibold text-slate-900">
                                            ₹{reward.amount} CrashCash Earned
                                        </p>
                                        <p className="text-xs text-slate-600 mt-1">
                                            Order ID: {reward.orderId}
                                        </p>
                                        <p className="text-xs text-slate-600 flex items-center gap-1 mt-1">
                                            <Clock size={14} />
                                            {reward.awardedAt}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-slate-600">Items</p>
                                        <p className="text-lg font-bold text-blue-600">{reward.itemCount}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Empty State */}
            {allRewards.length === 0 && (
                <div className="bg-slate-100 rounded-2xl p-12 text-center">
                    <Gift size={48} className="mx-auto text-slate-400 mb-3" />
                    <p className="text-slate-600 font-medium text-lg">No rewards yet</p>
                    <p className="text-slate-500 text-sm mt-1">Scratch cards and place orders to earn CrashCash!</p>
                </div>
            )}

            {/* Summary */}
            {allRewards.length > 0 && (
                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
                    <h3 className="font-bold text-slate-900 mb-3">Summary</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white rounded-lg p-3">
                            <p className="text-xs text-slate-600">Total Rewards</p>
                            <p className="text-xl font-bold text-slate-900">{allRewards.length}</p>
                        </div>
                        <div className="bg-white rounded-lg p-3">
                            <p className="text-xs text-slate-600">From Scratch Cards</p>
                            <p className="text-xl font-bold text-purple-600">{scratchRewards.length}</p>
                        </div>
                        <div className="bg-white rounded-lg p-3">
                            <p className="text-xs text-slate-600">From Orders</p>
                            <p className="text-xl font-bold text-blue-600">{orderRewards.length}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
