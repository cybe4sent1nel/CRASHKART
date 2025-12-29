'use client'
import { useRef, useEffect, useState } from 'react'
import { Gift, Sparkles, Lock, Share2, Clock, Trash2, CheckCircle, AlertCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import confetti from 'canvas-confetti'
import toast from 'react-hot-toast'
import { getUserCrashCash, addUserCrashCash } from '@/lib/userCrashcashUtils'

export default function ScratchCard({ reward: initialReward, onReveal }) {
    const canvasRef = useRef(null)
    const [revealedReward, setRevealedReward] = useState(null)
    const [savedRewards, setSavedRewards] = useState([])
    const [showSaved, setShowSaved] = useState(false)
    const revealedRef = useRef(false)
    const router = useRouter()

    useEffect(() => {
        const stored = localStorage.getItem('scratchCardRewards')
        if (stored) {
            setSavedRewards(JSON.parse(stored))
        }
    }, [])

    const generateRandomReward = () => {
        const random = Math.random()
        
        // 10% chance of no win (reduced from 30%)
        if (random < 0.1) {
            return {
                type: 'nowin',
                value: null,
                code: null,
                message: 'Better luck next time!',
                expiryDate: null,
                discount: null,
                crashcash: null
            }
        }

        // 50% Discount Offer, 50% CrashCash (total 90% win rate)
        const rewardType = Math.random() < 0.5 ? 'discount' : 'crashcash'
        
        if (rewardType === 'discount') {
            const discountValues = [5, 10, 15, 20, 25]
            const selectedDiscount = discountValues[Math.floor(Math.random() * discountValues.length)]
            const uniqueCode = `CRASH${Date.now().toString().slice(-6).toUpperCase()}`
            
            return {
                type: 'reward',
                rewardType: 'discount',
                crashcash: null,
                discount: selectedDiscount,
                code: uniqueCode,
                expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                orderId: null,
                wonDate: new Date().toLocaleDateString()
            }
        } else {
            const crashcashValues = [50, 75, 100, 125, 150, 200, 250, 300, 500]
            const selectedCrashcash = crashcashValues[Math.floor(Math.random() * crashcashValues.length)]
            
            return {
                type: 'reward',
                rewardType: 'crashcash',
                crashcash: selectedCrashcash,
                discount: null,
                code: null,
                expiryDate: null,
                orderId: null,
                wonDate: new Date().toLocaleDateString()
            }
        }
    }

    const getRandomCrashcashAmount = (minAmount = 5, maxAmount = 50) => {
        // Random amount between min and max
        return Math.floor(Math.random() * (maxAmount - minAmount + 1)) + minAmount
    }

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext('2d', { willReadFrequently: true })
        if (!ctx) return

        canvas.width = 300
        canvas.height = 450

        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
        gradient.addColorStop(0, '#a855f7')
        gradient.addColorStop(0.5, '#9333ea')
        gradient.addColorStop(1, '#7e22ce')
        
        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, canvas.width, canvas.height)
    }, [])

    const handleScratch = (e) => {
        if (revealedRef.current) return

        const canvas = canvasRef.current
        if (!canvas || canvas.width === 0 || canvas.height === 0) return

        const ctx = canvas.getContext('2d', { willReadFrequently: true })
        if (!ctx) return

        const rect = canvas.getBoundingClientRect()
        let x, y

        if (e.touches) {
            x = e.touches[0].clientX - rect.left
            y = e.touches[0].clientY - rect.top
        } else {
            x = e.clientX - rect.left
            y = e.clientY - rect.top
        }

        try {
            ctx.globalCompositeOperation = 'destination-out'
            ctx.beginPath()
            ctx.arc(x, y, 50, 0, Math.PI * 2)
            ctx.fill()

            if (canvas.width > 0 && canvas.height > 0) {
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
                const pixels = imageData.data
                let transparent = 0

                for (let i = 3; i < pixels.length; i += 4) {
                    if (pixels[i] === 0) transparent++
                }

                const percentScratched = (transparent / (pixels.length / 4)) * 100

                if (percentScratched > 20) {
                    revealedRef.current = true
                    const randomReward = generateRandomReward()
                    
                    confetti({
                        particleCount: 150,
                        spread: 100,
                        origin: { y: 0.5 },
                        colors: ['#a855f7', '#9333ea', '#7e22ce', '#ec4899', '#f472b6']
                    })

                    if (randomReward.type !== 'nowin') {
                         // Calculate bonus crashcash for discount rewards
                         let crashcashToAdd = 0
                         let displayMessage = ''
                         
                         if (randomReward.rewardType === 'crashcash') {
                             crashcashToAdd = randomReward.crashcash
                             displayMessage = `₹${crashcashToAdd} CrashCash added to your wallet!`
                         } else {
                             // For discount rewards, also add a random bonus crashcash (5-30)
                             crashcashToAdd = getRandomCrashcashAmount(5, 30)
                             displayMessage = `${randomReward.discount}% Discount Coupon + ₹${crashcashToAdd} CrashCash!`
                         }
                         
                         const rewardWithId = {
                             ...randomReward,
                             id: Date.now(),
                             scratchedAt: new Date().toISOString(),
                             bonusCrashcash: randomReward.rewardType === 'discount' ? crashcashToAdd : 0,
                             expiresAt: randomReward.rewardType === 'discount' 
                                 ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
                                 : null
                         }
                         
                         // Save discount/coupon rewards to separate storage for rewards page
                         if (randomReward.rewardType === 'discount') {
                             const discountRewards = JSON.parse(localStorage.getItem('discountRewards') || '[]')
                             discountRewards.push(rewardWithId)
                             localStorage.setItem('discountRewards', JSON.stringify(discountRewards))
                         }
                         
                         // Keep for backward compatibility and internal tracking
                         const updated = [...savedRewards, rewardWithId]
                         setSavedRewards(updated)
                         localStorage.setItem('scratchCardRewards', JSON.stringify(updated))

                         // Add crash cash to user (per-user storage)
                         const userData = localStorage.getItem('user')
                         if (userData) {
                             try {
                                 const user = JSON.parse(userData)
                                 const email = user.email
                                 if (email) {
                                     addUserCrashCash(email, crashcashToAdd, 30, 'scratch')
                                 }
                             } catch (error) {
                                 console.error('Error adding crash cash:', error)
                             }
                         }
                         
                         localStorage.setItem('lastCrashcashWin', JSON.stringify({
                             amount: crashcashToAdd,
                             date: new Date().toISOString(),
                             code: randomReward.code,
                             discount: randomReward.discount,
                             rewardType: randomReward.rewardType
                         }))
                         
                         // Show correct toast message
                         toast.success(displayMessage, {
                             icon: '🎉',
                             duration: 4000
                         })

                         // Dispatch events to update counter
                         window.dispatchEvent(new Event('storage'))
                         window.dispatchEvent(new Event('crashcash-update'))
                     }

                    setTimeout(() => {
                        setRevealedReward(randomReward)
                    }, 300)
                    
                    onReveal?.(randomReward)
                }
            }
        } catch (err) {
            console.error('Scratch error:', err)
        }
    }

    const deleteSavedReward = (id) => {
        const updated = savedRewards.filter(r => r.id !== id)
        setSavedRewards(updated)
        localStorage.setItem('scratchCardRewards', JSON.stringify(updated))
    }

    const handleUnlock = () => {
        toast.success('Code unlocked! Share with friends to get more cards.', {
            duration: 3000,
        })
    }

    const handleShareWhatsapp = () => {
        const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '₹'
        const message = `I won ${revealedReward.type === 'discount' ? `${revealedReward.value}% discount` : `${currency}${revealedReward.value} cashback`} on CrashKart! Download the app and try your luck too!`
        const whatsappURL = `https://wa.me/?text=${encodeURIComponent(message)}`
        window.open(whatsappURL, '_blank')
        toast.success('Sharing on WhatsApp...', {
            duration: 2000,
        })
    }

    const handleContinueShopping = () => {
        router.push('/')
    }

    if (revealedReward) {
        return (
            <div className="w-full min-h-screen overflow-y-auto">
                {savedRewards.length > 0 && (
                    <div className="w-full px-4 py-3 flex justify-center">
                        <button
                            onClick={() => setShowSaved(!showSaved)}
                            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-4 py-2 rounded-lg transition"
                        >
                            <Clock size={18} />
                            <span>My Rewards ({savedRewards.length})</span>
                        </button>
                    </div>
                )}

                {showSaved && savedRewards.length > 0 && (
                    <div className="w-full px-4 py-3 bg-gradient-to-br from-slate-50 to-slate-100">
                        <h3 className="text-xl font-bold text-slate-900 mb-4">Your Saved Rewards</h3>
                        <div className="grid grid-cols-1 gap-3">
                            {savedRewards.map((saved) => (
                                <div
                                    key={saved.id}
                                    className={`relative bg-gradient-to-br ${
                                        saved.type === 'discount'
                                            ? 'from-purple-400 via-purple-500 to-purple-600'
                                            : 'from-green-400 via-teal-500 to-cyan-600'
                                    } rounded-xl p-3 text-white overflow-hidden`}
                                >
                                    <div className="relative z-10">
                                        <div className="flex justify-between items-start mb-3">
                                             <div>
                                                 <p className="text-xs opacity-90">
                                                     {saved.rewardType === 'discount' ? 'Discount Code' : 'CrashCash Won'}
                                                 </p>
                                                 <p className="text-2xl font-bold">
                                                     {saved.rewardType === 'discount'
                                                         ? `${saved.discount}% OFF`
                                                         : `₹${saved.crashcash}`}
                                                 </p>
                                             </div>
                                            <button
                                                onClick={() => deleteSavedReward(saved.id)}
                                                className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>

                                        {saved.rewardType === 'discount' && (
                                            <div className="bg-white/10 rounded-lg p-2 mb-2">
                                                <p className="text-xs opacity-75 mb-1">Coupon Code</p>
                                                <p className="font-mono font-bold text-xs">{saved.code}</p>
                                            </div>
                                        )}

                                        {saved.rewardType === 'discount' && (
                                             <div className="flex items-center gap-2 text-xs">
                                                 {new Date(saved.expiryDate) < new Date() ? (
                                                     <>
                                                         <AlertCircle size={12} className="text-red-400" />
                                                         <span className="text-red-300">Expired</span>
                                                     </>
                                                 ) : (
                                                     <>
                                                         <Clock size={12} className="text-green-400" />
                                                         <span className="text-green-300">Valid till {new Date(saved.expiryDate).toLocaleDateString()}</span>
                                                     </>
                                                 )}
                                             </div>
                                         )}

                                        <p className="text-xs opacity-75 mt-1">
                                            Scratched: {saved.scratchedAt}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="flex flex-col gap-4 w-full px-4 py-6">
                    <div className="flex flex-col justify-center items-center">
                        <h2 className="text-xl lg:text-2xl font-bold text-slate-900 mb-2">
                            Congratulations!
                        </h2>
                        <p className="text-sm text-slate-600 mb-4 text-center">
                            Here is your Scratch Card
                        </p>
                        
                        <div className="relative w-full max-w-xs bg-gradient-to-br from-purple-400 via-purple-500 to-purple-600 rounded-2xl shadow-2xl overflow-hidden aspect-[3/4] flex items-center justify-center">
                            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                                <div className="absolute top-8 left-8 w-12 h-12 rounded-full bg-purple-700/30"></div>
                                <div className="absolute bottom-12 right-8 w-8 h-8 rounded-full bg-purple-300/20"></div>
                                <div className="absolute top-1/2 left-1/4 w-6 h-6 rounded-full bg-purple-300/10"></div>
                            </div>
                            
                            <div className="relative z-5 text-center pointer-events-none">
                                <Gift className="mx-auto text-white/80 mb-4" size={40} />
                            </div>
                        </div>
                        
                        <p className="text-xs text-slate-600 mt-3 text-center">
                            Reward revealed!
                        </p>
                    </div>

                    <div className="flex flex-col justify-center items-center">
                        {revealedReward.type === 'nowin' ? (
                            <div className="text-center w-full">
                                <div className="mb-4">
                                    <div className="inline-block bg-gradient-to-br from-yellow-200 to-yellow-400 rounded-full p-6 mb-3 shadow-lg">
                                        <Sparkles className="text-yellow-600" size={48} strokeWidth={1.5} />
                                    </div>
                                </div>
                                <p className="text-2xl font-bold text-slate-900 mb-2">
                                    {revealedReward.message}
                                </p>
                                <p className="text-slate-600 mb-4 text-sm">
                                    Don't worry! You have more scratch cards to try.
                                </p>
                            </div>
                        ) : revealedReward.rewardType === 'crashcash' ? (
                            <>
                                <div className="mb-4 text-center">
                                    <div className="inline-block bg-gradient-to-br from-yellow-200 to-orange-200 rounded-full p-6 mb-3 shadow-xl">
                                        <Gift className="text-yellow-500 animate-bounce" size={48} strokeWidth={1} />
                                    </div>
                                    <p className="text-slate-600 font-bold text-base mt-2">You won CrashCash!</p>
                                </div>

                                <div className="text-center mb-4 w-full max-w-sm mx-auto">
                                    <div className="bg-gradient-to-r from-amber-100 to-yellow-100 rounded-2xl p-6">
                                        <img src="/crashcash.ico" alt="CrashCash" className="w-16 h-16 mx-auto mb-3" />
                                        <p className="text-4xl font-bold text-slate-900 mb-2">
                                            ₹{revealedReward.crashcash}
                                        </p>
                                        <p className="text-lg text-slate-600 font-semibold mb-1">
                                            CrashCash Won!
                                        </p>
                                        <p className="text-sm text-slate-600">
                                            Will be credited to your wallet
                                        </p>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="mb-4 text-center">
                                    <div className="inline-block bg-gradient-to-br from-yellow-200 to-orange-200 rounded-full p-6 mb-3 shadow-xl">
                                        <Gift className="text-yellow-500 animate-bounce" size={48} strokeWidth={1} />
                                    </div>
                                    <p className="text-slate-600 font-bold text-base mt-2">You won a Discount!</p>
                                </div>

                                <div className="text-center mb-4 w-full max-w-sm mx-auto">
                                    <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl p-6">
                                        <p className="text-xs text-slate-600 font-semibold mb-2">Discount Offer</p>
                                        <p className="text-4xl font-bold text-slate-900 mb-3">
                                            {revealedReward.discount}% OFF
                                        </p>
                                        <div className="bg-white/60 rounded p-3 mb-3">
                                            <p className="text-xs text-slate-600 mb-1">Coupon Code</p>
                                            <p className="font-mono font-bold text-base text-slate-800">{revealedReward.code}</p>
                                        </div>
                                        <p className="text-sm text-slate-600">
                                            Valid till {new Date(revealedReward.expiryDate).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            </>
                        )}

                        <div className="w-full h-px bg-slate-200 my-3"></div>

                        <div className="w-full">
                            <p className="text-xs text-slate-600 text-center mb-3 font-medium">
                                Invite Friends, Get Bonus Scratch Cards
                            </p>
                            
                            <div className="flex gap-2 mb-3 max-w-md mx-auto">
                                <button onClick={handleUnlock} className="flex-1 flex items-center justify-center gap-2 bg-purple-400 hover:bg-purple-500 text-white px-3 py-2 rounded-lg transition text-xs">
                                    <Lock size={14} />
                                    <span className="font-medium">Unlock</span>
                                </button>
                                <button onClick={handleShareWhatsapp} className="flex-1 flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-3 py-2 rounded-lg transition text-xs">
                                    <Share2 size={14} />
                                    <span className="font-medium">Share WhatsApp</span>
                                </button>
                            </div>

                            <p className="text-xs text-slate-500 text-center mb-2">
                                Download the CrashKart app & a chance to win
                                <br />
                                iPhone 7, Vouchers & Rewards
                            </p>

                            <div className="flex gap-2 justify-center mb-3 max-w-md mx-auto">
                                <button className="bg-slate-900 hover:bg-slate-800 text-white px-3 py-1 rounded text-xs flex items-center gap-1 transition">
                                    <span>▶</span> Google Play
                                </button>
                                <button className="bg-slate-900 hover:bg-slate-800 text-white px-3 py-1 rounded text-xs flex items-center gap-1 transition">
                                    <span>▶</span> App Store
                                </button>
                            </div>

                            <button onClick={handleContinueShopping} className="max-w-md mx-auto block bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-4 py-2 rounded-lg transition font-semibold text-sm">
                                Continue Shopping
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="w-full min-h-screen overflow-y-auto">
            {savedRewards.length > 0 && (
                <div className="w-full px-4 py-3 flex justify-center">
                    <button
                        onClick={() => setShowSaved(!showSaved)}
                        className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-4 py-2 rounded-lg transition"
                    >
                        <Clock size={18} />
                        <span>My Rewards ({savedRewards.length})</span>
                    </button>
                </div>
            )}

            {showSaved && savedRewards.length > 0 && (
                <div className="w-full px-4 py-3 bg-gradient-to-br from-slate-50 to-slate-100">
                    <h3 className="text-xl font-bold text-slate-900 mb-4">Your Saved Rewards</h3>
                    <div className="grid grid-cols-1 gap-3">
                        {savedRewards.map((saved) => (
                            <div
                                key={saved.id}
                                className={`relative bg-gradient-to-br ${
                                    saved.type === 'discount'
                                        ? 'from-purple-400 via-purple-500 to-purple-600'
                                        : 'from-green-400 via-teal-500 to-cyan-600'
                                } rounded-xl p-3 text-white overflow-hidden`}
                            >
                                <div className="relative z-10">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex-1">
                                            {saved.rewardType === 'crashcash' ? (
                                                <div>
                                                    <p className="text-xs opacity-90">CrashCash Won</p>
                                                    <p className="text-2xl font-bold">₹{saved.crashcash}</p>
                                                </div>
                                            ) : (
                                                <div>
                                                    <p className="text-xs opacity-90">Discount Offer</p>
                                                    <p className="text-2xl font-bold">{saved.discount}% OFF</p>
                                                </div>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => deleteSavedReward(saved.id)}
                                            className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>



                                    {saved.rewardType === 'discount' && (
                                        <div className="bg-white/10 rounded p-2 mb-2">
                                            <p className="text-xs opacity-75 mb-1">Coupon Code</p>
                                            <p className="font-mono font-bold text-sm">{saved.code}</p>
                                        </div>
                                    )}

                                    <div className="flex items-center gap-2 text-xs">
                                        <Clock size={12} />
                                        <span>
                                            {new Date(saved.expiryDate) < new Date()
                                                ? 'Expired'
                                                : `Expires: ${new Date(saved.expiryDate).toLocaleDateString()}`
                                            }
                                        </span>
                                    </div>

                                    <p className="text-xs opacity-75 mt-1">
                                        Scratched: {saved.scratchedAt}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="flex flex-col gap-4 w-full px-4 py-6">
                <div className="flex flex-col justify-center items-center">
                    <h2 className="text-xl font-bold text-slate-900 mb-2">Congratulations!</h2>
                    <p className="text-sm text-slate-600 mb-4 text-center">Here is your Scratch Card</p>
                    
                    <div className="relative w-full max-w-xs bg-gradient-to-br from-purple-400 via-purple-500 to-purple-600 rounded-2xl shadow-2xl overflow-hidden aspect-[3/4] flex items-center justify-center">
                        <div className="absolute inset-0 overflow-hidden pointer-events-none">
                            <div className="absolute top-8 left-8 w-12 h-12 rounded-full bg-purple-700/30"></div>
                            <div className="absolute bottom-12 right-8 w-8 h-8 rounded-full bg-purple-300/20"></div>
                            <div className="absolute top-1/2 left-1/4 w-6 h-6 rounded-full bg-purple-300/10"></div>
                        </div>
                        
                        <div className="relative z-5 text-center pointer-events-none">
                            <Gift className="mx-auto text-white/80 mb-4" size={40} />
                        </div>

                        <canvas
                            ref={canvasRef}
                            className="absolute inset-0 cursor-pointer z-10 touch-none"
                            onMouseMove={handleScratch}
                            onTouchMove={(e) => {
                                e.preventDefault()
                                handleScratch(e)
                            }}
                            style={{ 
                                touchAction: 'none',
                                width: '100%',
                                height: '100%',
                                display: 'block'
                            }}
                        />
                    </div>
                    
                    <p className="text-xs text-slate-600 mt-3 text-center">
                        Swipe or click to scratch the card
                    </p>
                </div>
            </div>
        </div>
    )
}
