'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'

// Dynamically import Lottie to avoid SSR issues
const Lottie = dynamic(() => import('lottie-react'), { ssr: false })

export default function LottieAnimation({ 
    animationData, 
    width = 200, 
    height = 200, 
    loop = true,
    autoplay = true,
    className = ''
}) {
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return (
            <div 
                style={{ width, height }}
                className={`bg-slate-100 dark:bg-slate-700 rounded-lg animate-pulse ${className}`}
            />
        )
    }

    if (!animationData) {
        return (
            <div 
                style={{ width, height }}
                className={`bg-slate-200 dark:bg-slate-600 rounded-lg flex items-center justify-center ${className}`}
            >
                <span className="text-sm text-slate-500">Animation not found</span>
            </div>
        )
    }

    return (
        <div className={className}>
            <Lottie
                animationData={animationData}
                width={width}
                height={height}
                loop={loop}
                autoplay={autoplay}
            />
        </div>
    )
}
