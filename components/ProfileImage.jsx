'use client'
import { useState } from 'react'

export default function ProfileImage({ src, alt, name, className = 'w-10 h-10 rounded-full object-cover border-2 border-red-500' }) {
    const [imageError, setImageError] = useState(false)
    const [imageLoaded, setImageLoaded] = useState(false)

    // Handle image error
    const handleImageError = () => {
        setImageError(true)
    }

    // Handle image load
    const handleImageLoad = () => {
        setImageLoaded(true)
    }

    // If image failed to load or doesn't exist, show fallback
    if (imageError || !src) {
        return (
            <div className={`bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-white font-semibold ${className.includes('w-10') ? 'text-sm' : 'text-lg'} ${className.replace(/object-cover border.*/, '').trim()}`}>
                {name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
        )
    }

    return (
        <>
            <img
                src={src}
                alt={alt || name}
                className={className}
                onError={handleImageError}
                onLoad={handleImageLoad}
                loading="lazy"
            />
            {!imageLoaded && (
                <div className={`absolute inset-0 bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-white font-semibold rounded-full animate-pulse`}>
                    {name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
            )}
        </>
    )
}
