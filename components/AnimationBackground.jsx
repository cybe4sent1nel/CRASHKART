"use client"

import { useEffect, useState } from 'react'
import LottieAnimation from './LottieAnimation'

export default function AnimationBackground({ animationPath, className = '', opacity = 0.08 }) {
    const [data, setData] = useState(null)

    useEffect(() => {
        if (!animationPath) return
        let active = true
        console.debug('[AnimationBackground] fetching', animationPath)
        fetch(encodeURI(animationPath))
            .then((r) => r.json())
            .then((d) => { if (active) {
                console.debug('[AnimationBackground] loaded animation, bytes:', JSON.stringify(d).length)
                setData(d)
            } })
            .catch((err) => console.warn('Failed to load animation', animationPath, err))
        return () => { active = false }
    }, [animationPath])

    if (!data) return (
        <div className={`pointer-events-none absolute top-3 right-3 z-50 ${className}`}>
            <div className="bg-black/50 text-white text-xs px-2 py-1 rounded">Lottie debug: loading</div>
        </div>
    )

    return (
        <div className={`pointer-events-none absolute inset-0 z-0 ${className}`} style={{ opacity }}>
            <div className="absolute inset-0">
                <LottieAnimation animationData={data} loop={true} autoplay={true} style={{ width: '100%', height: '100%' }} />
            </div>
        </div>
    )
}
