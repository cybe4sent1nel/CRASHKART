'use client'
import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

const Lottie = dynamic(() => import('lottie-react'), { ssr: false })

export default function OutOfStockDisplay({ size = 'medium' }) {
    const [animationData, setAnimationData] = useState(null)
    const [isClient, setIsClient] = useState(false)
    
    const sizeClasses = {
        small: 'w-32 h-32',
        medium: 'w-48 h-48',
        large: 'w-64 h-64'
    }

    useEffect(() => {
        setIsClient(true)
        // Fetch the animation JSON file
        fetch('/animations/No Item Found.json')
            .then(res => res.json())
            .then(data => setAnimationData(data))
            .catch(err => console.error('Failed to load animation:', err))
    }, [])

    return (
        <div className="flex flex-col items-center justify-center">
            <div className={sizeClasses[size]}>
                {isClient && animationData ? (
                    <Lottie
                        animationData={animationData}
                        loop={true}
                        autoplay={true}
                        style={{ width: '100%', height: '100%' }}
                    />
                ) : (
                    <div className="text-center text-slate-400">
                        <p>Loading...</p>
                    </div>
                )}
            </div>
            <p className="text-xl font-bold text-red-600 dark:text-red-400 mt-4">
                Out of Stock
            </p>
        </div>
    )
}
