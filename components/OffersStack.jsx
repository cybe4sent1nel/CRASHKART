'use client'
import React, { useState, useEffect } from 'react'
import { ChevronDown, ChevronUp, Copy, Check, Tag, Gift, Percent, Truck } from 'lucide-react'
import dynamic from 'next/dynamic'
import { motion, AnimatePresence } from 'framer-motion'

const LottieAnimation = dynamic(() => import('./LottieAnimation'), { ssr: false })

// Dynamically import the animation data
const offersAnimData = typeof window !== 'undefined' ? require('@/public/animations/offers.json') : null

// Default offers that will always show
const defaultOffers = [
    {
        id: 'default-1',
        type: 'shipping',
        title: 'Free Shipping',
        description: 'Free shipping on orders above ₹999',
        icon: 'truck',
        color: 'blue'
    },
    {
        id: 'default-2',
        type: 'cashback',
        title: 'Instant Cashback',
        description: 'Get instant cashback up to 5% with credit cards',
        icon: 'gift',
        color: 'purple'
    },
    {
        id: 'default-3',
        type: 'return',
        title: 'Easy Returns',
        description: 'Easy 30-day return policy',
        icon: 'tag',
        color: 'green'
    }
]

export function OffersStack({ productId, productPrice = 0 }) {
    const [expanded, setExpanded] = useState(false)
    const [copiedCode, setCopiedCode] = useState(null)
    const [offers, setOffers] = useState(defaultOffers)
    const [loading, setLoading] = useState(true)
    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '₹'

    // Fetch product-specific coupons and offers
    useEffect(() => {
        const fetchOffers = async () => {
            try {
                // Fetch active coupons for this product
                const response = await fetch(`/api/coupons?productId=${productId}`)
                const data = await response.json()
                
                console.log('🎁 Offers: API response:', data)
                
                if (data.success && data.coupons && data.coupons.length > 0) {
                    // Process coupon offers
                    const couponOffers = data.coupons.map((coupon) => {
                        let description = coupon.description
                        
                        // Calculate discount display
                        if (coupon.couponType === 'percentage') {
                            const discountAmount = (productPrice * coupon.discount) / 100
                            const actualDiscount = coupon.maxDiscount 
                                ? Math.min(discountAmount, coupon.maxDiscount) 
                                : discountAmount
                            description = `Save ${coupon.discount}% (up to ${currency}${actualDiscount.toFixed(0)}) with code ${coupon.code}`
                        } else if (coupon.couponType === 'flat') {
                            description = `Save ${currency}${coupon.discount} with code ${coupon.code}`
                        } else if (coupon.couponType === 'freeDelivery') {
                            description = `Free delivery with code ${coupon.code}`
                        }
                        
                        return {
                            id: coupon.id,
                            type: 'coupon',
                            title: coupon.code,
                            description: description,
                            icon: 'percent',
                            color: 'red',
        // Carousel logic removed: no longer needed for chevron/collapsible UI
                            couponData: coupon
                        }
                    })
                    
                    console.log('🎁 Offers: Processed coupon offers:', couponOffers.length)
                    
                    // Merge default offers with coupon offers
                    const allOffers = [...couponOffers, ...defaultOffers]
                    console.log('🎁 Offers: Total offers:', allOffers.length)
                    setOffers(allOffers)
                } else {
                    // No coupons, show only default offers
                    console.log('🎁 Offers: No coupons, showing only default offers')
                    setOffers(defaultOffers)
                }
            } catch (error) {
                console.error('❌ Error fetching offers:', error)
                // Keep default offers on error
                setOffers(defaultOffers)
            } finally {
                setLoading(false)
            }
        }

        if (productId) {
            fetchOffers()
        } else {
            setOffers(defaultOffers)
            setLoading(false)
        }
    }, [productId, productPrice, currency])

        // Carousel logic removed: no longer needed for chevron/collapsible UI

    const getIcon = (iconType) => {
        switch (iconType) {
            case 'truck':
                return <Truck size={24} />
            case 'gift':
                return <Gift size={24} />
            case 'tag':
                return <Tag size={24} />
            case 'percent':
                return <Percent size={24} />
            default:
                return <Gift size={24} />
        }
    }

    const getColorClasses = (color) => {
        switch (color) {
            case 'blue':
                return {
                    bg: 'from-blue-50 to-cyan-50 border-blue-200',
                    icon: 'text-blue-600 bg-blue-100',
                    title: 'text-blue-900',
                    desc: 'text-blue-700',
                    ctaBg: 'bg-blue-100',
                    ctaText: 'text-blue-700'
                }
            case 'purple':
                return {
                    bg: 'from-purple-50 to-pink-50 border-purple-200',
                    icon: 'text-purple-600 bg-purple-100',
                    title: 'text-purple-900',
                    desc: 'text-purple-700',
                    ctaBg: 'bg-purple-100',
                    ctaText: 'text-purple-700'
                }
            case 'green':
                return {
                    bg: 'from-green-50 to-emerald-50 border-green-200',
                    icon: 'text-green-600 bg-green-100',
                    title: 'text-green-900',
                    desc: 'text-green-700',
                    ctaBg: 'bg-green-100',
                    ctaText: 'text-green-700'
                }
            case 'red':
                return {
                    bg: 'from-red-50 to-orange-50 border-red-200',
                    icon: 'text-red-600 bg-red-100',
                    title: 'text-red-900',
                    desc: 'text-red-700',
                    ctaBg: 'bg-red-100',
                    ctaText: 'text-red-700'
                }
            default:
                return {
                    bg: 'from-gray-50 to-slate-50 border-gray-200',
                    icon: 'text-gray-600 bg-gray-100',
                    title: 'text-gray-900',
                    desc: 'text-gray-700',
                    ctaBg: 'bg-gray-100',
                    ctaText: 'text-gray-700'
                }
        }
    }

    if (loading) {
        return (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-center text-slate-600 dark:text-slate-400">Loading offers...</p>
            </div>
        )
    }

    return (
        <div className='w-full rounded-lg overflow-hidden relative'>
            {/* Animation in background */}
            {offersAnimData && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-95 z-0">
                    <LottieAnimation 
                        animationData={offersAnimData}
                        width='480px'
                        height='300px'
                        loop={true}
                        autoplay={true}
                    />
                </div>
            )}
            {/* Collapsible Card */}
            <div className={`relative z-10 bg-white/40 dark:bg-slate-900/40 border border-blue-200 dark:border-blue-800 rounded-lg shadow-md transition-all duration-300 ${expanded ? 'pb-4' : ''}`}
                style={{backdropFilter: 'blur(1px)'}}>
                <button
                    className="w-full flex items-center justify-between px-6 py-4 focus:outline-none group"
                    onClick={() => setExpanded((v) => !v)}
                    aria-expanded={expanded}
                >
                    <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        Available Offers
                    </span>
                    {expanded ? (
                        <ChevronUp size={24} className="text-blue-600 group-hover:text-purple-600 transition" />
                    ) : (
                        <ChevronDown size={24} className="text-blue-600 group-hover:text-purple-600 transition" />
                    )}
                </button>
                <AnimatePresence initial={false}>
                    {expanded && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.25 }}
                        >
                            <ul className="flex flex-col gap-3 px-6">
                                {offers.map((offer) => {
                                    const colors = getColorClasses(offer.color)
                                    return (
                                        <li key={offer.id} className={`flex items-start gap-3 bg-white/30 dark:bg-slate-900/30 border ${colors.bg.split(' ')[2]} rounded-lg p-4 shadow-sm relative backdrop-blur-sm`}>
                                            <div className={`${colors.icon} p-2.5 rounded-lg flex-shrink-0 mt-1`}>{getIcon(offer.icon)}</div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <h4 className={`font-bold ${colors.title} mb-1 text-sm`}>{offer.title}</h4>
                                                    {offer.type === 'coupon' && (
                                                        <button
                                                            className={`ml-2 px-2 py-1 ${colors.ctaBg} hover:opacity-90 ${colors.ctaText} text-xs rounded transition flex items-center gap-1`}
                                                            onClick={() => {
                                                                navigator.clipboard.writeText(offer.title)
                                                                setCopiedCode(offer.title)
                                                                setTimeout(() => setCopiedCode(null), 1500)
                                                            }}
                                                        >
                                                            {copiedCode === offer.title ? <Check size={14} /> : <Copy size={14} />}
                                                            {copiedCode === offer.title ? 'Copied' : 'Copy Code'}
                                                        </button>
                                                    )}
                                                </div>
                                                <p className={`text-xs ${colors.desc} leading-relaxed`}>{offer.description}</p>
                                                {offer.type === 'coupon' && offer.couponData?.minOrderValue && (
                                                    <p className={`text-xs ${colors.desc} mt-1 opacity-75`}>
                                                        Min. order: {currency}{offer.couponData.minOrderValue}
                                                    </p>
                                                )}
                                            </div>
                                        </li>
                                    )
                                })}
                            </ul>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
}

export default OffersStack
