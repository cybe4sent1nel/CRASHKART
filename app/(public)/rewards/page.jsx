'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Gift, Trash2, Calendar, TrendingUp, Clock, CheckCircle, AlertCircle, Percent, Tag, Copy } from 'lucide-react'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import RewardCard from '../../../components/RewardCard'

export default function RewardsPage() {
    const router = useRouter()
    const [rewards, setRewards] = useState([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('all') // all, active, expired

    useEffect(() => {
        const user = localStorage.getItem('user')
        if (!user) {
            router.push('/login')
            return
        }
        
        loadRewards()
        
        // Listen for storage updates
        const handleStorageUpdate = () => loadRewards()
        window.addEventListener('storage', handleStorageUpdate)
        return () => window.removeEventListener('storage', handleStorageUpdate)
    }, [router])

    const loadRewards = () => {
        try {
            const discountRewards = JSON.parse(localStorage.getItem('discountRewards') || '[]')
            const scratchRewards = JSON.parse(localStorage.getItem('scratchCardRewards') || '[]')

            const merged = [...discountRewards]
            scratchRewards.forEach(entry => {
                if (!merged.find(r => r.id === entry.id)) {
                    merged.push({
                        id: entry.id,
                        rewardType: entry.rewardType,
                        discount: entry.discount,
                        code: entry.code,
                        amount: entry.crashcash || entry.bonusCrashcash || 0,
                        bonusCrashcash: entry.bonusCrashcash || 0,
                        earnedAt: entry.scratchedAt,
                        scratchedAt: entry.scratchedAt,
                        expiresAt: entry.expiresAt || entry.expiryDate,
                        status: entry.status || 'active'
                    })
                }
            })
            
            const now = new Date()
            const updatedRewards = merged.map(reward => {
                if (reward.expiresAt && new Date(reward.expiresAt) < now) {
                    return { ...reward, status: 'expired' }
                }
                return { ...reward, status: reward.status || 'active' }
            })
            
            localStorage.setItem('discountRewards', JSON.stringify(updatedRewards))
            setRewards(updatedRewards)
        } catch (error) {
            console.error('Error loading rewards:', error)
            toast.error('Error loading rewards')
        } finally {
            setLoading(false)
        }
    }

    const deleteReward = (id) => {
        try {
            const updatedRewards = rewards.filter(r => r.id !== id)
            setRewards(updatedRewards)
            localStorage.setItem('discountRewards', JSON.stringify(updatedRewards))
            toast.success('Reward deleted', { icon: '🗑️' })
        } catch (error) {
            console.error('Error deleting reward:', error)
            toast.error('Failed to delete reward')
        }
    }

    const copyCode = (code) => {
        navigator.clipboard.writeText(code)
        toast.success('Code copied to clipboard!', { icon: '📋' })
    }

    const filteredRewards = rewards.filter(reward => {
        if (filter === 'all') return true
        return reward.status === filter
    })

    const activeCount = rewards.filter(r => r.status === 'active').length
    const expiredCount = rewards.filter(r => r.status === 'expired').length

    const getStatusBadge = (status) => {
        const badges = {
            active: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-300', label: 'Active', icon: CheckCircle },
            expired: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300', label: 'Expired', icon: AlertCircle }
        }
        const badge = badges[status] || badges.active
        const Icon = badge.icon
        
        return (
            <div className={`${badge.bg} ${badge.text} px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1`}>
                <Icon size={14} />
                {badge.label}
            </div>
        )
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600"></div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 py-8 px-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <h1 className="text-4xl font-bold text-slate-800 dark:text-white mb-2 flex items-center gap-3">
                        <Gift className="text-purple-600" size={40} />
                        My CrashCash Rewards
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400">Track all your earned rewards from orders</p>
                </motion.div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1 }}
                        className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-green-100">Total Offers</p>
                            <Gift size={24} />
                        </div>
                        <p className="text-4xl font-bold">{rewards.length}</p>
                        <p className="text-sm text-green-100 mt-2">Coupons won</p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 }}
                        className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl p-6 text-white shadow-lg"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-blue-100">Active Coupons</p>
                            <CheckCircle size={24} />
                        </div>
                        <p className="text-4xl font-bold">{activeCount}</p>
                        <p className="text-sm text-blue-100 mt-2">Ready to use</p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 }}
                        className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl p-6 text-white shadow-lg"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-purple-100">Expired</p>
                            <Clock size={24} />
                        </div>
                        <p className="text-4xl font-bold">{expiredCount}</p>
                        <p className="text-sm text-purple-100 mt-2">Past offers</p>
                    </motion.div>
                </div>

                {/* Filters */}
                <div className="flex gap-3 mb-6 flex-wrap">
                    {['all', 'active', 'expired'].map(filterOption => (
                        <button
                            key={filterOption}
                            onClick={() => setFilter(filterOption)}
                            className={`px-6 py-2 rounded-full font-medium transition ${
                                filter === filterOption
                                    ? 'bg-purple-600 text-white shadow-lg'
                                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-purple-50 dark:hover:bg-slate-700'
                            }`}
                        >
                            {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
                        </button>
                    ))}
                </div>

                {/* Rewards Grid */}
                {filteredRewards.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-20"
                    >
                        <Gift size={80} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                        <h3 className="text-2xl font-bold text-slate-700 dark:text-slate-300 mb-2">No Rewards Yet</h3>
                        <p className="text-slate-500 dark:text-slate-400">Start shopping to earn CrashCash rewards!</p>
                        <button
                            onClick={() => router.push('/')}
                            className="mt-6 px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full font-medium hover:shadow-lg transition"
                        >
                            Start Shopping
                        </button>
                    </motion.div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <AnimatePresence>
                            {filteredRewards.map((reward, index) => (
                                <motion.div
                                    key={reward.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="flex justify-center"
                                >
                                    <RewardCard
                                        item={{
                                            ...reward,
                                            expiryDate: reward.expiresAt || reward.expiryDate,
                                            amount: reward.amount || reward.bonusCrashcash || reward.crashcash || 0,
                                            rewardType: reward.rewardType || (reward.discount ? 'discount' : 'crashcash')
                                        }}
                                        onCopy={() => copyCode(reward.code)}
                                        onDelete={() => deleteReward(reward.id)}
                                        onUse={() => {
                                            if (reward.code) {
                                                copyCode(reward.code)
                                                router.push('/')
                                            }
                                        }}
                                        isExpired={reward.status === 'expired'}
                                        getTimeRemaining={(date) => {
                                            if (!date) return 'No expiry'
                                            const d = new Date(date)
                                            const now = new Date()
                                            if (d < now) return 'Expired'
                                            const diff = d - now
                                            const days = Math.floor(diff / (24 * 60 * 60 * 1000))
                                            return days > 0 ? `${days}d left` : 'Less than a day'
                                        }}
                                    />
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </div>
    )
}
