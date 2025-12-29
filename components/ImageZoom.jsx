'use client'
import { useState, useRef } from 'react'
import Image from 'next/image'
import { ZoomIn } from 'lucide-react'

export default function ImageZoom({ src, alt, className = '' }) {
    const [showZoom, setShowZoom] = useState(false)
    const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 })
    const imageRef = useRef(null)

    const handleMouseMove = (e) => {
        if (!imageRef.current) return

        const rect = imageRef.current.getBoundingClientRect()
        const x = ((e.clientX - rect.left) / rect.width) * 100
        const y = ((e.clientY - rect.top) / rect.height) * 100

        setZoomPosition({ x, y })
    }

    return (
        <div className="relative group">
            {/* Main Image */}
            <div
                ref={imageRef}
                className={`relative overflow-hidden ${className}`}
                onMouseEnter={() => setShowZoom(true)}
                onMouseLeave={() => setShowZoom(false)}
                onMouseMove={handleMouseMove}
            >
                <Image
                    src={src}
                    alt={alt}
                    fill
                    className="object-contain"
                />

                {/* Zoom Icon */}
                <div className="absolute top-4 right-4 bg-white/80 backdrop-blur-sm p-2 rounded-full opacity-0 group-hover:opacity-100 transition">
                    <ZoomIn size={20} className="text-slate-600" />
                </div>
            </div>

            {/* Zoomed Preview */}
            {showZoom && (
                <div className="hidden lg:block absolute left-full top-0 ml-4 w-96 h-96 bg-white rounded-xl shadow-2xl overflow-hidden border-2 border-slate-200 z-50">
                    <div
                        className="w-full h-full"
                        style={{
                            backgroundImage: `url(${src})`,
                            backgroundSize: '200%',
                            backgroundPosition: `${zoomPosition.x}% ${zoomPosition.y}%`,
                            backgroundRepeat: 'no-repeat'
                        }}
                    />
                </div>
            )}
        </div>
    )
}
