'use client'
import React, { useState, useEffect } from 'react'
import { Wallet, TrendingUp, Gift, Clock } from 'lucide-react'
import { motion } from 'framer-motion'

export default function CrashCashWallet() {
    const [rewards, setRewards] = useState([])
    const [totalBalance, setTotalBalance] = useState(0)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchRewards()
    }, [])

    const fetchRewards = async () => {
        try {
            const response = await fetch('/api/scratchcard', {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            })

            if (response.ok) {
                const data = await response.json()
                if (data.success && data.rewards) {
                    // Calculate total balance from unused rewards
                    const unused = data.rewards.filter(r => !r.isUsed)
                    const total = unused.reduce((sum, r) => sum + r.rewardValue, 0)
                    
                    setRewards(data.rewards)
                    setTotalBalance(total)
                }
            }
        } catch (error) {
            console.error('Error fetching rewards:', error)
        } finally {
            setLoading(false)
        }
    }

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        })
    }

    const isExpired = (expiryDate) => {
        return new Date(expiryDate) < new Date()
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-600 dark:text-slate-400">Loading CrashCash...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-8">
            {/* Balance Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-orange-500 to-red-600 rounded-3xl p-8 text-white shadow-xl"
            >
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <p className="text-orange-100 mb-2">CrashCash Balance</p>
                        <motion.h2
                            animate={{ scale: [1, 1.05, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="text-5xl font-bold"
                        >
                            ₹{totalBalance}
                        </motion.h2>
                    </div>
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 3, repeat: Infinity }}
                    >
                        <Wallet size={48} />
                    </motion.div>
                </div>

                <div className="bg-white/20 rounded-lg p-4 backdrop-blur">
                    <p className="text-sm text-orange-100">
                        💡 Earn 5% CrashCash on every purchase and unlock special rewards with scratch cards!
                    </p>
                </div>
            </motion.div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-md"
                >
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                            <TrendingUp size={20} className="text-green-600" />
                        </div>
                        <h3 className="font-semibold text-slate-800 dark:text-white">Available</h3>
                    </div>
                    <p className="text-3xl font-bold text-green-600">₹{totalBalance}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Ready to use</p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-md"
                >
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                            <Gift size={20} className="text-blue-600" />
                        </div>
                        <h3 className="font-semibold text-slate-800 dark:text-white">Rewards</h3>
                    </div>
                    <p className="text-3xl font-bold text-blue-600">{rewards.length}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Total earned</p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-md"
                >
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                            <Clock size={20} className="text-purple-600" />
                        </div>
                        <h3 className="font-semibold text-slate-800 dark:text-white">Used</h3>
                    </div>
                    <p className="text-3xl font-bold text-purple-600">
                        {rewards.filter(r => r.isUsed).length}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Claimed rewards</p>
                </motion.div>
            </div>

            {/* Rewards List */}
            <div>
                <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">
                    Your CrashCash Rewards
                </h3>

                {rewards.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-12 text-center"
                    >
                        <p className="text-slate-600 dark:text-slate-400 mb-2">No CrashCash yet</p>
                        <p className="text-sm text-slate-500 dark:text-slate-500">
                            Make a purchase to earn CrashCash rewards
                        </p>
                    </motion.div>
                ) : (
                    <div className="space-y-3">
                        {rewards.map((reward, idx) => (
                            <motion.div
                                key={reward.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className={`p-4 rounded-lg border-2 ${
                                    isExpired(reward.expiresAt)
                                        ? 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700'
                                        : reward.isUsed
                                        ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700'
                                        : 'bg-orange-50 dark:bg-orange-900/20 border-orange-300 dark:border-orange-700'
                                }`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="text-2xl">
                                                {reward.isUsed ? '✓' : reward.rewardType === 'cashback' ? '💰' : '🎁'}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-slate-800 dark:text-white">
                                                    ₹{reward.rewardValue}
                                                </p>
                                                <p className="text-xs text-slate-600 dark:text-slate-400">
                                                    {reward.rewardCode}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="text-right">
                                        <p className={`text-xs font-medium ${
                                            isExpired(reward.expiresAt)
                                                ? 'text-red-600'
                                                : reward.isUsed
                                                ? 'text-green-600'
                                                : 'text-orange-600'
                                        }`}>
                                            {isExpired(reward.expiresAt)
                                                ? 'Expired'
                                                : reward.isUsed
                                                ? 'Used'
                                                : 'Available'}
                                        </p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                            Expires: {formatDate(reward.expiresAt)}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
