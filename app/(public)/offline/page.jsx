'use client'

import Lottie from 'lottie-react'
import noConnectionAnimation from '@/public/no-connection.json'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Home, RefreshCw, HelpCircle } from 'lucide-react'

export default function OfflinePage() {
    const [isOnline, setIsOnline] = useState(true)

    useEffect(() => {
        setIsOnline(navigator.onLine)

        const handleOnline = () => setIsOnline(true)
        const handleOffline = () => setIsOnline(false)

        window.addEventListener('online', handleOnline)
        window.addEventListener('offline', handleOffline)

        return () => {
            window.removeEventListener('online', handleOnline)
            window.removeEventListener('offline', handleOffline)
        }
    }, [])

    if (isOnline) {
        return null
    }

    return (
        <div className="fixed inset-0 bg-white dark:bg-slate-900 z-50 flex flex-col items-center justify-center p-6">
            {/* Logo */}
            <div className="absolute top-8 flex items-center gap-2">
                <img src="/logo.bmp" alt="CrashKart" className="w-10 h-10" />
                <span className="text-xl font-bold text-slate-800 dark:text-white">
                    <span className="text-red-600">crash</span>kart
                </span>
            </div>

            {/* Animation */}
            <div className="w-56 h-56 mb-4">
                <Lottie
                    animationData={noConnectionAnimation}
                    loop
                    autoplay
                    style={{ width: '100%', height: '100%' }}
                />
            </div>

            {/* Content */}
            <div className="text-center max-w-md">
                <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">
                    No Internet Connection
                </h1>
                <p className="text-slate-600 dark:text-slate-400 mb-8">
                    It looks like you've lost your internet connection. Please check your connection and try again.
                </p>

                {/* Action Buttons */}
                <div className="flex flex-col gap-3">
                    <button
                        onClick={() => window.location.reload()}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition w-full"
                    >
                        <RefreshCw size={18} />
                        Retry Connection
                    </button>

                    <Link
                        href="/"
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-600 hover:bg-slate-700 text-white rounded-lg font-semibold transition w-full"
                    >
                        <Home size={18} />
                        Go Back Home
                    </Link>
                </div>

                {/* Troubleshooting Card */}
                <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex gap-2 mb-2">
                        <HelpCircle size={18} className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                        <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                            Troubleshooting Tips
                        </h3>
                    </div>
                    <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1 text-left">
                        <li>• Check your Wi-Fi or mobile data connection</li>
                        <li>• Try turning airplane mode off and on</li>
                        <li>• Restart your router or modem</li>
                        <li>• Check if other devices have internet</li>
                    </ul>
                </div>

                {/* Status Indicator */}
                <div className="mt-6 flex items-center justify-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-slate-600 dark:text-slate-400">
                        Waiting for connection...
                    </span>
                </div>
            </div>
        </div>
    )
}
