'use client'
import { assets } from '@/assets/assets'
import { ArrowRightIcon, ChevronRightIcon } from 'lucide-react'
import Image from 'next/image'
import React from 'react'
import CategoriesMarquee from './CategoriesMarquee'
import Link from 'next/link'

const Hero = () => {

    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '₹'

    return (
        <div className='mx-6'>
            <div className='flex max-xl:flex-col gap-8 max-w-7xl mx-auto my-10'>
                {/* Main Hero Card with Enhanced Animation */}
                <div className='relative flex-1 flex flex-col bg-gradient-to-br from-green-200 via-green-100 to-emerald-200 rounded-3xl xl:min-h-100 group overflow-hidden'>
                    {/* Animated background elements */}
                    <div className='absolute -top-20 -right-20 w-40 h-40 bg-green-300 rounded-full opacity-20 blur-3xl group-hover:blur-2xl transition-all duration-500'></div>
                    <div className='absolute -bottom-20 -left-20 w-40 h-40 bg-emerald-300 rounded-full opacity-20 blur-3xl group-hover:blur-2xl transition-all duration-500'></div>

                    <div className='p-5 sm:p-16 relative z-10'>
                        <div className='inline-flex items-center gap-3 bg-green-300 text-green-700 pr-4 p-1 rounded-full text-xs sm:text-sm hover:bg-green-400 transition'>
                            <span className='bg-green-600 px-3 py-1 max-sm:ml-1 rounded-full text-white text-xs font-bold'>SPECIAL</span> 
                            Free Shipping on Orders Above ₹999! 
                            <ChevronRightIcon className='group-hover:ml-2 transition-all' size={16} />
                        </div>
                        <h2 className='text-3xl sm:text-5xl leading-[1.2] my-3 font-bold bg-gradient-to-r from-slate-800 dark:from-white to-[#22c55e] bg-clip-text text-transparent max-w-xs sm:max-w-md'>
                            Gadgets you'll love. Prices you'll trust.
                        </h2>
                        <p className='text-slate-700 dark:text-slate-300 text-base mb-6'></p>
                        <div className='text-slate-800 dark:text-white text-sm font-medium mt-4 sm:mt-8'>
                            <p className='text-slate-600 dark:text-slate-400'>Starts from</p>
                            <p className='text-4xl font-bold text-green-700'>{currency}199</p>
                        </div>
                        <Link href="/shop">
                            <button className='bg-slate-800 text-white text-sm py-3 px-8 sm:py-5 sm:px-12 mt-6 sm:mt-10 rounded-lg hover:bg-slate-900 hover:scale-105 active:scale-95 transition-all shadow-lg'>
                                SHOP NOW →
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
            <CategoriesMarquee />
        </div>

    )
}

export default Hero
