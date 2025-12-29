'use client'
import React, { useState, useEffect } from 'react'
import { shouldShowFeedback, saveMaybeLater } from '@/lib/feedbackService'
import { MessageSquare, X } from 'lucide-react'

export default function FeedbackInvitation({ onAccept, onDismiss }) {
    const [show, setShow] = useState(false)
    const [isAnimating, setIsAnimating] = useState(false)

    useEffect(() => {
        // Check on mount and after a delay to not interfere with initial page load
        const timer = setTimeout(() => {
            if (shouldShowFeedback()) {
                setShow(true)
                setIsAnimating(true)
            }
        }, 3000) // Show after 3 seconds

        return () => clearTimeout(timer)
    }, [])

    const handleReviewNow = () => {
        setIsAnimating(false)
        setTimeout(() => {
            setShow(false)
            onAccept?.()
        }, 300)
    }

    const handleMaybeLater = () => {
        saveMaybeLater()
        setIsAnimating(false)
        setTimeout(() => {
            setShow(false)
            onDismiss?.()
        }, 300)
    }

    const handleClose = () => {
        setIsAnimating(false)
        setTimeout(() => {
            setShow(false)
            onDismiss?.()
        }, 300)
    }

    if (!show) return null

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center pointer-events-none">
            {/* Backdrop */}
            <div
                onClick={handleClose}
                className={`fixed inset-0 bg-black pointer-events-auto transition-opacity duration-300 ${
                    isAnimating ? 'opacity-40' : 'opacity-0'
                }`}
            />

            {/* Card */}
            <div
                className={`relative mx-4 sm:mx-0 sm:max-w-md w-full pointer-events-auto transition-all duration-300 ${
                    isAnimating
                        ? 'translate-y-0 sm:scale-100 opacity-100'
                        : 'translate-y-full sm:scale-95 opacity-0'
                }`}
            >
                <div className="bg-gradient-to-br from-white via-green-50 to-emerald-50 dark:from-slate-800 dark:via-green-900/20 dark:to-emerald-900/20 rounded-t-3xl sm:rounded-3xl shadow-2xl p-8 border-2 border-green-200 dark:border-green-800">
                    {/* Close Button */}
                    <button
                        onClick={handleClose}
                        className="absolute top-4 right-4 p-2 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-full transition text-slate-600 dark:text-slate-400"
                        aria-label="Close"
                    >
                        <X size={20} />
                    </button>

                    {/* Icon */}
                    <div className="flex justify-center mb-4">
                        <div className="p-4 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full">
                            <MessageSquare className="w-6 h-6 text-white" />
                        </div>
                    </div>

                    {/* Content */}
                    <h2 className="text-2xl font-bold text-center text-slate-900 dark:text-white mb-3">
                        Love CrashKart?
                    </h2>

                    <p className="text-center text-slate-600 dark:text-slate-300 mb-8">
                        We'd love to hear your feedback! Help us improve your shopping experience.
                    </p>

                    {/* Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        <button
                            onClick={handleReviewNow}
                            className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold rounded-lg transition shadow-lg hover:shadow-xl active:scale-95"
                        >
                            Review Now
                        </button>
                        <button
                            onClick={handleMaybeLater}
                            className="flex-1 px-6 py-3 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-bold rounded-lg transition active:scale-95"
                        >
                            Maybe Later
                        </button>
                    </div>

                    {/* Subtext */}
                    <p className="text-xs text-center text-slate-500 dark:text-slate-400 mt-4">
                        Takes less than 2 minutes ✨
                    </p>
                </div>
            </div>
        </div>
    )
}
