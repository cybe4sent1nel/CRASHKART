'use client'
import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { RefreshCw } from 'lucide-react'
import noConnectionAnimation from '@/public/no-connection.json'

const Lottie = dynamic(() => import('lottie-react'), { ssr: false })

export default function Error({ error, reset }) {
    const [isOnline, setIsOnline] = useState(true)
    const [retrying, setRetrying] = useState(false)

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

    const handleRetry = async () => {
        setRetrying(true)
        await new Promise(resolve => setTimeout(resolve, 1000))
        setRetrying(false)
        reset()
    }

    return (
        <div className="min-h-screen bg-white dark:bg-slate-900 flex flex-col items-center justify-center px-4 py-8">
            {/* Lottie Animation */}
            <div className="w-64 h-64 mb-8">
                <Lottie
                    animationData={noConnectionAnimation}
                    loop={true}
                    autoplay={true}
                    style={{ width: '100%', height: '100%' }}
                />
            </div>

            {/* Title with Gradient */}
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-500 via-purple-500 to-blue-600 bg-clip-text text-transparent mb-6 text-center">
                No Internet Connection
            </h1>

            {/* Troubleshoot Section */}
            <div className="bg-gray-100 rounded-lg p-6 mb-8 max-w-md w-full">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Troubleshooting Steps:</h2>
                <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-start gap-2">
                        <span className="text-blue-600 font-bold">•</span>
                        <span>Check if WiFi or mobile data is enabled</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-blue-600 font-bold">•</span>
                        <span>Move closer to your WiFi router</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-blue-600 font-bold">•</span>
                        <span>Restart your internet connection</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-blue-600 font-bold">•</span>
                        <span>Check if other devices can connect</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-blue-600 font-bold">•</span>
                        <span>Restart your device and try again</span>
                    </li>
                </ul>
            </div>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                    onClick={handleRetry}
                    disabled={retrying}
                    className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-lg transition duration-300 transform hover:scale-105 active:scale-95"
                >
                    <RefreshCw size={20} className={retrying ? 'animate-spin' : ''} />
                    {retrying ? 'Retrying...' : 'Try Again'}
                </button>

                <button
                    onClick={() => window.location.href = '/'}
                    className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition duration-300 transform hover:scale-105 active:scale-95"
                >
                    Go to Home
                </button>
            </div>
        </div>
    )
}
