'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import Lottie from 'lottie-react'
import noConnectionAnimation from '@/public/no-connection.json'

export default function OfflineDetector() {
    const [isOnline, setIsOnline] = useState(true)
    const [mounted, setMounted] = useState(false)
    const [consecutiveFailures, setConsecutiveFailures] = useState(0)
    const pathname = usePathname()
    
    // Don't show offline overlay for admin pages - they should handle their own errors
    const isAdminRoute = pathname?.startsWith('/admin')

    useEffect(() => {
        setMounted(true)
        // Initial check - assume online until proven otherwise
        setIsOnline(true)
        setConsecutiveFailures(0)

        // Check actual connectivity by trying to fetch a resource
        const checkConnectivity = async () => {
            try {
                const controller = new AbortController()
                const timeoutId = setTimeout(() => controller.abort(), 8000) // Increased timeout
                
                await fetch('/api/health-check', {
                    method: 'HEAD',
                    cache: 'no-cache',
                    signal: controller.signal
                })
                
                clearTimeout(timeoutId)
                setIsOnline(true)
                setConsecutiveFailures(0)
            } catch (error) {
                console.log('🔴 Connection check failed:', error.message)
                // Only set offline after multiple consecutive failures
                setConsecutiveFailures(prev => {
                    const newCount = prev + 1
                    if (newCount >= 2 && !navigator.onLine) {
                        setIsOnline(false)
                    }
                    return newCount
                })
            }
        }

        const handleOnline = () => {
            console.log('🟢 Browser reports online')
            setIsOnline(true)
            setConsecutiveFailures(0)
        }
        
        const handleOffline = () => {
            console.log('🔴 Browser reports offline')
            // Double check before showing offline screen
            setTimeout(() => {
                if (!navigator.onLine) {
                    setIsOnline(false)
                }
            }, 1000)
        }

        window.addEventListener('online', handleOnline)
        window.addEventListener('offline', handleOffline)

        // Only poll when offline to check if connection restored
        const pollInterval = setInterval(() => {
            if (!navigator.onLine) {
                console.log('📡 Still offline, checking...')
                checkConnectivity() // Re-check connectivity
            }
        }, 15000) // Increased poll interval to reduce false positives

        // Don't do initial check - assume online first
        // Only check if browser reports offline
        if (!navigator.onLine) {
            checkConnectivity()
        }

        return () => {
            window.removeEventListener('online', handleOnline)
            window.removeEventListener('offline', handleOffline)
            clearInterval(pollInterval)
        }
    }, [])

    // Don't render until mounted to avoid hydration mismatch
    if (!mounted) return null
    
    // Don't show offline screen for admin routes
    if (isAdminRoute) return null

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
