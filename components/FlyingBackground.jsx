"use client"

import { useEffect, useState } from 'react'
import LottieAnimation from './LottieAnimation'

export default function FlyingBackground({ className = '', opacity = 0.08 }) {
    const [data, setData] = useState(null)

    useEffect(() => {
        let active = true
        console.debug('[FlyingBackground] fetching /animations/Flying money.json')
        fetch(encodeURI('/animations/Flying money.json'))
            .then((r) => r.json())
            .then((d) => { if (active) setData(d) })
            .catch((err) => console.warn('Failed to load flying animation', err))
        return () => { active = false }
    }, [])

    if (!data) return null

    return (
        <div className={`pointer-events-none absolute inset-0 z-0 ${className}`} style={{ opacity }}>
            <div className="absolute inset-0">
                <LottieAnimation animationData={data} loop={true} autoplay={true} style={{ width: '100%', height: '100%' }} />
            </div>
        </div>
    )
}
