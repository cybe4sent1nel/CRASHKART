'use client'
import Lottie from 'lottie-react'
import { useEffect, useState } from 'react'

export default function LottieIcon({ animationPath, width = '24px', height = '24px', loop = true }) {
    const [animationData, setAnimationData] = useState(null)
    
    useEffect(() => {
        fetch(animationPath)
            .then(res => res.json())
            .then(data => setAnimationData(data))
            .catch(err => console.error('Error loading animation:', err))
    }, [animationPath])
    
    if (!animationData) return <div style={{ width, height, backgroundColor: '#e2e8f0' }} />
    
    return (
        <div style={{ width, height }}>
            <Lottie
                animationData={animationData}
                loop={loop}
                autoplay
                style={{ width: '100%', height: '100%' }}
            />
        </div>
    )
}
