'use client'

import dynamic from 'next/dynamic'
import { useLoadAnimation } from './useLoadAnimation'

const Lottie = dynamic(() => import('lottie-react'), { ssr: false })

export default function EmptyAnimation({ width = '250px', height = '250px', loop = true, autoplay = true, speed = 1 }) {
    const { animationData, error, isLoading } = useLoadAnimation('/animations/empty.json')

    if (error || isLoading || !animationData) {
        return <div style={{ width, height }} />
    }

    return (
        <div style={{ width, height }}>
            <Lottie
                animationData={animationData}
                loop={loop}
                autoplay={autoplay}
                speed={speed}
            />
        </div>
    )
}
