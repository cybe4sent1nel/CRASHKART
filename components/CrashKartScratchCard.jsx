'use client'
import { useRef, useEffect, useState } from 'react'
import { Gift, Sparkles, X, ChevronRight, Coins } from 'lucide-react'
import confetti from 'canvas-confetti'
import toast from 'react-hot-toast'

export default function CrashKartScratchCard({ onReveal, onClose, orderId }) {
    const canvasRef = useRef(null)
    const [isScratching, setIsScratching] = useState(false)
    const [isRevealed, setIsRevealed] = useState(false)
    const [reward, setReward] = useState(null)
    const [scratchPercentage, setScratchPercentage] = useState(0)
    const revealedRef = useRef(false)
    const rewardClaimedRef = useRef(false)
    const processingRef = useRef(false) // Prevent concurrent processing
    const scratchSessionId = useRef(`scratch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`)

    const generateReward = () => {
        const random = Math.random()
        
        if (random < 0.15) {
            // 15% Better luck
            return {
                type: 'better-luck',
                title: 'Better luck next time!',
                message: 'Keep shopping for more chances to win',
                color: 'from-slate-400 to-slate-500'
            }
        } else if (random < 0.50) {
            // 35% CrashCash
            const amounts = [10, 25, 50, 75, 100, 150, 200]
            const amount = amounts[Math.floor(Math.random() * amounts.length)]
            return {
                type: 'crashcash',
                title: `₹${amount} CrashCash`,
                message: 'Added to your wallet!',
                amount,
                color: 'from-orange-400 to-yellow-500',
                icon: '💰'
            }
        } else if (random < 0.85) {
            // 35% Discount
            const discounts = [5, 10, 15, 20, 25, 30]
            const discount = discounts[Math.floor(Math.random() * discounts.length)]
            const code = `SCRATCH${Math.random().toString(36).substr(2, 6).toUpperCase()}`
            return {
                type: 'discount',
                title: `${discount}% OFF`,
                message: 'Use on your next order',
                discount,
                code,
                color: 'from-blue-400 to-purple-500',
                icon: '🎁'
            }
        } else {
            // 15% Product-specific discount
            const discounts = [100, 150, 200, 300]
            const discount = discounts[Math.floor(Math.random() * discounts.length)]
            return {
                type: 'product-discount',
                title: `₹${discount} OFF`,
                message: 'On Electronics category',
                discount,
                category: 'Electronics',
                color: 'from-green-400 to-emerald-500',
                icon: '🛍️'
            }
        }
    }

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext('2d', { willReadFrequently: true })
        if (!ctx) return

        canvas.width = 350
        canvas.height = 500

        // CrashKart signature gradient background with texture
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
        gradient.addColorStop(0, '#4285f4')
        gradient.addColorStop(0.3, '#5b9cf5')
        gradient.addColorStop(0.5, '#34a853')
        gradient.addColorStop(0.7, '#66bb6a')
        gradient.addColorStop(1, '#fbbc05')
        
        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        // Add shimmer effect overlay
        ctx.globalAlpha = 0.3
        const shimmer = ctx.createLinearGradient(0, 0, canvas.width, 0)
        shimmer.addColorStop(0, 'rgba(255, 255, 255, 0)')
        shimmer.addColorStop(0.5, 'rgba(255, 255, 255, 0.6)')
        shimmer.addColorStop(1, 'rgba(255, 255, 255, 0)')
        ctx.fillStyle = shimmer
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.globalAlpha = 1

        // Add sparkle overlay pattern
        ctx.globalAlpha = 0.4
        for (let i = 0; i < 80; i++) {
            ctx.beginPath()
            const x = Math.random() * canvas.width
            const y = Math.random() * canvas.height
            const size = Math.random() * 4 + 1
            ctx.arc(x, y, size, 0, Math.PI * 2)
            ctx.fillStyle = 'white'
            ctx.fill()
        }
        ctx.globalAlpha = 1

        // Text with glow effect
        ctx.shadowBlur = 10
        ctx.shadowColor = 'rgba(255, 255, 255, 0.8)'
        ctx.fillStyle = 'white'
        ctx.font = 'bold 30px Arial'
        ctx.textAlign = 'center'
        ctx.fillText('🎁', canvas.width / 2, canvas.height / 2 - 60)
        ctx.font = 'bold 24px Arial'
        ctx.fillText('Scratch to reveal', canvas.width / 2, canvas.height / 2)
        ctx.font = '18px Arial'
        ctx.fillText('your reward!', canvas.width / 2, canvas.height / 2 + 40)
        ctx.shadowBlur = 0
    }, [])

    const calculateScratchPercentage = (canvas, ctx) => {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const pixels = imageData.data
        let transparentPixels = 0

        for (let i = 3; i < pixels.length; i += 4) {
            if (pixels[i] < 128) {
                transparentPixels++
            }
        }

        const totalPixels = pixels.length / 4
        return (transparentPixels / totalPixels) * 100
    }

    const handleScratch = (e) => {
        // CRITICAL: Exit immediately if already revealed or processing
        if (revealedRef.current || processingRef.current) return

        const canvas = canvasRef.current
        const ctx = canvas.getContext('2d', { willReadFrequently: true })
        const rect = canvas.getBoundingClientRect()

        let clientX, clientY

        if (e.type === 'touchmove') {
            clientX = e.touches[0].clientX
            clientY = e.touches[0].clientY
        } else {
            clientX = e.clientX
            clientY = e.clientY
        }

        const x = clientX - rect.left
        const y = clientY - rect.top

        ctx.globalCompositeOperation = 'destination-out'
        
        // Enhanced scratch effect with gradient and glow
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, 30)
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)')
        gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.8)')
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0.3)')
        
        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(x, y, 30, 0, Math.PI * 2) // Larger brush for smoother feel
        ctx.fill()
        
        // Add smaller center for precision
        ctx.beginPath()
        ctx.arc(x, y, 20, 0, Math.PI * 2)
        ctx.fill()

        const percentage = calculateScratchPercentage(canvas, ctx)
        setScratchPercentage(percentage)

        // CRITICAL: Atomic check-and-set to prevent ANY race conditions
        if (percentage > 60) {
            // Set processing flag FIRST - blocks ALL subsequent calls
            if (processingRef.current) return
            processingRef.current = true
            
            // Double-check revealedRef hasn't been set by another thread
            if (revealedRef.current) {
                processingRef.current = false
                return
            }
            
            // Now set revealed flag
            revealedRef.current = true
            
            const generatedReward = generateReward()
            setReward(generatedReward)
            setIsRevealed(true)
            
            // Trigger confetti for wins
            if (generatedReward.type !== 'better-luck') {
                confetti({
                    particleCount: 100,
                    spread: 70,
                    origin: { y: 0.6 }
                })
                
                // Show toast and add to wallet (CRITICAL: Check AND set flag BEFORE async call)
                if (generatedReward.type === 'crashcash') {
                    if (!rewardClaimedRef.current) {
                        console.log('🎯 Claiming CrashCash reward:', generatedReward.amount)
                        toast.success(`🎉 You won ₹${generatedReward.amount} CrashCash!`)
                        // Call the API (it will set rewardClaimedRef inside)
                        addCrashCashToWallet(generatedReward.amount)
                    } else {
                        console.log('⚠️ Duplicate scratch detected at claim check, blocked')
                    }
                } else if (generatedReward.type === 'discount') {
                    toast.success(`🎉 You won ${generatedReward.discount}% discount!`)
                } else if (generatedReward.type === 'product-discount') {
                    toast.success(`🎉 You won ₹${generatedReward.discount} off!`)
                }
            }

            if (onReveal) {
                onReveal(generatedReward)
            }
        }
    }

    const addCrashCashToWallet = async (amount) => {
        // ULTIMATE GUARD: Check and set flag atomically
        if (rewardClaimedRef.current) {
            console.log('⚠️ addCrashCashToWallet called but reward already claimed, aborting')
            return
        }
        
        // Set flag IMMEDIATELY to block any other calls
        rewardClaimedRef.current = true
        
        try {
            const token = localStorage.getItem('token')
            const user = JSON.parse(localStorage.getItem('user') || '{}')
            
            console.log('🎯 Adding CrashCash from scratch card:', amount, 'sessionId:', scratchSessionId.current)
            
            const response = await fetch('/api/crashcash/add', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                credentials: 'include',
                body: JSON.stringify({ 
                    amount, 
                    source: 'scratch_card',
                    scratchSessionId: scratchSessionId.current,
                    orderId: orderId || null
                })
            })

            if (response.ok) {
                const data = await response.json()
                console.log('✅ Scratch card CrashCash added:', data)
                
                // Update local storage snapshot for quick UI
                user.crashCashBalance = data.newBalance
                localStorage.setItem('user', JSON.stringify(user))
                localStorage.setItem('lastCrashcashWin', JSON.stringify({ amount, date: new Date().toISOString() }))
                
                // Dispatch events to update UI
                window.dispatchEvent(new Event('crashcash-update'))
                window.dispatchEvent(new CustomEvent('crashcash-added', { detail: { amount, newBalance: data.newBalance } }))
            } else {
                const error = await response.json()
                console.error('❌ Failed to add scratch card CrashCash:', error)
                // If it's a duplicate error, just ignore it silently
                if (!error.message?.includes('already claimed')) {
                    toast.error('Failed to add reward. Please contact support.')
                }
            }
        } catch (error) {
            console.error('❌ Error adding CrashCash:', error)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-scaleIn">
                {/* Header */}
                <div className="relative bg-gradient-to-r from-blue-500 via-green-500 to-yellow-500 p-6 text-white">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition"
                    >
                        <X size={20} />
                    </button>
                    <div className="text-center">
                        <Gift className="w-12 h-12 mx-auto mb-2" />
                        <h2 className="text-2xl font-bold">Scratch & Win!</h2>
                        <p className="text-sm opacity-90 mt-1">You have a chance to win amazing rewards</p>
                    </div>
                </div>

                {/* Scratch Area */}
                <div className="p-6">
                    {/* Progress Bar */}
                    {!isRevealed && (
                        <div className="mb-4">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-medium text-slate-600">✨ Scratch Progress</span>
                                <span className="text-sm font-bold text-blue-600">{scratchPercentage.toFixed(0)}%</span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden shadow-inner">
                                <div 
                                    className="bg-gradient-to-r from-blue-500 via-green-500 to-yellow-500 h-full transition-all duration-300 ease-out rounded-full shadow-lg"
                                    style={{ width: `${scratchPercentage}%` }}
                                >
                                    <div className="w-full h-full bg-white/30 animate-pulse" />
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {!isRevealed ? (
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className={`w-[350px] h-[500px] rounded-2xl bg-gradient-to-br ${reward?.color || 'from-slate-200 to-slate-300'} flex flex-col items-center justify-center p-8 shadow-lg`}>
                                    {reward && (
                                        <>
                                            <div className="text-6xl mb-4">{reward.icon}</div>
                                            <h3 className="text-4xl font-bold text-white mb-2 text-center drop-shadow-lg">
                                                {reward.title}
                                            </h3>
                                            <p className="text-white text-lg text-center drop-shadow">
                                                {reward.message}
                                            </p>
                                            {reward.code && (
                                                <div className="mt-6 bg-white/20 backdrop-blur px-6 py-3 rounded-lg">
                                                    <p className="text-white text-sm mb-1">Code:</p>
                                                    <p className="text-white text-xl font-bold tracking-wider">{reward.code}</p>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                            <canvas
                                ref={canvasRef}
                                onMouseDown={() => setIsScratching(true)}
                                onMouseUp={() => setIsScratching(false)}
                                onMouseMove={(e) => isScratching && handleScratch(e)}
                                onTouchStart={() => setIsScratching(true)}
                                onTouchEnd={() => setIsScratching(false)}
                                onTouchMove={(e) => isScratching && handleScratch(e)}
                                className="rounded-2xl shadow-2xl cursor-pointer relative z-10"
                                style={{ width: '350px', height: '500px' }}
                            />
                        </div>
                    ) : (
                        <div className={`w-full h-[500px] rounded-2xl bg-gradient-to-br ${reward.color} flex flex-col items-center justify-center p-8 shadow-2xl animate-scaleIn`}>
                            <div className="text-7xl mb-6 animate-bounce">{reward.icon || (reward.type === 'better-luck' ? '😔' : '🎉')}</div>
                            <h3 className="text-5xl font-bold text-white mb-4 text-center drop-shadow-lg">
                                {reward.title}
                            </h3>
                            <p className="text-white text-xl text-center drop-shadow mb-6">
                                {reward.message}
                            </p>
                            {reward.code && (
                                <div className="mt-4 bg-white/30 backdrop-blur px-8 py-4 rounded-xl">
                                    <p className="text-white text-sm mb-2 text-center">Use Code:</p>
                                    <p className="text-white text-2xl font-bold tracking-wider text-center">{reward.code}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Progress Indicator */}
                    {!isRevealed && scratchPercentage > 0 && (
                        <div className="mt-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-slate-600 dark:text-slate-400">Scratch Progress</span>
                                <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">{Math.round(scratchPercentage)}%</span>
                            </div>
                            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-300"
                                    style={{ width: `${Math.min(scratchPercentage, 100)}%` }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Action Button */}
                    {isRevealed && (
                        <button
                            onClick={onClose}
                            className="w-full mt-6 px-6 py-4 bg-gradient-to-r from-blue-500 to-green-500 text-white font-bold rounded-xl hover:from-blue-600 hover:to-green-600 transition shadow-lg flex items-center justify-center gap-2"
                        >
                            Continue Shopping
                            <ChevronRight size={20} />
                        </button>
                    )}
                </div>
            </div>

            <style jsx>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes scaleIn {
                    from { transform: scale(0.9); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.3s ease-out;
                }
                .animate-scaleIn {
                    animation: scaleIn 0.4s ease-out;
                }
            `}</style>
        </div>
    )
}
