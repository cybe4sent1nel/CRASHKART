'use client'
import { useState, useRef } from 'react'
import { Play, Pause, Volume2, Maximize } from 'lucide-react'

export default function MediaPlayer({ mediaUrl, mediaType, mediaDuration, title = 'Media' }) {
    const [isPlaying, setIsPlaying] = useState(false)
    const [currentTime, setCurrentTime] = useState(0)
    const [isFullscreen, setIsFullscreen] = useState(false)
    const videoRef = useRef(null)
    const containerRef = useRef(null)

    if (!mediaUrl) return null

    // Image display
    if (mediaType?.startsWith('image/')) {
        return (
            <div className="flex justify-center items-center bg-slate-100 dark:bg-slate-700 rounded-lg overflow-hidden max-w-2xl">
                <img
                    src={mediaUrl}
                    alt={title}
                    className="w-full h-auto max-h-96 object-contain"
                />
            </div>
        )
    }

    // Video display
    if (mediaType?.startsWith('video/')) {
        const duration = mediaDuration || 0
        const minutes = Math.floor(duration / 60)
        const seconds = duration % 60

        return (
            <div
                ref={containerRef}
                className={`bg-slate-900 dark:bg-slate-950 rounded-lg overflow-hidden max-w-2xl ${
                    isFullscreen ? 'fixed inset-0 z-50' : ''
                }`}
            >
                <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                    <video
                        ref={videoRef}
                        src={mediaUrl}
                        className="absolute top-0 left-0 w-full h-full"
                        onClick={() => setIsPlaying(!isPlaying)}
                        onTimeUpdate={(e) => setCurrentTime(e.target.currentTime)}
                        onPlay={() => setIsPlaying(true)}
                        onPause={() => setIsPlaying(false)}
                    />

                    {/* Video Controls Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-4">
                        {/* Top Controls */}
                        <div className="flex justify-between items-center">
                            <span className="text-white text-sm font-medium">{title}</span>
                            <span className="text-white text-xs bg-black/50 px-2 py-1 rounded">
                                {minutes}:{String(seconds).padStart(2, '0')} / {Math.floor(mediaDuration / 60)}:{String(mediaDuration % 60).padStart(2, '0')}
                            </span>
                        </div>

                        {/* Bottom Controls */}
                        <div className="space-y-2">
                            {/* Progress Bar */}
                            <input
                                type="range"
                                min="0"
                                max={mediaDuration || 100}
                                value={currentTime}
                                onChange={(e) => {
                                    const newTime = parseFloat(e.target.value)
                                    setCurrentTime(newTime)
                                    if (videoRef.current) {
                                        videoRef.current.currentTime = newTime
                                    }
                                }}
                                className="w-full h-1 bg-white/30 rounded-lg appearance-none cursor-pointer accent-blue-600"
                            />

                            {/* Control Buttons */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => {
                                            if (videoRef.current) {
                                                if (isPlaying) {
                                                    videoRef.current.pause()
                                                } else {
                                                    videoRef.current.play()
                                                }
                                                setIsPlaying(!isPlaying)
                                            }
                                        }}
                                        className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition text-white"
                                    >
                                        {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                                    </button>
                                    <button className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition text-white">
                                        <Volume2 size={20} />
                                    </button>
                                </div>
                                <button
                                    onClick={() => setIsFullscreen(!isFullscreen)}
                                    className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition text-white"
                                >
                                    <Maximize size={20} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Play Button Center */}
                    {!isPlaying && (
                        <button
                            onClick={() => {
                                if (videoRef.current) {
                                    videoRef.current.play()
                                    setIsPlaying(true)
                                }
                            }}
                            className="absolute inset-0 flex items-center justify-center group"
                        >
                            <div className="w-16 h-16 bg-white/30 group-hover:bg-white/50 transition rounded-full flex items-center justify-center">
                                <Play size={32} className="text-white ml-1" fill="white" />
                            </div>
                        </button>
                    )}

                    {/* Duration Badge */}
                    {mediaDuration && (
                        <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                            {minutes}:{String(seconds).padStart(2, '0')}
                        </div>
                    )}
                </div>

                {/* Warning if video > 2 minutes */}
                {mediaDuration > 120 && (
                    <div className="bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 p-2 text-xs text-center">
                        ⚠️ This video exceeds the recommended 2-minute limit
                    </div>
                )}
            </div>
        )
    }

    return (
        <div className="bg-slate-100 dark:bg-slate-700 rounded-lg p-4 text-center">
            <p className="text-slate-600 dark:text-slate-400">Unsupported media type: {mediaType}</p>
        </div>
    )
}
