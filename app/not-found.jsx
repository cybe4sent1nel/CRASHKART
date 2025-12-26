'use client'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { ArrowLeft, ShoppingBag } from 'lucide-react'
import { useEffect, useState } from 'react'

const Lottie = dynamic(() => import('lottie-react'), { ssr: false })

export default function NotFound() {
    const router = useRouter()
    const [animationData, setAnimationData] = useState(null)

    useEffect(() => {
        fetch('/lonely-404.json')
            .then(res => res.json())
            .then(data => setAnimationData(data))
            .catch(err => console.error('Failed to load animation:', err))
    }, [])

    return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4 py-8">
            {/* Lottie Animation - Bigger */}
            {animationData && (
                <div className="w-96 h-96 mb-8">
                    <Lottie
                        animationData={animationData}
                        loop={true}
                        autoplay={true}
                        style={{ width: '100%', height: '100%' }}
                    />
                </div>
            )}

            {/* Title with Gradient */}
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-red-500 via-pink-500 to-red-600 bg-clip-text text-transparent mb-6 text-center">
                Page Not Found
            </h1>

            {/* Troubleshoot Section */}
            <div className="bg-gray-100 rounded-lg p-6 mb-8 max-w-md w-full">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Troubleshooting Tips:</h2>
                <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-start gap-2">
                        <span className="text-red-600 font-bold">•</span>
                        <span>Check if the URL is spelled correctly</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-red-600 font-bold">•</span>
                        <span>Try going back and navigating again</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-red-600 font-bold">•</span>
                        <span>Clear your browser cache and reload</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-red-600 font-bold">•</span>
                        <span>Return to home page and search for content</span>
                    </li>
                </ul>
            </div>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                    onClick={() => router.back()}
                    className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition duration-300 transform hover:scale-105 active:scale-95"
                >
                    <ArrowLeft size={20} />
                    Go Back
                </button>

                <button
                    onClick={() => router.push('/')}
                    className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition duration-300 transform hover:scale-105 active:scale-95"
                >
                    <ShoppingBag size={20} />
                    Continue Shopping
                </button>
            </div>
        </div>
    )
}
