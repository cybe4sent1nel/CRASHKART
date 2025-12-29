'use client'
import { StarIcon, Heart, Eye } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { addToWishlist, removeFromWishlist } from '@/lib/features/wishlist/wishlistSlice'
import ProductQuickView from './ProductQuickView'
import OutOfStockDisplay from './OutOfStockDisplay'
import LottieAnimation from './LottieAnimation'
import wishlistAnimData from '@/public/animations/Wishlist Animation.json'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'

const ProductCard = ({ product }) => {

    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '₹'
    const dispatch = useDispatch()
    const wishlistItems = useSelector(state => state.wishlist?.items || [], (prev, next) =>
        Array.isArray(prev) && Array.isArray(next) ? prev.length === next.length && prev.every((item, idx) => item?.id === next[idx]?.id) : prev === next
    )
    const isInWishlist = wishlistItems.some(item => item.id === product.id)
    const [quickViewOpen, setQuickViewOpen] = useState(false)
    const [showWishlistAnim, setShowWishlistAnim] = useState(false)

    // calculate the average rating of the product
     const rating = product.rating && product.rating.length > 0 
         ? Math.round(product.rating.reduce((acc, curr) => acc + curr.rating, 0) / product.rating.length)
         : 0;
     const reviewCount = product.rating ? product.rating.length : 0

    const toggleWishlist = (e) => {
        e.preventDefault()
        e.stopPropagation()

        // Prevent navigation loader from triggering
        if (typeof window !== 'undefined') {
            window.__disableNavigationLoader = true
        }

        if (isInWishlist) {
            dispatch(removeFromWishlist(product.id))
            toast.success('Removed from wishlist')
        } else {
            dispatch(addToWishlist(product))
            setShowWishlistAnim(true)
            toast.success('Added to wishlist!')
            // Hide animation after 2 seconds
            setTimeout(() => {
                setShowWishlistAnim(false)
            }, 2000)
        }

        // Re-enable navigation loader after a short delay
        setTimeout(() => {
            if (typeof window !== 'undefined') {
                window.__disableNavigationLoader = false
            }
        }, 100)
    }

    return (
        <>
            {/* Wishlist Animation Overlay */}
            <AnimatePresence>
                {showWishlistAnim && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm"
                        onClick={() => setShowWishlistAnim(false)}
                    >
                        <motion.div
                            initial={{ y: -50 }}
                            animate={{ y: 0 }}
                            className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-8 max-w-sm"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <LottieAnimation
                                animationData={wishlistAnimData}
                                width={200}
                                height={200}
                                loop={false}
                                autoplay={true}
                            />
                            <p className="text-center text-xl font-bold text-slate-800 dark:text-white mt-4">
                                Added to Wishlist! ❤️
                            </p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
            
            <Link href={`/product/${product.id}`} className='group max-xl:mx-auto relative'>
                <div className='bg-[#F5F5F5] h-40 sm:w-60 sm:h-68 rounded-lg flex items-center justify-center relative overflow-hidden'>
                    {/* Show animation when out of stock */}
                    {(!product.inStock || product.quantity === 0) ? (
                        <>
                            {/* Show product image with out of stock overlay */}
                            {product.images && product.images[0] && (
                                <Image width={500} height={500} className='max-h-30 sm:max-h-40 w-auto opacity-30' src={product.images[0]} alt={product.name} />
                            )}
                            {/* Out of stock animation overlay */}
                            <div className='absolute inset-0 flex items-center justify-center'>
                                <OutOfStockDisplay size="small" />
                            </div>
                        </>
                    ) : (
                        <>
                            {product.images && product.images[0] && (
                                <Image width={500} height={500} className='max-h-30 sm:max-h-40 w-auto group-hover:scale-115 transition duration-300' src={product.images[0]} alt={product.name} />
                            )}
                        </>
                    )}

                    <button
                        onClick={toggleWishlist}
                        data-no-loader="true"
                        className='absolute top-2 right-2 bg-white hover:bg-red-50 p-2 rounded-full transition opacity-0 group-hover:opacity-100 shadow-lg'
                    >
                        <Heart
                            size={18}
                            className={isInWishlist ? 'fill-red-600 text-red-600' : 'text-slate-400'}
                        />
                    </button>
                    <button
                        onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            setQuickViewOpen(true)
                        }}
                        className='absolute top-2 left-2 bg-white hover:bg-blue-50 p-2 rounded-full transition opacity-0 group-hover:opacity-100 shadow-lg'
                    >
                        <Eye size={18} className='text-blue-600' />
                    </button>
                </div>
                <div className='flex justify-between gap-3 text-sm text-slate-800 dark:text-white pt-2 max-w-60'>
                    <div className='flex-1'>
                        <p className='font-medium'>{product.name}</p>
                        <div className='flex items-center gap-1 mt-1'>
                            <div className='flex'>
                                {Array(5).fill('').map((_, index) => (
                                    <StarIcon key={index} size={14} className='text-transparent mt-0.5' fill={rating >= index + 1 ? "#22C55E" : "#D1D5DB"} />
                                ))}
                            </div>
                            <span className='text-xs text-slate-500 dark:text-slate-400'>({reviewCount})</span>
                        </div>
                    </div>
                    <div className='flex flex-col gap-1'>
                        <p className='font-semibold'>{currency}{product.price}</p>
                        {product.crashCashValue && (
                            <div className='flex items-center gap-1 text-xs text-amber-700 font-medium'>
                                <img src="/crashcash.ico" alt="Crash Cash" className="w-3 h-3" />
                                <span>-{currency}{product.crashCashValue}</span>
                            </div>
                        )}
                        {/* Hide quantity in shop view */}
                    </div>
                </div>
            </Link>

            <ProductQuickView
                product={product}
                isOpen={quickViewOpen}
                onClose={() => setQuickViewOpen(false)}
            />
        </>
    )
}

export default ProductCard