'use client'

import dynamic from 'next/dynamic'
import { useLoadAnimation } from './useLoadAnimation'

const Lottie = dynamic(() => import('lottie-react'), { ssr: false })

export default function EmptyGhostAnimation({ width = '250px', height = '250px', loop = true, autoplay = true, speed = 1, animationPath }) {
    const path = animationPath || '/animations/empty ghost.json'
    const { animationData, error, isLoading } = useLoadAnimation(path)

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
