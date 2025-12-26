'use client'

import { useEffect, useState } from 'react'
import Lottie from 'lottie-react'
import noConnectionAnimation from '@/public/no-connection.json'

export default function OfflineDetector() {
    const [isOnline, setIsOnline] = useState(true)
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
        // Initial check
        const initialStatus = navigator.onLine
        setIsOnline(initialStatus)

        const handleOnline = () => {
            console.log('🟢 Connection restored')
            setIsOnline(true)
        }
        
        const handleOffline = () => {
            console.log('🔴 Connection lost')
            setIsOnline(false)
        }

        window.addEventListener('online', handleOnline)
        window.addEventListener('offline', handleOffline)

        return () => {
            window.removeEventListener('online', handleOnline)
            window.removeEventListener('offline', handleOffline)
        }
    }, [])

    // Don't render until mounted to avoid hydration mismatch
    if (!mounted) return null

    if (!isOnline) {
        return (
            <div className="fixed inset-0 z-[999] bg-white dark:bg-slate-900 overflow-y-auto">
                <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8">
                    {/* Logo at top */}
                    <div className="mb-8 flex items-center gap-2">
                        <span className="text-2xl font-bold text-slate-800 dark:text-white">
                            <span className="text-red-600">crash</span>kart
                            <span className="text-red-600 text-3xl leading-0">.</span>
                        </span>
                    </div>

                    {/* Animation */}
                    <div className="w-64 h-64 mb-8">
                        <Lottie
                            animationData={noConnectionAnimation}
                            loop
                            autoplay
                            style={{ width: '100%', height: '100%' }}
                        />
                    </div>

                    {/* Title */}
                    <h1 className="text-4xl md:text-5xl font-bold text-slate-800 dark:text-white mb-2 text-center">
                        No Internet Connection
                    </h1>

                    {/* Troubleshooting Card */}
                    <div className="bg-gray-100 dark:bg-slate-800 rounded-lg p-6 mb-8 max-w-md w-full">
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Troubleshooting Steps:</h2>
                        <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                            <li className="flex items-start gap-2">
                                <span className="text-blue-600 dark:text-blue-400 font-bold">•</span>
                                <span>Check if WiFi or mobile data is enabled</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-blue-600 dark:text-blue-400 font-bold">•</span>
                                <span>Move closer to your WiFi router</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-blue-600 dark:text-blue-400 font-bold">•</span>
                                <span>Restart your internet connection</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-blue-600 dark:text-blue-400 font-bold">•</span>
                                <span>Restart your device and try again</span>
                            </li>
                        </ul>
                    </div>

                    {/* Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center w-full max-w-md">
                        <button
                            onClick={() => window.location.reload()}
                            className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 dark:hover:bg-blue-500 text-white rounded-lg font-semibold transition-all duration-300 active:scale-95 shadow-lg hover:shadow-xl"
                        >
                            ↻ Try Again
                        </button>

                        <button
                            onClick={() => window.location.href = '/'}
                            className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 dark:hover:bg-red-500 text-white rounded-lg font-semibold transition-all duration-300 active:scale-95 shadow-lg hover:shadow-xl"
                        >
                            Go to Home
                        </button>
                    </div>

                    {/* Status Indicator */}
                    <div className="mt-8 flex items-center justify-center gap-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                            Waiting for connection...
                        </span>
                    </div>
                </div>
            </div>
        )
    }

    return null
}
