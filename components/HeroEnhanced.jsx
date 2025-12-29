'use client'
import { assets } from '@/assets/assets'
import { ArrowRightIcon, ChevronRightIcon, Sparkles, Gift } from 'lucide-react'
import Image from 'next/image'
import React, { useState, useEffect } from 'react'
import CategoriesMarquee from './CategoriesMarquee'
import Link from 'next/link'
import toast from 'react-hot-toast'

const HeroEnhanced = () => {

     const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '₹'
     const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
     const [currentBannerIndex, setCurrentBannerIndex] = useState(0)

    // Banner data with fallback solid colors if images fail to load
     const banners = [
         {
             id: 1,
             image: '/cleanup1.png',
             bgColor: 'from-red-400 to-red-600',
             text: 'Get upto 50% OFF on Your First Order!',
             coupon: 'NEW20',
             badge: 'New User Offer'
         },
         {
             id: 2,
             image: '/cleanup2.png',
             bgColor: 'from-blue-400 to-blue-600',
             text: 'Flash Sale - Limited Time Only!',
             coupon: 'FLASH30',
             badge: 'Flash Sale'
         },
         {
             id: 3,
             image: '/cleanup3.png',
             bgColor: 'from-purple-400 to-purple-600',
             text: 'Exclusive Deals Just For You!',
             coupon: 'EXCLUSIVE20',
             badge: 'Exclusive Deals'
         }
     ]

    const handleMouseMove = (e) => {
        const rect = e.currentTarget.getBoundingClientRect()
        setMousePosition({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        })
    }

    // Auto-rotate banners every 5 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentBannerIndex((prev) => (prev + 1) % banners.length)
        }, 5000)

        return () => clearInterval(interval)
    }, [banners.length])

    const currentBanner = banners[currentBannerIndex]

    const handleClaim = () => {
        navigator.clipboard.writeText(currentBanner.coupon)
        toast.success(`Coupon ${currentBanner.coupon} copied to clipboard!`)
    }

    const goToBanner = (index) => {
        setCurrentBannerIndex(index)
    }

    return (
        <div className='mx-6'>
            <div className='flex max-xl:flex-col gap-8 max-w-7xl mx-auto my-10'>
                {/* Main Hero Card with Girl in Headphones */}
                <div 
                    className='relative flex-1 flex flex-col bg-gradient-to-br from-green-200 via-green-100 to-emerald-200 rounded-3xl xl:min-h-100 group overflow-hidden'
                    onMouseMove={handleMouseMove}
                >
                    {/* Animated background elements */}
                    <div className='absolute -top-20 -right-20 w-40 h-40 bg-green-300 rounded-full opacity-20 blur-3xl group-hover:blur-2xl transition-all duration-500'></div>
                    <div className='absolute -bottom-20 -left-20 w-40 h-40 bg-emerald-300 rounded-full opacity-20 blur-3xl group-hover:blur-2xl transition-all duration-500'></div>

                    {/* Spotlight Effect */}
                    <div
                        className='pointer-events-none absolute opacity-0 group-hover:opacity-100 transition-opacity duration-300'
                        style={{
                            left: `${mousePosition.x}px`,
                            top: `${mousePosition.y}px`,
                            width: '200px',
                            height: '200px',
                            transform: 'translate(-50%, -50%)',
                            background: 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)',
                        }}
                    />

                    <div className='p-5 sm:p-16 relative z-10'>
                        <div className='inline-flex items-center gap-3 bg-green-300 text-green-700 pr-4 p-1 rounded-full text-xs sm:text-sm hover:bg-green-400 transition'>
                            <span className='bg-green-600 px-3 py-1 max-sm:ml-1 rounded-full text-white text-xs font-bold'>SPECIAL</span> 
                            Free Shipping on Orders Above ₹999! 
                            <ChevronRightIcon className='group-hover:ml-2 transition-all' size={16} />
                        </div>
                        
                        <h2 className='text-3xl sm:text-5xl leading-[1.2] my-3 font-bold bg-gradient-to-r from-slate-800 dark:from-white to-[#22c55e] bg-clip-text text-transparent max-w-xs sm:max-w-md relative'>
                            Gadgets you'll love. Prices you'll trust.
                        </h2>
                        
                        <p className='text-slate-700 dark:text-slate-300 text-base mb-6'></p>
                        <div className='text-slate-800 dark:text-white text-sm font-medium mt-4 sm:mt-8'>
                            <p className='text-slate-600 dark:text-slate-400'>Starts from</p>
                            <p className='text-4xl font-bold text-green-700'>{currency}199</p>
                        </div>
                        
                        <Link href="/shop">
                            <button className='group/btn relative bg-slate-800 text-white text-sm py-3 px-8 sm:py-5 sm:px-12 mt-6 sm:mt-10 rounded-lg hover:bg-slate-900 hover:scale-105 active:scale-95 transition-all shadow-lg overflow-hidden'>
                                {/* Moving Border Effect */}
                                <span className='absolute inset-0 rounded-lg opacity-0 group-hover/btn:opacity-100 transition-opacity'>
                                    <span className='absolute inset-[-2px] rounded-lg bg-gradient-to-r from-slate-700 via-slate-600 to-slate-700 animate-pulse'></span>
                                </span>
                                <span className='relative'>SHOP NOW →</span>
                            </button>
                        </Link>
                    </div>
                    <Image className='sm:absolute bottom-0 right-0 md:right-10 w-full sm:max-w-sm object-contain' src={assets.hero_model_img} alt="Hero" />
                </div>

                {/* Side Cards with Enhanced Design */}
                <div className='flex flex-col md:flex-row xl:flex-col gap-5 w-full xl:max-w-sm'>
                    {/* Best Products Card */}
                    <div className='flex-1 relative flex items-center justify-between w-full bg-gradient-to-br from-orange-200 via-orange-100 to-yellow-100 rounded-3xl p-6 px-8 group overflow-hidden hover:shadow-lg transition-all duration-300'>
                        <div className='absolute -top-10 -right-10 w-32 h-32 bg-orange-300 rounded-full opacity-20 blur-3xl group-hover:blur-2xl transition-all'></div>
                        <div className='relative z-10'>
                            <p className='text-2xl sm:text-3xl font-bold bg-gradient-to-r from-slate-800 dark:from-white to-orange-600 bg-clip-text text-transparent max-w-40'>Best products</p>
                            <Link href="/shop?category=bestselling">
                                <p className='flex items-center gap-1 mt-4 text-slate-700 dark:text-slate-300 hover:text-orange-600 font-semibold cursor-pointer transition'>
                                    View more <ArrowRightIcon className='group-hover:ml-2 transition-all' size={18} />
                                </p>
                            </Link>
                        </div>
                        <Image className='w-32 sm:w-40 object-contain' src={assets.hero_product_img1} alt="Best Products" />
                    </div>

                    {/* Discount Card */}
                    <div className='flex-1 relative flex items-center justify-between w-full bg-gradient-to-br from-blue-200 via-blue-100 to-cyan-100 rounded-3xl p-6 px-8 group overflow-hidden hover:shadow-lg transition-all duration-300'>
                        <div className='absolute -bottom-10 -left-10 w-32 h-32 bg-blue-300 rounded-full opacity-20 blur-3xl group-hover:blur-2xl transition-all'></div>
                        <div className='relative z-10'>
                            <p className='text-2xl sm:text-3xl font-bold bg-gradient-to-r from-slate-800 dark:from-white to-blue-600 bg-clip-text text-transparent max-w-40'>20% Off</p>
                            <Link href="/shop?discount=20">
                                <p className='flex items-center gap-1 mt-4 text-slate-700 dark:text-slate-300 hover:text-blue-600 font-semibold cursor-pointer transition'>
                                    View deals <ArrowRightIcon className='group-hover:ml-2 transition-all' size={18} />
                                </p>
                            </Link>
                        </div>
                        <Image className='w-32 sm:w-40 object-contain' src={assets.hero_product_img2} alt="Discounts" />
                    </div>
                </div>
            </div>

            {/* Rotating Promotions Banner Section */}
             <div className='max-w-7xl mx-auto my-10'>
                 <div className={`relative w-full rounded-2xl overflow-hidden h-40 sm:h-56 md:h-72 shadow-lg group bg-gradient-to-r ${currentBanner.bgColor}`}>
                     {/* Banner Image */}
                     <Image
                         src={currentBanner.image}
                         alt="Promotion Banner"
                         fill
                         className="object-cover w-full h-full transition-opacity duration-700"
                         priority
                         sizes="100vw"
                         unoptimized
                     />
                    
                    {/* Professional Dark Gradient Overlay */}
                    <div className='absolute inset-0 bg-gradient-to-r from-black/50 via-black/30 to-transparent'></div>
                    
                    {/* Top Left - Badge with Category */}
                    <div className='absolute top-5 sm:top-8 left-5 sm:left-8 z-10'>
                        <div className='flex flex-col gap-2'>
                            <div className='inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white px-4 py-2 rounded-full text-xs sm:text-sm font-bold shadow-lg'>
                                <Sparkles size={16} />
                                {currentBanner.badge}
                            </div>
                        </div>
                    </div>

                    {/* Bottom Right - CTA Button */}
                    <div className='absolute bottom-5 sm:bottom-8 right-5 sm:right-8 z-10'>
                        <button 
                            onClick={handleClaim}
                            className='group/btn relative bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-xs sm:text-base font-bold py-2.5 sm:py-3.5 px-5 sm:px-10 rounded-lg shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 flex items-center gap-2'
                        >
                            <Gift size={18} />
                            <span>{currentBanner.coupon}</span>
                        </button>
                    </div>

                    {/* Banner Navigation Dots - Bottom Center */}
                    <div className='absolute bottom-5 left-1/2 transform -translate-x-1/2 flex gap-2.5 z-10 bg-black/30 px-3 py-2 rounded-full backdrop-blur-sm'>
                        {banners.map((banner, index) => (
                            <button
                                key={banner.id}
                                onClick={() => goToBanner(index)}
                                className={`transition-all duration-300 rounded-full cursor-pointer ${
                                    index === currentBannerIndex
                                        ? 'bg-white w-8 h-2.5'
                                        : 'bg-white/40 w-2.5 h-2.5 hover:bg-white/70'
                                }`}
                                aria-label={`Go to banner ${index + 1}`}
                            />
                        ))}
                    </div>
                </div>
            </div>

            <CategoriesMarquee />
        </div>

    )
}

export default HeroEnhanced
