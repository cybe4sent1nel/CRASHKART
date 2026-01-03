 'use client'

import { useState, useEffect } from 'react'
// Lottie overlay removed from card; background component will render the animation
import { TrendingUp, Gift, Calendar, ShoppingCart, Clock, CheckCircle, AlertCircle } from 'lucide-react'
import AnimationBackground from './AnimationBackground'
import LottieAnimation from './LottieAnimation'
import { removeDuplicateRewards } from '@/lib/fixCrashcashBalance'
import { updateCrashCashBalance } from '@/lib/crashcashStorage'

export default function CrashCashBalance() {
    const [cashJumpAnim, setCashJumpAnim] = useState(null)
    
    const [balance, setBalance] = useState(0)
    const [scratchRewards, setScratchRewards] = useState([])
    const [orderRewards, setOrderRewards] = useState([])
    const [bonusRewards, setBonusRewards] = useState([])
    const [lastWin, setLastWin] = useState(null)
    const [mounted, setMounted] = useState(() => typeof window !== 'undefined')
    

    useEffect(() => {
        let mounted = true
        let debounceTimer = null

        const loadFromServer = async (immediate = false) => {
            // Debounce to prevent rapid consecutive calls
            if (debounceTimer && !immediate) {
                clearTimeout(debounceTimer)
            }
            
            const execute = async () => {
                try {
                    console.log('🔄 Refreshing CrashCash balance from server...')
                    const user = JSON.parse(localStorage.getItem('user') || '{}')
                    const userId = user.id
                    if (!userId) {
                        console.warn('⚠️ No userId found, skipping balance refresh')
                        return
                    }

                    // Live balance
                    const balResp = await fetch(`/api/crashcash/balance?userId=${userId}`, {
                        credentials: 'include'
                    })
                    if (balResp.ok) {
                        const b = await balResp.json()
                        if (mounted) {
                            console.log('✅ Balance updated:', b.balance)
                            setBalance(b.balance || 0)
                            // Update localStorage user object
                            user.crashCashBalance = b.balance || 0
                            localStorage.setItem('user', JSON.stringify(user))
                        }
                    }

                    // Rewards
                    const rewardsResp = await fetch(`/api/crashcash/rewards?userId=${userId}`, {
                        credentials: 'include'
                    })
                    if (rewardsResp.ok) {
                        const data = await rewardsResp.json()
                        if (mounted) {
                            const active = data.activeRewards || []
                            console.log('✅ Rewards loaded:', active.length, 'active rewards')
                            console.log('[CrashCashBalance] All rewards:', active);
                            console.log('[CrashCashBalance] Sources:', active.map(r => r.source));
                            
                            const scratchFiltered = active.filter(r => r.source === 'scratch_card');
                            const orderFiltered = active.filter(r => r.source === 'order_placed');
                            const bonusFiltered = active.filter(r => r.source === 'welcome_bonus');
                            
                            console.log('[CrashCashBalance] Scratch rewards:', scratchFiltered.length);
                            console.log('[CrashCashBalance] Order rewards:', orderFiltered.length, orderFiltered);
                            console.log('[CrashCashBalance] Bonus rewards:', bonusFiltered.length);
                            
                            setScratchRewards(scratchFiltered)
                            setOrderRewards(orderFiltered)
                            setBonusRewards(bonusFiltered)
                        }
                    }

                    // last win: fall back to localStorage
                    const lastWinInfo = JSON.parse(localStorage.getItem('lastCrashcashWin') || 'null')
                    if (mounted) setLastWin(lastWinInfo)
                } catch (err) {
                    console.warn('❌ Live load failed, falling back to localStorage', err)
                    // Fallback to previous local approach
                    removeDuplicateRewards()
                    const calculatedBalance = updateCrashCashBalance()
                    if (mounted) setBalance(calculatedBalance)
                    const saved = JSON.parse(localStorage.getItem('scratchCardRewards') || '[]')
                    if (mounted) setScratchRewards(saved.filter(r => r.type === 'reward') || [])
                    const orders = JSON.parse(localStorage.getItem('orderCrashCashRewards') || '[]')
                    if (mounted) setOrderRewards(orders || [])
                    const lastWinInfo = JSON.parse(localStorage.getItem('lastCrashcashWin') || 'null')
                    if (mounted) setLastWin(lastWinInfo)
                }
            }
            
            if (immediate) {
                execute()
            } else {
                debounceTimer = setTimeout(execute, 500)
            }
        }

        // Load immediately on mount
        loadFromServer(true)

        const handler = () => {
            console.log('📡 CrashCash event received, refreshing...')
            loadFromServer(false)
        }

        window.addEventListener('storage', handler)
        window.addEventListener('crashcash-update', handler)
        window.addEventListener('crashcash-added', handler)
        window.addEventListener('order-completed', handler)

        return () => {
            mounted = false
            if (debounceTimer) clearTimeout(debounceTimer)
            window.removeEventListener('storage', handler)
            window.removeEventListener('crashcash-update', handler)
            window.removeEventListener('crashcash-added', handler)
            window.removeEventListener('order-completed', handler)
        }
    }, [])

    // Load cash jump animation at runtime to avoid Turbopack HMR issues
    useEffect(() => {
        let mounted = true
        fetch('/animations/cash jump.json')
            .then(res => {
                if (!res.ok) throw new Error('Failed to load cash jump')
                return res.json()
            })
            .then(data => { if (mounted) setCashJumpAnim(data) })
            .catch(err => console.debug('[CrashCashBalance] failed to load cash jump', err))
        return () => { mounted = false }
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

    const allRewards = [...scratchRewards, ...orderRewards, ...bonusRewards].sort((a, b) => {
        const dateA = new Date(a.scratchedAt || a.awardedAt || 0)
        const dateB = new Date(b.scratchedAt || b.awardedAt || 0)
        return dateB - dateA
    })

    return (
        <div className="w-full max-w-4xl mx-auto px-4 py-6 space-y-6 relative">
            {/* Main Balance Card */}
            <div className="relative rounded-2xl p-8 shadow-lg bg-white/60 backdrop-blur-sm border border-white/30 overflow-hidden">
                    {/* Small white card placed inside the balance card (top-right) with animation overlay */}
                    <div className="absolute top-4 right-6 z-20">
                        <div className="w-[260px] h-[260px] bg-white rounded-2xl shadow-lg overflow-hidden pointer-events-none flex items-center justify-center border border-gray-200">
                            {cashJumpAnim ? (
                                <LottieAnimation
                                    animationData={cashJumpAnim}
                                    loop={true}
                                    autoplay={true}
                                    style={{ width: '110%', height: '110%', transform: 'translateY(-6%)' }}
                                />
                            ) : (
                                <div className="text-sm text-slate-500">Animation missing</div>
                            )}
                        </div>
                    </div>
                    <div className="relative z-10">
                <div className="flex items-center gap-4">
                    <div className="bg-gradient-to-br from-amber-400 to-yellow-500 rounded-full p-4">
                        <img src="/crashcash.ico" alt="CrashCash" className="w-12 h-12" />
                    </div>
                    <div>
                        <p className="text-sm text-slate-600 font-semibold">Your CrashCash Balance</p>
                        <p className="text-4xl font-bold text-slate-900">₹{balance}</p>
                    </div>
                </div>
                {/* decorative overlay removed */}
            </div>

            {/* close main balance card */}
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
                <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-md border border-white/20">
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
                <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-md border border-white/20">
                    <div className="flex items-center gap-2 mb-4">
                        <ShoppingCart size={20} className="text-blue-600" />
                        <h3 className="text-xl font-bold text-slate-900">Order Rewards ({orderRewards.length})</h3>
                    </div>
                    <div className="space-y-3">
                        {orderRewards.map((reward) => (
                            <div key={reward.id} className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-4 border-l-4 border-blue-500">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex-1">
                                        <p className="font-semibold text-slate-900">
                                            ₹{reward.amount} CrashCash Earned
                                        </p>
                                        {reward.orderId && (
                                            <p className="text-xs text-slate-600 mt-1">
                                                Order ID: {reward.orderId.substring(0, 8)}...
                                            </p>
                                        )}
                                        <p className="text-xs text-slate-600 flex items-center gap-1 mt-1">
                                            <Clock size={14} />
                                            {new Date(reward.earnedAt).toLocaleDateString('en-US', { 
                                                year: 'numeric', 
                                                month: 'short', 
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </p>
                                        {reward.expiresAt && (
                                            <p className="text-xs text-slate-600 mt-1">
                                                Expires: {new Date(reward.expiresAt).toLocaleDateString()}
                                            </p>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">
                                            {reward.status === 'active' ? 'Active' : reward.status}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Bonus Rewards (welcome, promos) */}
            {bonusRewards.length > 0 && (
                <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-md border border-white/20">
                    <div className="flex items-center gap-2 mb-4">
                        <Gift size={20} className="text-amber-600" />
                        <h3 className="text-xl font-bold text-slate-900">Bonus Rewards ({bonusRewards.length})</h3>
                    </div>
                    <div className="space-y-3">
                        {bonusRewards.map((reward, idx) => (
                            <div key={idx} className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl p-4 border-l-4 border-amber-500">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex-1">
                                        <p className="font-semibold text-slate-900">₹{reward.amount} Bonus CrashCash</p>
                                        <p className="text-xs text-slate-600 mt-1 flex items-center gap-1">
                                            <Clock size={14} />
                                            {reward.earnedAt || reward.createdAt}
                                        </p>
                                    </div>
                                </div>
                                {reward.expiresAt && (
                                    <p className="text-xs text-slate-600">
                                        Expires on {new Date(reward.expiresAt).toLocaleDateString()}
                                    </p>
                                )}
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
