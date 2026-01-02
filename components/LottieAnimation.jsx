'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'

// Dynamically import Lottie to avoid SSR issues
const Lottie = dynamic(() => import('lottie-react'), { ssr: false })

export default function LottieAnimation({ 
    animationData, 
    width, 
    height, 
    loop = true,
    autoplay = true,
    className = '',
    style
}) {
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return (
            <div 
                style={style}
                className={`bg-slate-100 dark:bg-slate-700 rounded-lg animate-pulse border-2 border-red-200 flex items-center justify-center ${className}`}
            >
                <span className="text-sm text-red-600 font-semibold">LOTTIE (mounting)</span>
            </div>
        )
    }

    if (!animationData) {
        return (
            <div 
                style={style}
                className={`bg-slate-200 dark:bg-slate-600 rounded-lg flex items-center justify-center border-2 border-yellow-200 ${className}`}
            >
                <span className="text-sm text-yellow-700 font-semibold">LOTTIE: animation not found</span>
            </div>
        )
    }

    const wrapperStyle = {
        ...style,
        ...(typeof width === 'number' ? { width } : {}),
        ...(typeof height === 'number' ? { height } : {}),
    }

    return (
        <div className={className} style={wrapperStyle}>
            <Lottie
                animationData={animationData}
                loop={loop}
                autoplay={autoplay}
                style={{ width: '100%', height: '100%' }}
            />
        </div>
    )
}
