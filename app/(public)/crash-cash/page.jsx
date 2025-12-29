'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Copy, Check, Trash2, Calendar, TrendingUp, History, ShoppingCart, Gift, Wallet } from 'lucide-react'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'
import { updateCrashCashBalance } from '@/lib/crashcashStorage'

export default function CrashCashPage() {
    const router = useRouter()
    const [crashCashList, setCrashCashList] = useState([])
    const [totalCrashCash, setTotalCrashCash] = useState(0)
    const [expiredCrashCash, setExpiredCrashCash] = useState(0)
    const [copiedCode, setCopiedCode] = useState(null)
    const [activeTab, setActiveTab] = useState('active')

    useEffect(() => {
         const userData = localStorage.getItem('user')
         if (!userData) {
             router.push('/login')
             return
         }

         try {
             const user = JSON.parse(userData)
             const email = user.email
             
             if (!email) {
                 router.push('/login')
                 return
             }
             
             // Use unified balance calculation from crashcashStorage
             const balance = updateCrashCashBalance()
             setTotalCrashCash(balance)
             console.log('💰 Crash-Cash page loaded balance:', balance)
             
             // Load order rewards
             const orderRewards = JSON.parse(localStorage.getItem('orderCrashCashRewards') || '[]')
             // Load scratch card rewards
             const scratchRewards = JSON.parse(localStorage.getItem('scratchCardRewards') || '[]')
                 .filter(r => r.type === 'reward' && r.rewardType === 'crashcash')
             
             // Combine all rewards
             const allRewards = [
                 ...orderRewards.map(r => ({
                     ...r,
                     code: r.orderId || 'ORDER-REWARD',
                     expiryDate: r.expiresAt,
                     source: r.source || 'order'
                 })),
                 ...scratchRewards.map(r => ({
                     ...r,
                     amount: r.crashcash || 0,
                     code: r.code || 'SCRATCH-REWARD',
                     expiryDate: r.expiresAt,
                     source: 'scratch'
                 }))
             ]
             
             setCrashCashList(allRewards)

             // Calculate expired amount
             let totalExpired = 0
             const now = new Date()
             allRewards.forEach(item => {
                 if (item.expiryDate && new Date(item.expiryDate) < now) {
                     totalExpired += item.amount || 0
                 }
             })

             setExpiredCrashCash(totalExpired)
         } catch (e) {
             console.error('Error loading crash cash:', e)
             router.push('/login')
         }
     }, [router])

    const copyCode = (code) => {
        navigator.clipboard.writeText(code)
        setCopiedCode(code)
        toast.success('Code copied to clipboard!')
        setTimeout(() => setCopiedCode(null), 2000)
    }

    const deleteCrashCash = (code) => {
         if (confirm('Are you sure you want to remove this Crash Cash?')) {
             try {
                 // Remove from order rewards if it's an order reward
                 const orderRewards = JSON.parse(localStorage.getItem('orderCrashCashRewards') || '[]')
                 const updatedOrderRewards = orderRewards.filter(r => (r.orderId || 'ORDER-REWARD') !== code)
                 localStorage.setItem('orderCrashCashRewards', JSON.stringify(updatedOrderRewards))
                 
                 // Remove from scratch rewards if it's a scratch reward
                 const scratchRewards = JSON.parse(localStorage.getItem('scratchCardRewards') || '[]')
                 const updatedScratchRewards = scratchRewards.filter(r => (r.code || 'SCRATCH-REWARD') !== code)
                 localStorage.setItem('scratchCardRewards', JSON.stringify(updatedScratchRewards))
                 
                 // Update local state
                 const updated = crashCashList.filter(item => item.code !== code)
                 setCrashCashList(updated)
                 
                 // Recalculate balance using unified function
                 const newBalance = updateCrashCashBalance()
                 setTotalCrashCash(newBalance)
                 
                 // Recalculate expired
                 let totalExpired = 0
                 const now = new Date()
                 updated.forEach(item => {
                     if (item.expiryDate && new Date(item.expiryDate) < now) {
                         totalExpired += item.amount || 0
                     }
                 })
                 setExpiredCrashCash(totalExpired)

                 toast.success('Crash Cash removed')
                 
                 // Dispatch event to update other components
                 window.dispatchEvent(new CustomEvent('crashcash-update'))
             } catch (error) {
                 console.error('Error deleting crash cash:', error)
                 toast.error('Failed to remove Crash Cash')
             }
         }
     }

    const isExpired = (expiryDate) => {
        return new Date(expiryDate) < new Date()
    }

    const getTimeRemaining = (expiryDate) => {
        if (!expiryDate) return 'No expiry'
        
        const today = new Date()
        const expiry = new Date(expiryDate)
        
        // Check if date is valid
        if (isNaN(expiry.getTime())) return 'Invalid date'
        
        const diffTime = expiry - today
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

        if (diffDays < 0) return 'Expired'
        if (diffDays === 0) return 'Expires Today'
        if (diffDays === 1) return 'Expires Tomorrow'
        return `${diffDays} days left`
    }

    const activeCrashCash = crashCashList.filter(item => !isExpired(item.expiryDate))
    const expiredList = crashCashList.filter(item => isExpired(item.expiryDate))

    const displayList = activeTab === 'active' ? activeCrashCash : expiredList

    if (!crashCashList || crashCashList.length === 0) {
        return (
            <div className="min-h-[70vh] flex items-center justify-center mx-6">
                <div className="text-center max-w-md">
                    <img src="/crashcash.ico" alt="CrashCash" className="w-20 h-20 mx-auto mb-4 opacity-50" />
                    <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">No Crash Cash Yet</h1>
                    <p className="text-slate-600 dark:text-slate-400 mb-2">
                        Earn Crash Cash when you place orders! Whether you win a scratchcard or not, you'll earn:
                    </p>
                    <p className="text-amber-600 dark:text-amber-400 font-semibold mb-8">
                        Minimum ₹10 - Maximum ₹240+ per product
                    </p>
                    <p className="text-slate-600 dark:text-slate-400 mb-8">
                        Valid for 30 days. Use them as discount codes on future purchases!
                    </p>
                    <button
                        onClick={() => router.push('/shop')}
                        className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white rounded-full font-semibold transition"
                    >
                        Start Shopping Now
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 py-10">
            <div className="max-w-6xl mx-auto px-4">
                {/* Header */}
                <div className="text-center mb-10">
                    <div className="flex items-center justify-center gap-3 mb-2">
                        <img src="/crashcash.ico" alt="CrashCash" className="w-12 h-12" />
                        <h1 className="text-4xl font-bold text-slate-800">
                            My Crash Cash
                        </h1>
                    </div>
                    <p className="text-slate-600">Manage your Crash Cash rewards and redeem them for discounts</p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-2xl shadow-lg p-8 border-2 border-amber-200"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-600 mb-2">Active Crash Cash</p>
                                <p className="text-4xl font-bold text-amber-600">₹{totalCrashCash}</p>
                                <p className="text-xs text-slate-500 mt-2">{activeCrashCash.length} active rewards</p>
                            </div>
                            <TrendingUp size={48} className="text-amber-400 opacity-30" />
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white rounded-2xl shadow-lg p-8 border-2 border-red-200"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-600 mb-2">Expired Crash Cash</p>
                                <p className="text-4xl font-bold text-red-600">₹{expiredCrashCash}</p>
                                <p className="text-xs text-slate-500 mt-2">{expiredList.length} expired rewards</p>
                            </div>
                            <History size={48} className="text-red-400 opacity-30" />
                        </div>
                    </motion.div>
                </div>

                {/* Tabs */}
                <div className="flex gap-4 mb-8">
                    <button
                        onClick={() => setActiveTab('active')}
                        className={`px-6 py-3 rounded-lg font-semibold transition ${
                            activeTab === 'active'
                                ? 'bg-amber-600 text-white shadow-lg'
                                : 'bg-white text-slate-700 border border-slate-200 hover:border-amber-400'
                        }`}
                    >
                        Active Crash Cash ({activeCrashCash.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('expired')}
                        className={`px-6 py-3 rounded-lg font-semibold transition ${
                            activeTab === 'expired'
                                ? 'bg-red-600 text-white shadow-lg'
                                : 'bg-white text-slate-700 border border-slate-200 hover:border-red-400'
                        }`}
                    >
                        Expired Crash Cash ({expiredList.length})
                    </button>
                </div>

                {/* Crash Cash List */}
                <div className="space-y-3">
                    {displayList.map((item, index) => (
                        <motion.div
                            key={`${item.code}-${index}`}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.03 }}
                            className={`bg-white rounded-xl shadow-sm border-l-4 transition-all p-4 ${
                                isExpired(item.expiryDate)
                                    ? 'border-l-gray-400 opacity-60'
                                    : 'border-l-amber-500 hover:shadow-md'
                            }`}
                        >
                            <div className="flex items-center justify-between gap-4">
                                {/* Left: Amount */}
                                <div className="flex items-center gap-3 flex-1">
                                    <div className="flex-shrink-0">
                                        <img src="/crashcash.ico" alt="Crash Cash" className="w-10 h-10" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-bold text-lg text-amber-600">₹{item.amount}</p>
                                        <p className="text-xs text-slate-600">
                                            {getTimeRemaining(item.expiryDate)}
                                        </p>
                                    </div>
                                </div>

                                {/* Middle: Code */}
                                <div className="flex-1 hidden sm:block">
                                    <div className="bg-slate-50 rounded-lg p-2 font-mono text-sm font-bold text-slate-800 text-center">
                                        {item.code}
                                    </div>
                                </div>

                                {/* Right: Actions */}
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <button
                                        onClick={() => copyCode(item.code)}
                                        className="p-2 hover:bg-slate-100 rounded-lg transition"
                                        disabled={isExpired(item.expiryDate)}
                                        title="Copy code"
                                    >
                                        {copiedCode === item.code ? (
                                            <Check size={18} className="text-green-600" />
                                        ) : (
                                            <Copy size={18} className="text-slate-600" />
                                        )}
                                    </button>
                                    {!isExpired(item.expiryDate) && (
                                        <button
                                            onClick={() => {
                                                copyCode(item.code)
                                                router.push('/shop')
                                            }}
                                            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold text-sm transition"
                                        >
                                            Use
                                        </button>
                                    )}
                                    <button
                                        onClick={() => deleteCrashCash(item.code)}
                                        className="p-2 hover:bg-red-100 rounded-lg transition text-red-600"
                                        title="Delete"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>

                            {/* Mobile code display */}
                            <div className="sm:hidden mt-2 bg-slate-50 rounded-lg p-2 font-mono text-xs font-bold text-slate-800 text-center">
                                Code: {item.code}
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Empty State for Tab */}
                {displayList.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-slate-600 text-lg">
                            {activeTab === 'active' ? 'No active Crash Cash rewards yet' : 'No expired Crash Cash rewards'}
                        </p>
                    </div>
                )}

                {/* Info Section */}
                <div className="mt-12 bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8 border border-slate-100 dark:border-slate-700">
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-4">How Crash Cash Works</h2>
                    <div className="grid md:grid-cols-3 gap-6 mb-6">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                                <ShoppingCart size={32} className="text-blue-600 dark:text-blue-400" strokeWidth={1.5} />
                            </div>
                            <h3 className="font-semibold text-slate-800 dark:text-white mb-2">Place Orders</h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400">Earn Crash Cash on EVERY purchase (₹10-₹240+ per product)</p>
                        </div>
                        <div className="text-center">
                            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Gift size={32} className="text-green-600 dark:text-green-400" strokeWidth={1.5} />
                            </div>
                            <h3 className="font-semibold text-slate-800 dark:text-white mb-2">Instant Wallet Credit</h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400">Funds added automatically - whether you win a scratchcard or not!</p>
                        </div>
                        <div className="text-center">
                            <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                                <img src="/crashcash.ico" alt="Crash Cash" className="w-8 h-8" />
                            </div>
                            <h3 className="font-semibold text-slate-800 dark:text-white mb-2">Redeem & Save</h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400">Use your Crash Cash codes for discounts on future purchases</p>
                        </div>
                    </div>

                    {/* Product-specific earnings */}
                    <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                        <p className="text-sm text-blue-900 dark:text-blue-300 mb-2">
                            <span className="font-semibold">ℹ Product-Specific Earnings:</span>
                        </p>
                        <p className="text-sm text-blue-800 dark:text-blue-300">
                            Different products earn different amounts of Crash Cash. Higher-priced items can earn up to ₹240+ in Crash Cash, while affordable products earn a minimum of ₹10. Check each product page to see the earning range!
                        </p>
                    </div>

                    {/* Expiry note */}
                    <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-700">
                        <p className="text-sm text-amber-900 dark:text-amber-300">
                            <span className="font-semibold">⏳ Note:</span> All Crash Cash earned is valid for 30 days from the purchase date. Make sure to use them before they expire. Expired rewards cannot be redeemed.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
