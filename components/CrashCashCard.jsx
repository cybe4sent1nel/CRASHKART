'use client'
import { Gift, Info } from 'lucide-react'
import { motion } from 'framer-motion'

export default function CrashCashCard({ product }) {
    if (!product || !product.price) {
        return null
    }

    const { price } = product
    
    // Calculate CrashCash value: 5% of product price (you can adjust this percentage)
    const crashCashPercentage = 5
    const calculatedCrashCash = Math.round((price * crashCashPercentage) / 100)
    
    // Use product's crashCashValue if set, otherwise use calculated value
    const crashCashValue = product.crashCashValue || calculatedCrashCash
    const crashCashMin = product.crashCashMin || 10
    const crashCashMax = product.crashCashMax || 500
    
    // Skip if calculated value is 0 or negative
    if (crashCashValue <= 0) {
        return null
    }
    
    // Calculate percentage
    const percentage = price > 0 ? ((crashCashValue / price) * 100).toFixed(0) : 0

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-orange-950/20 dark:to-yellow-950/20 rounded-2xl p-6 border-2 border-orange-200 dark:border-orange-800 mt-6"
        >
            <div className="flex items-start gap-4">
                <div className="p-3 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-xl shadow-lg">
                    <img src="/crashcash.ico" alt="CrashCash" className="w-8 h-8" />
                </div>
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-bold text-orange-800 dark:text-orange-200">
                            Earn CrashCash
                        </h3>
                        <span className="px-2 py-1 bg-orange-500 text-white text-xs font-bold rounded-full">
                            {percentage}% Back
                        </span>
                    </div>
                    <div className="flex items-baseline gap-2 mb-3">
                        <span className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                            ₹{crashCashValue}
                        </span>
                        <span className="text-sm text-orange-700 dark:text-orange-300">
                            CrashCash on this purchase
                        </span>
                    </div>
                    
                    <div className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                        <div className="flex items-start gap-2">
                            <Gift className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                            <p>
                                Earn <strong className="text-orange-600 dark:text-orange-400">₹{crashCashValue}</strong> CrashCash when you buy this product
                            </p>
                        </div>
                        <div className="flex items-start gap-2">
                            <Info className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                            <p>
                                Use CrashCash on your next order. Redeem minimum ₹{crashCashMin}, maximum ₹{crashCashMax} per order
                            </p>
                        </div>
                    </div>

                    <div className="mt-4 p-3 bg-white dark:bg-slate-800/50 rounded-xl border border-orange-200 dark:border-orange-800">
                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                            <strong className="text-orange-600 dark:text-orange-400">How it works:</strong> Complete your purchase and CrashCash will be credited to your wallet within 24 hours. Use it to get instant discounts on future orders!
                        </p>
                    </div>
                </div>
            </div>
        </motion.div>
    )
}
