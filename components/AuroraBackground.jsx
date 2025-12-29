'use client'
import React from 'react'

export function AuroraBackground({ children, className = '' }) {
    return (
        <div className={`relative min-h-screen bg-slate-950 overflow-hidden ${className}`}>
            {/* Aurora Lights */}
            <div className='absolute inset-0 overflow-hidden'>
                {/* Primary Aurora */}
                <div className='absolute top-0 left-1/4 w-96 h-96 bg-blue-500 rounded-full blur-3xl opacity-20 animate-pulse'></div>
                <div className='absolute top-0 right-1/4 w-96 h-96 bg-purple-500 rounded-full blur-3xl opacity-20 animate-pulse animation-delay-1000'></div>
                <div className='absolute bottom-0 left-1/3 w-96 h-96 bg-cyan-500 rounded-full blur-3xl opacity-20 animate-pulse animation-delay-2000'></div>
                <div className='absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500 rounded-full blur-3xl opacity-20 animate-pulse animation-delay-3000'></div>

                {/* Secondary Aurora */}
                <div className='absolute top-1/4 right-0 w-96 h-96 bg-indigo-500 rounded-full blur-3xl opacity-10 animate-blob'></div>
                <div className='absolute bottom-1/4 left-1/2 w-96 h-96 bg-violet-500 rounded-full blur-3xl opacity-10 animate-blob animation-delay-2000'></div>
            </div>

            {/* Stars */}
            <div className='absolute inset-0'>
                {[...Array(50)].map((_, i) => (
                    <div
                        key={i}
                        className='absolute w-1 h-1 bg-white rounded-full opacity-60'
                        style={{
                            top: `${Math.random() * 100}%`,
                            left: `${Math.random() * 100}%`,
                            animation: `twinkle ${2 + Math.random() * 3}s infinite`,
                            animationDelay: `${Math.random() * 2}s`,
                        }}
                    />
                ))}
            </div>

            {/* Content */}
            <div className='relative z-10'>
                {children}
            </div>

            <style jsx>{`
                @keyframes twinkle {
                    0%, 100% { opacity: 0.3; }
                    50% { opacity: 1; }
                }
                @keyframes blob {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    33% { transform: translate(30px, -50px) scale(1.1); }
                    66% { transform: translate(-20px, 20px) scale(0.9); }
                }
                .animate-blob {
                    animation: blob 7s infinite;
                }
                .animation-delay-1000 {
                    animation-delay: 1000ms;
                }
                .animation-delay-2000 {
                    animation-delay: 2000ms;
                }
                .animation-delay-3000 {
                    animation-delay: 3000ms;
                }
            `}</style>
        </div>
    )
}

export default AuroraBackground
