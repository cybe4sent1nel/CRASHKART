'use client'
import { useRef, useEffect, useState, useMemo } from 'react'
import { Gift, Sparkles, Lock, Share2, Clock, Trash2, CheckCircle, AlertCircle, Frown } from 'lucide-react'
import { useRouter } from 'next/navigation'
import confetti from 'canvas-confetti'
import toast from 'react-hot-toast'
import { getUserCrashCash } from '@/lib/userCrashcashUtils'

export default function ScratchCard({ reward: initialReward, onReveal }) {
    const canvasRef = useRef(null)
    const [revealedReward, setRevealedReward] = useState(null)
    const [savedRewards, setSavedRewards] = useState([])
    const [showSaved, setShowSaved] = useState(false)
    const revealedRef = useRef(false)
    const router = useRouter()

    const themes = useMemo(() => ([
        { name: 'sunrise', start: '#ff9a9e', mid: '#fad0c4', end: '#fcb69f', confetti: ['#ff9a9e', '#fad0c4', '#fcb69f', '#ffe29f'] },
        { name: 'aurora', start: '#a1c4fd', mid: '#c2e9fb', end: '#6dd5ed', confetti: ['#a1c4fd', '#6dd5ed', '#2193b0', '#bfe9ff'] },
        { name: 'citrus', start: '#f6d365', mid: '#fda085', end: '#ff9f1c', confetti: ['#f6d365', '#fda085', '#ff9f1c', '#ffd166'] },
        { name: 'twilight', start: '#a18cd1', mid: '#fbc2eb', end: '#8ec5fc', confetti: ['#a18cd1', '#fbc2eb', '#8ec5fc', '#e0c3fc'] },
        { name: 'forest', start: '#11998e', mid: '#38ef7d', end: '#56ab2f', confetti: ['#11998e', '#38ef7d', '#56ab2f', '#a8e063'] }
    ]), [])
    
    // Fix hydration mismatch - generate theme on client side only
    const [theme, setTheme] = useState(themes[0])
    const [cardGradient, setCardGradient] = useState(`linear-gradient(135deg, ${themes[0].start}, ${themes[0].mid}, ${themes[0].end})`)

    useEffect(() => {
        // Generate random theme on client only (fix hydration)
        const selectedTheme = themes[Math.floor(Math.random() * themes.length)]
        setTheme(selectedTheme)
        setCardGradient(`linear-gradient(135deg, ${selectedTheme.start}, ${selectedTheme.mid}, ${selectedTheme.end})`)
        
        const stored = localStorage.getItem('scratchCardRewards')
        if (stored) {
            setSavedRewards(JSON.parse(stored))
        }
        
        // ✅ REMOVED: No longer auto-restore scratched cards
        // Let user scratch fresh every time they visit the page
    }, [themes])

    const generateRandomReward = () => {
        const random = Math.random()
        if (random < 0.08) {
            return { type: 'nowin', value: null, code: null, message: 'Better luck next time!', expiryDate: null, discount: null, crashcash: null }
        }

        const rewardPool = [
            { rewardType: 'discount', discount: 12, bonusCrashcash: 25 },
            { rewardType: 'discount', discount: 18, bonusCrashcash: 40 },
            { rewardType: 'discount', discount: 25, bonusCrashcash: 60 },
            { rewardType: 'crashcash', crashcash: 120 },
            { rewardType: 'crashcash', crashcash: 180 },
            { rewardType: 'crashcash', crashcash: 240 },
            { rewardType: 'crashcash', crashcash: 360 },
            { rewardType: 'discount', discount: 30, bonusCrashcash: 80 },
            { rewardType: 'discount', discount: 10, bonusCrashcash: 20 },
            { rewardType: 'crashcash', crashcash: 500 }
        ]

        const pick = rewardPool[Math.floor(Math.random() * rewardPool.length)]
        const uniqueCode = `CRASH${Date.now().toString().slice(-6).toUpperCase()}`
        const base = {
            type: 'reward',
            code: pick.rewardType === 'discount' ? uniqueCode : null,
            orderId: null,
            wonDate: new Date().toLocaleDateString()
        }

        if (pick.rewardType === 'discount') {
            return { ...base, rewardType: 'discount', crashcash: null, discount: pick.discount, bonusCrashcash: pick.bonusCrashcash || 0, expiryDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000) }
        }

        return { ...base, rewardType: 'crashcash', crashcash: pick.crashcash, discount: null, bonusCrashcash: pick.crashcash, expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) }
    }

    const getRandomCrashcashAmount = (minAmount = 5, maxAmount = 50) => {
        // Random amount between min and max
        return Math.floor(Math.random() * (maxAmount - minAmount + 1)) + minAmount
    }

    useEffect(() => {
        // Always draw scratch layer when component mounts
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext('2d', { willReadFrequently: true })
        if (!ctx) return

        canvas.width = 300
        canvas.height = 450

        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
        gradient.addColorStop(0, theme.start)
        gradient.addColorStop(0.5, theme.mid)
        gradient.addColorStop(1, theme.end)
        
        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, canvas.width, canvas.height)
    }, [theme])

    const handleScratch = async (e) => {
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
                    
                    // 🎉 Always trigger confetti for all rewards (even nowin gets gentle effect)
                    if (randomReward.type !== 'nowin') {
                        confetti({
                            particleCount: 150,
                            spread: 100,
                            origin: { y: 0.5 },
                            colors: theme.confetti
                        })
                    } else {
                        // Gentle confetti for no-win too
                        confetti({
                            particleCount: 50,
                            spread: 60,
                            origin: { y: 0.5 },
                            colors: ['#94a3b8', '#cbd5e1']
                        })
                    }

                    if (randomReward.type !== 'nowin') {
                         // Calculate bonus crashcash for discount rewards
                         let crashcashToAdd = 0
                         let displayMessage = ''
                         
                         if (randomReward.rewardType === 'crashcash') {
                             crashcashToAdd = randomReward.crashcash
                             displayMessage = `₹${crashcashToAdd} CrashCash added to your wallet!`
                         } else {
                             crashcashToAdd = randomReward.bonusCrashcash || getRandomCrashcashAmount(5, 30)
                             displayMessage = `${randomReward.discount}% Discount Coupon + ₹${crashcashToAdd} CrashCash!`
                         }
                         
                        const thirtyDaysISO = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
                        const fifteenDaysISO = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString()
                        const rewardWithId = {
                            ...randomReward,
                            id: Date.now(),
                            scratchedAt: new Date().toISOString(),
                            bonusCrashcash: randomReward.rewardType === 'discount' ? crashcashToAdd : randomReward.bonusCrashcash || crashcashToAdd,
                            expiresAt: randomReward.rewardType === 'discount' ? fifteenDaysISO : thirtyDaysISO
                        }

                        const discountRewards = JSON.parse(localStorage.getItem('discountRewards') || '[]')
                        discountRewards.push({
                            id: rewardWithId.id,
                            rewardType: rewardWithId.rewardType,
                            discount: rewardWithId.discount,
                            code: rewardWithId.code,
                            amount: rewardWithId.crashcash || rewardWithId.bonusCrashcash || 0,
                            bonusCrashcash: rewardWithId.bonusCrashcash || 0,
                            scratchedAt: rewardWithId.scratchedAt,
                            earnedAt: rewardWithId.scratchedAt,
                            expiresAt: rewardWithId.expiresAt,
                            status: 'active'
                        })
                        localStorage.setItem('discountRewards', JSON.stringify(discountRewards))
                         
                         // Keep for backward compatibility and internal tracking
                         const updated = [...savedRewards, rewardWithId]
                         setSavedRewards(updated)
                         localStorage.setItem('scratchCardRewards', JSON.stringify(updated))

                         // Save rewards to database based on type
                         try {
                             if (randomReward.rewardType === 'discount') {
                                 console.log('💾 Saving discount coupon:', {
                                     code: randomReward.code,
                                     discount: randomReward.discount,
                                     bonusCrashcash: randomReward.bonusCrashcash,
                                     expiryDate: randomReward.expiryDate
                                 })
                                 
                                 // Save discount coupon to database
                                 const couponResp = await fetch('/api/scratchcard', {
                                     method: 'POST',
                                     credentials: 'include',
                                     headers: { 'Content-Type': 'application/json' },
                                     body: JSON.stringify({
                                         rewardType: 'discount',
                                         rewardValue: randomReward.discount,
                                         rewardCode: randomReward.code,
                                         expiresAt: randomReward.expiryDate
                                     })
                                 })
                                 
                                 if (!couponResp.ok) {
                                     console.warn(`⚠️ Failed to save coupon to database (Status: ${couponResp.status}). Coupon saved locally only.`)
                                     const errorData = await couponResp.json().catch(() => ({}))
                                     console.error('API Error:', errorData.message || 'Unknown error')
                                 } else {
                                     const couponData = await couponResp.json()
                                     if (couponData.success) {
                                         console.log('✅ Discount coupon saved to database')
                                     } else {
                                         console.warn('⚠️ Coupon saved locally. Database save may have failed:', couponData.message || 'No error message')
                                     }
                                 }
                                 
                                 // If there's bonus CrashCash with discount, add it
                                 if (randomReward.bonusCrashcash && randomReward.bonusCrashcash > 0) {
                                     console.log('💰 Adding bonus CrashCash:', randomReward.bonusCrashcash)
                                     
                                     // ✅ IMMEDIATELY update localStorage balance (works even if not logged in)
                                     try {
                                         const currentBalance = parseInt(localStorage.getItem('crashCashBalance') || '0')
                                         const newBalance = currentBalance + randomReward.bonusCrashcash
                                         localStorage.setItem('crashCashBalance', newBalance.toString())
                                         console.log(`✅ Bonus CrashCash added to localStorage: ₹${randomReward.bonusCrashcash} (New balance: ₹${newBalance})`)
                                         window.dispatchEvent(new Event('crashcash-update'))
                                         window.dispatchEvent(new Event('storage'))
                                     } catch (e) {
                                         console.error('❌ Failed to update localStorage balance:', e)
                                     }
                                     
                                     // Try to sync with database (if user is logged in)
                                     try {
                                         const token = localStorage.getItem('token')
                                         const headers = {
                                             'Content-Type': 'application/json',
                                             ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                                         }
                                         
                                         const bonusResp = await fetch('/api/crashcash/add', {
                                             method: 'POST',
                                             credentials: 'include',
                                             headers,
                                             body: JSON.stringify({
                                                 amount: randomReward.bonusCrashcash,
                                                 source: 'scratch_card_bonus',
                                                 orderId: null
                                             })
                                         })
                                         
                                         if (bonusResp.ok) {
                                             const bonusData = await bonusResp.json()
                                             if (bonusData.success) {
                                                 console.log('✅ Bonus CrashCash synced to database')
                                             }
                                         } else {
                                             console.warn(`⚠️ Could not sync to database (Status: ${bonusResp.status}). Balance saved locally.`)
                                         }
                                     } catch (apiError) {
                                         console.warn('⚠️ Database sync failed, but balance saved locally:', apiError.message)
                                     }
                                 }
                             } else if (randomReward.rewardType === 'crashcash' && crashcashToAdd > 0) {
                                 console.log('💰 Adding CrashCash:', crashcashToAdd)
                                 
                                 // ✅ IMMEDIATELY update localStorage balance (works even if not logged in)
                                 try {
                                     const currentBalance = parseInt(localStorage.getItem('crashCashBalance') || '0')
                                     const newBalance = currentBalance + crashcashToAdd
                                     localStorage.setItem('crashCashBalance', newBalance.toString())
                                     console.log(`✅ CrashCash added to localStorage: ₹${crashcashToAdd} (New balance: ₹${newBalance})`)
                                     window.dispatchEvent(new Event('crashcash-update'))
                                     window.dispatchEvent(new Event('storage'))
                                 } catch (e) {
                                     console.error('❌ Failed to update localStorage balance:', e)
                                 }
                                 
                                 // Try to sync with database (if user is logged in)
                                 try {
                                     const token = localStorage.getItem('token')
                                     const headers = {
                                         'Content-Type': 'application/json',
                                         ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                                     }
                                     
                                     const resp = await fetch('/api/crashcash/add', {
                                         method: 'POST',
                                         credentials: 'include',
                                         headers,
                                         body: JSON.stringify({
                                             amount: crashcashToAdd,
                                             source: 'scratch_card',
                                             orderId: null
                                         })
                                     })
                                     
                                     if (resp.ok) {
                                         const data = await resp.json()
                                         if (data.success) {
                                             console.log('✅ CrashCash synced to database, server balance:', data.newBalance)
                                         }
                                     } else {
                                         console.warn(`⚠️ Could not sync to database (Status: ${resp.status}). Balance saved locally.`)
                                     }
                                 } catch (apiError) {
                                     console.warn('⚠️ Database sync failed, but balance saved locally:', apiError.message)
                                 }
                             }
                         } catch (e) {
                             console.error('❌ Error saving reward to database:', e)
                             console.log('💾 Reward still saved to localStorage for user access')
                         }
                         
                         // Store complete reward details for restoration on page refresh
                         localStorage.setItem('lastCrashcashWin', JSON.stringify({
                             type: randomReward.type,
                             rewardType: randomReward.rewardType,
                             crashcash: randomReward.crashcash,
                             discount: randomReward.discount,
                             bonusCrashcash: randomReward.bonusCrashcash,
                             code: randomReward.code,
                             expiryDate: randomReward.expiryDate,
                             message: randomReward.message,
                             date: new Date().toISOString()
                         }))
                         
                         // 🛡️ Store timestamp for analytics
                         localStorage.setItem('lastScratchCardRedeemed', Date.now().toString())
                         
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
        const toDelete = savedRewards.find(r => r.id === id)
        const updated = savedRewards.filter(r => r.id !== id)
        setSavedRewards(updated)
        localStorage.setItem('scratchCardRewards', JSON.stringify(updated))

        // Keep a deletion history for audit / user support
        try {
            const histKey = 'scratchCardDeleteHistory'
            const existingHist = JSON.parse(localStorage.getItem(histKey) || '[]')
            existingHist.push({ id, deletedAt: new Date().toISOString(), reward: toDelete || null })
            localStorage.setItem(histKey, JSON.stringify(existingHist))
        } catch (e) {
            console.warn('Failed writing scratch delete history', e)
        }
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
                            Reward Revealed!
                        </h2>
                        <p className="text-sm text-slate-600 mb-4 text-center">
                            Here's what you won
                        </p>
                    </div>

                    <div className="flex flex-col justify-center items-center">
                        {revealedReward.type === 'nowin' ? (
                            <div className="text-center w-full">
                                <div className="mb-4">
                                    <div className="inline-block bg-gradient-to-br from-slate-200 to-slate-300 rounded-full p-8 mb-3 shadow-lg">
                                        <Frown className="text-slate-600" size={64} strokeWidth={1.5} />
                                    </div>
                                </div>
                                <p className="text-2xl font-bold text-slate-900 mb-2">
                                    Better luck next time!
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
                                            ₹{revealedReward.crashcash || 0}
                                        </p>
                                        <p className="text-lg text-slate-600 font-semibold mb-1">
                                            CrashCash Won!
                                        </p>
                                        <p className="text-sm text-slate-600">
                                            Credited to your wallet
                                        </p>
                                    </div>
                                </div>
                            </>
                        ) : revealedReward.rewardType === 'discount' ? (
                            <>
                                <div className="mb-4 text-center">
                                    <div className="inline-block bg-gradient-to-br from-purple-200 to-pink-200 rounded-full p-6 mb-3 shadow-xl">
                                        <Gift className="text-purple-600 animate-bounce" size={48} strokeWidth={1} />
                                    </div>
                                    <p className="text-slate-600 font-bold text-base mt-2">You won a Discount!</p>
                                </div>

                                <div className="text-center mb-4 w-full max-w-sm mx-auto">
                                    <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl p-6">
                                        <p className="text-xs text-slate-600 font-semibold mb-2">Discount Offer</p>
                                        <p className="text-4xl font-bold text-slate-900 mb-3">
                                            {revealedReward.discount || 0}% OFF
                                        </p>
                                        <div className="bg-white/60 rounded p-3 mb-3">
                                            <p className="text-xs text-slate-600 mb-1">Coupon Code</p>
                                            <p className="font-mono font-bold text-base text-slate-800">{revealedReward.code || 'N/A'}</p>
                                        </div>
                                        <p className="text-sm text-slate-600">
                                            Valid till {revealedReward.expiryDate ? new Date(revealedReward.expiryDate).toLocaleDateString() : 'N/A'}
                                        </p>
                                        {revealedReward.bonusCrashcash > 0 && (
                                            <div className="mt-3 bg-yellow-50 rounded p-2">
                                                <p className="text-xs text-yellow-700 font-medium">
                                                    + ₹{revealedReward.bonusCrashcash} Bonus CrashCash!
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </>
                        ) : null}

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
                    
                    <div className="relative w-full max-w-xs rounded-2xl shadow-2xl overflow-hidden aspect-[3/4] flex items-center justify-center" style={{ backgroundImage: cardGradient }}>
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
