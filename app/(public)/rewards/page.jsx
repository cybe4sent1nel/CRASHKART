'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Gift, Trash2, Calendar, TrendingUp, Clock, CheckCircle, AlertCircle, Percent, Tag, Copy } from 'lucide-react'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'

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
            // Load discount/coupon rewards from localStorage
            const discountRewards = JSON.parse(localStorage.getItem('discountRewards') || '[]')
            
            // Filter and update status based on expiry
            const now = new Date()
            const updatedRewards = discountRewards.map(reward => {
                if (reward.expiresAt && new Date(reward.expiresAt) < now) {
                    return { ...reward, status: 'expired' }
                }
                return { ...reward, status: reward.status || 'active' }
            })
            
            // Save back updated rewards
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
                    {['all', 'active', 'used'].map(filterOption => (
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
                                    className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition relative overflow-hidden"
                                >
                                    {/* Decorative gradient */}
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl"></div>
                                    
                                    <div className="relative">
                                        {/* Product Image */}
                                        {reward.productImage && (
                                            <div className="w-full h-40 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-slate-700 dark:to-slate-600 rounded-xl mb-4 relative overflow-hidden">
                                                <Image
                                                    src={reward.productImage}
                                                    alt={reward.productName || 'Product'}
                                                    fill
                                                    className="object-contain p-4"
                                                />
                                            </div>
                                        )}

                                        {/* Reward Amount */}
                                        <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl p-4 mb-4 text-center">
                                            <p className="text-sm opacity-90">Reward Earned</p>
                                            <p className="text-3xl font-bold">₹{reward.amount}</p>
                                        </div>

                                        {/* Product Name */}
                                        {reward.productName && (
                                            <h3 className="font-semibold text-slate-800 dark:text-white mb-2 text-center">
                                                {reward.productName}
                                            </h3>
                                        )}

                                        {/* Status Badge */}
                                        <div className="flex justify-center mb-3">
                                            {getStatusBadge(reward.status)}
                                        </div>

                                        {/* Coupon Code - Show if available */}
                                        {reward.code && (
                                            <div className="mb-3">
                                                <p className="text-xs text-slate-600 dark:text-slate-400 mb-1 text-center">Coupon Code</p>
                                                <div className="flex items-center gap-2 justify-center">
                                                    <code className="bg-white dark:bg-slate-700 px-4 py-2 rounded-lg font-mono font-bold text-lg text-purple-600 dark:text-purple-400 border-2 border-dashed border-purple-300 dark:border-purple-600">
                                                        {reward.code}
                                                    </code>
                                                    <button
                                                        onClick={() => copyCode(reward.code)}
                                                        className="p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition active:scale-95"
                                                        title="Copy code"
                                                    >
                                                        <Tag size={18} />
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {/* Discount Percentage */}
                                        {reward.discount && (
                                            <div className="text-center mb-3">
                                                <span className="inline-flex items-center gap-1 bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2 rounded-full font-bold">
                                                    <Percent size={16} />
                                                    {reward.discount}% OFF
                                                </span>
                                            </div>
                                        )}

                                        {/* Earned Date */}
                                        <div className="text-sm text-slate-500 dark:text-slate-400 text-center flex items-center justify-center gap-2">
                                            <Clock size={14} />
                                            Earned: {reward.earnedAt ? new Date(reward.earnedAt).toLocaleDateString('en-IN', {
                                                day: 'numeric',
                                                month: 'short',
                                                year: 'numeric'
                                            }) : 'N/A'}
                                        </div>

                                        {/* Expiry Date */}
                                        {reward.expiresAt && (
                                            <div className="text-xs text-orange-600 dark:text-orange-400 text-center mt-1 flex items-center justify-center gap-1">
                                                <Calendar size={12} />
                                                Expires: {new Date(reward.expiresAt).toLocaleDateString('en-IN', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    year: 'numeric'
                                                })}
                                            </div>
                                        )}

                                        {/* Used At */}
                                        {reward.usedAt && (
                                            <div className="text-xs text-slate-400 dark:text-slate-500 text-center mt-2">
                                                Used on {new Date(reward.usedAt).toLocaleDateString('en-IN')}
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </div>
    )
}
