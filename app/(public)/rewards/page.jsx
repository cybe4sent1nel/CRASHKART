'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Gift, Copy, Check, Trash2, Calendar, Target, Coins } from 'lucide-react'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'

export default function RewardsPage() {
    const router = useRouter()
    const [rewards, setRewards] = useState([])
    const [copiedCode, setCopiedCode] = useState(null)

    useEffect(() => {
        const user = localStorage.getItem('user')
        if (!user) {
            router.push('/login')
            return
        }

        // Load rewards from localStorage
        const savedRewards = localStorage.getItem('userRewards')
        if (savedRewards) {
            const parsed = JSON.parse(savedRewards)
            // Keep all rewards (expired and active)
            setRewards(parsed)
        }
    }, [router])

    const copyCode = (code) => {
        navigator.clipboard.writeText(code)
        setCopiedCode(code)
        toast.success('Code copied to clipboard!')
        setTimeout(() => setCopiedCode(null), 2000)
    }

    const deleteReward = (code) => {
        if (confirm('Are you sure you want to delete this reward?')) {
            const updated = rewards.filter(r => r.code !== code)
            setRewards(updated)
            localStorage.setItem('userRewards', JSON.stringify(updated))
            toast.success('Reward deleted')
        }
    }

    const getRewardIcon = (type) => {
        return type === 'discount' ? <Target size={20} className="text-red-500" /> : <Coins size={20} className="text-yellow-500" />
    }

    const isExpired = (expiryDate) => {
        return new Date(expiryDate) < new Date()
    }

    const activeRewards = rewards.filter(r => !isExpired(r.expiryDate))

    if (rewards.length === 0) {
        return (
            <div className="min-h-[70vh] flex items-center justify-center mx-6">
                <div className="text-center max-w-md">
                    <Gift size={80} className="mx-auto text-slate-300 mb-4" />
                    <h1 className="text-3xl font-bold text-slate-800 mb-2">No Rewards Yet</h1>
                    <p className="text-slate-600 mb-8">
                        Place orders to earn scratch cards and exciting rewards!
                    </p>
                    <button
                        onClick={() => router.push('/shop')}
                        className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white rounded-full font-semibold transition"
                    >
                        Start Shopping
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 py-10">
            <div className="max-w-6xl mx-auto px-4">
                {/* Header */}
                <div className="text-center mb-10">
                    <div className="flex items-center justify-center gap-3 mb-2">
                        <img src="/logo.bmp" alt="CrashKart" className="w-12 h-12" />
                        <h1 className="text-4xl font-bold text-slate-800">
                            My Rewards
                        </h1>
                    </div>
                    <p className="text-slate-600">You have {activeRewards.length} active reward{activeRewards.length !== 1 ? 's' : ''}</p>
                </div>

                {/* Rewards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {rewards.map((reward, index) => (
                        <motion.div
                            key={`${reward.code}-${index}`}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className={`relative bg-white rounded-2xl shadow-xl overflow-hidden border-2 transition-all duration-300 ${
                                isExpired(reward.expiryDate)
                                    ? 'border-gray-300 opacity-60'
                                    : 'border-red-100 hover:shadow-2xl hover:scale-105'
                            }`}
                        >
                            {/* Expired Badge */}
                            {isExpired(reward.expiryDate) && (
                                <div className="absolute inset-0 bg-black/5 backdrop-blur-sm flex items-center justify-center z-10">
                                    <div className="bg-red-600 text-white px-6 py-2 rounded-full font-bold text-lg">
                                        EXPIRED
                                    </div>
                                </div>
                            )}

                            {/* Card Header */}
                            <div className={`bg-gradient-to-r p-4 text-white ${
                                isExpired(reward.expiryDate)
                                    ? 'from-gray-400 to-gray-500'
                                    : 'from-red-500 to-orange-500'
                            }`}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="text-3xl">{getRewardIcon(reward.type)}</span>
                                        <div>
                                            <p className="text-xs opacity-90">Reward</p>
                                            <p className="font-bold text-lg">
                                                {reward.type === 'discount' ? `${reward.value}% OFF` : `₹${reward.value}`}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => deleteReward(reward.code)}
                                        className="hover:bg-white/20 p-2 rounded-full transition"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            {/* Card Body */}
                            <div className="p-6">
                                <div className="bg-slate-50 rounded-xl p-4 mb-4 border-2 border-dashed border-slate-200">
                                    <p className="text-xs text-slate-500 mb-1">Coupon Code</p>
                                    <div className="flex items-center justify-between">
                                        <p className="font-mono font-bold text-lg text-slate-800 tracking-wider">
                                            {reward.code}
                                        </p>
                                        <button
                                            onClick={() => copyCode(reward.code)}
                                            className="p-2 hover:bg-slate-200 rounded-lg transition"
                                        >
                                            {copiedCode === reward.code ? (
                                                <Check size={18} className="text-green-600" />
                                            ) : (
                                                <Copy size={18} className="text-slate-600" />
                                            )}
                                        </button>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                    <Calendar size={16} />
                                    <p>Valid till {new Date(reward.expiryDate).toLocaleDateString()}</p>
                                </div>

                                {reward.minOrder && (
                                    <p className="text-xs text-slate-500 mt-2">
                                        Min. order: ₹{reward.minOrder}
                                    </p>
                                )}
                            </div>

                            {/* Use Button */}
                            {!isExpired(reward.expiryDate) && (
                                <div className="px-6 pb-6">
                                    <button
                                        onClick={() => {
                                            copyCode(reward.code)
                                            router.push('/shop')
                                        }}
                                        className="w-full py-3 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white rounded-xl font-semibold transition shadow-lg hover:shadow-xl"
                                    >
                                        Use Now
                                    </button>
                                </div>
                            )}

                            {/* Ribbon for new rewards */}
                            {index === rewards.length - 1 && (
                                <div className="absolute top-4 -right-10 bg-green-500 text-white text-xs font-bold px-10 py-1 rotate-45 shadow-lg">
                                    NEW
                                </div>
                            )}
                        </motion.div>
                    ))}
                </div>

                {/* Info Section */}
                <div className="mt-12 bg-white rounded-2xl shadow-lg p-8 border border-slate-100">
                    <h2 className="text-2xl font-bold text-slate-800 mb-4">How to Earn Rewards?</h2>
                    <div className="grid md:grid-cols-3 gap-6">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Gift size={32} className="text-red-500" />
                            </div>
                            <h3 className="font-semibold text-slate-800 mb-2">Place Orders</h3>
                            <p className="text-sm text-slate-600">Every order gives you a scratch card with exciting rewards</p>
                        </div>
                        <div className="text-center">
                            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Target size={32} className="text-orange-500" />
                            </div>
                            <h3 className="font-semibold text-slate-800 mb-2">Scratch & Win</h3>
                            <p className="text-sm text-slate-600">Reveal your reward by scratching the card</p>
                        </div>
                        <div className="text-center">
                            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Coins size={32} className="text-yellow-500" />
                            </div>
                            <h3 className="font-semibold text-slate-800 mb-2">Save & Use</h3>
                            <p className="text-sm text-slate-600">Use your reward codes on future purchases</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
