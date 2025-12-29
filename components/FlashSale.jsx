'use client'
import { useState, useEffect, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useRouter } from 'next/navigation'
import { assets, flashSaleProducts } from '@/assets/assets'
import Link from 'next/link'
import { ShoppingCart, Flame, Heart } from 'lucide-react'
import Image from 'next/image'
import { addToWishlist, removeFromWishlist } from '@/lib/features/wishlist/wishlistSlice'
import { addToCart } from '@/lib/features/cart/cartSlice'
import LottieAnimation from './LottieAnimation'
import wishlistAnimData from '@/public/animations/Wishlist Animation.json'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'

const FlashSale = () => {
    const router = useRouter()
    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '₹'
    const dispatch = useDispatch()
    
    // Memoized selectors to prevent unnecessary rerenders
    const wishlistItems = useSelector(state => state.wishlist?.items || [], (prev, next) => 
        Array.isArray(prev) && Array.isArray(next) ? prev.length === next.length : prev === next
    )
    const cartItems = useSelector(state => state.cart?.items || [], (prev, next) => 
        Array.isArray(prev) && Array.isArray(next) ? prev.length === next.length : prev === next
    )
    
    const [timeLeft, setTimeLeft] = useState({
        hours: 0,
        minutes: 0,
        seconds: 0
    })
    const [showWishlistAnim, setShowWishlistAnim] = useState(false)

    useEffect(() => {
        // Set sale end time to 4 hours from component mount
        const saleEndTime = localStorage.getItem('flashSaleEndTime')
        if (!saleEndTime) {
            const endTime = new Date(Date.now() + 4 * 60 * 60 * 1000).getTime()
            localStorage.setItem('flashSaleEndTime', endTime)
        }

        const timer = setInterval(() => {
            const now = Date.now()
            const endTime = parseInt(localStorage.getItem('flashSaleEndTime'))
            const diff = endTime - now

            if (diff <= 0) {
                setTimeLeft({ hours: 0, minutes: 0, seconds: 0 })
                localStorage.removeItem('flashSaleEndTime')
                return
            }

            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
            const seconds = Math.floor((diff % (1000 * 60)) / 1000)

            setTimeLeft({ hours, minutes, seconds })
        }, 1000)

        return () => clearInterval(timer)
    }, [])

    const toggleWishlist = (product, e) => {
        e.preventDefault()
        e.stopPropagation()

        // Prevent navigation loader from triggering
        if (typeof window !== 'undefined') {
            window.__disableNavigationLoader = true
        }

        const isInWishlist = wishlistItems.some(item => item.id === product.id)
        if (isInWishlist) {
            dispatch(removeFromWishlist(product.id))
            toast.success('Removed from wishlist')
        } else {
            dispatch(addToWishlist(product))
            setShowWishlistAnim(true)
            toast.success('Added to wishlist!')
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

    const handleAddToCart = (product, e) => {
        e.preventDefault()
        e.stopPropagation()
        dispatch(addToCart({
            productId: product.id
        }))
        toast.success(`${product.name} added to cart!`)
    }

    const handleBuyNow = (product, e) => {
         e.preventDefault()
         e.stopPropagation()
         // For Buy Now: Use sale price for flash sale products
         const effectivePrice = product.salePrice || product.price || product.originalPrice
         const buyNowData = {
             isBuyNow: true,
             product: {
                 id: product.id,
                 productId: product.id,
                 name: product.name,
                 price: effectivePrice,
                 salePrice: effectivePrice,
                 quantity: 1,
                 images: product.images,
                 originalPrice: product.originalPrice || product.price,
                 storeId: product.storeId || product.store_id || 'seller_1',
                 category: product.category,
                 description: product.description
             }
         };
         sessionStorage.setItem('buyNowData', JSON.stringify(buyNowData));
         // Redirect to dedicated buy-now-checkout route
         router.push('/buy-now-checkout')
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
            <div className='mx-6'>
            <div className='max-w-7xl mx-auto my-12'>
                {/* Header */}
                <div className='flex items-center justify-between mb-8'>
                    <div className='flex items-center gap-3'>
                        <Flame size={32} className='text-red-600' />
                        <h2 className='text-3xl font-bold text-slate-800 dark:text-white'>Flash Sale</h2>
                    </div>
                    <div className='flex items-center gap-6'>
                        <div className='text-center'>
                            <div className='text-2xl font-bold text-red-600'>{String(timeLeft.hours).padStart(2, '0')}</div>
                            <div className='text-xs text-slate-600 dark:text-slate-400'>Hours</div>
                        </div>
                        <span className='text-3xl text-slate-400 dark:text-slate-500'>:</span>
                        <div className='text-center'>
                            <div className='text-2xl font-bold text-red-600'>{String(timeLeft.minutes).padStart(2, '0')}</div>
                            <div className='text-xs text-slate-600 dark:text-slate-400'>Minutes</div>
                        </div>
                        <span className='text-3xl text-slate-400 dark:text-slate-500'>:</span>
                        <div className='text-center'>
                            <div className='text-2xl font-bold text-red-600'>{String(timeLeft.seconds).padStart(2, '0')}</div>
                            <div className='text-xs text-slate-600 dark:text-slate-400'>Seconds</div>
                        </div>
                    </div>
                </div>

                {/* Products Grid */}
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6'>
                    {flashSaleProducts.map(product => {
                        const discount = Math.round(((product.mrp - product.price) / product.mrp) * 100)
                        const avgRating = Math.round(product.rating.reduce((acc, curr) => acc + curr.rating, 0) / product.rating.length)
                        return (
                        <Link href={`/product/${product.id}`} key={product.id} className='bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition group cursor-pointer block h-full'>
                            <div className='relative h-40 bg-slate-100 dark:bg-slate-700 overflow-hidden'>
                                {product.images && product.images[0] && (
                                    <Image
                                        src={product.images[0]}
                                        alt={product.name}
                                        fill
                                        className='object-cover group-hover:scale-110 transition duration-300'
                                    />
                                )}
                                
                                {/* Out of Stock Overlay */}
                                {!product.inStock && (
                                    <div className='absolute inset-0 bg-black/50 flex items-center justify-center'>
                                        <span className='bg-red-600 text-white px-3 py-1 rounded-lg font-semibold text-sm'>
                                            Out of Stock
                                        </span>
                                    </div>
                                )}
                                
                                <div className='absolute top-2 right-2 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-semibold'>
                                    -{discount}%
                                </div>
                                <button
                                    onClick={(e) => toggleWishlist(product, e)}
                                    data-no-loader="true"
                                    className='absolute top-2 left-2 bg-white hover:bg-red-50 p-2 rounded-full transition'
                                >
                                    <Heart 
                                        size={18} 
                                        className={wishlistItems.some(item => item.id === product.id) ? 'fill-red-600 text-red-600' : 'text-slate-400'}
                                    />
                                </button>
                            </div>

                            <div className='p-4 flex flex-col h-full'>
                                <h3 className='font-semibold text-slate-800 dark:text-white mb-1 line-clamp-2 h-14'>{product.name}</h3>
                                <div className='flex items-center gap-2 mb-2'>
                                    <div className='flex items-center gap-1'>
                                         <span className='text-green-500'>★</span>
                                         <span className='text-sm font-medium text-slate-700 dark:text-slate-300'>{avgRating}</span>
                                         <span className='text-xs text-slate-500 dark:text-slate-400'>({product.rating.length})</span>
                                       </div>
                                   </div>
                                   <div className='flex items-center gap-2 mb-4'>
                                       <span className='text-2xl font-bold text-red-600'>{currency}{product.price}</span>
                                       <span className='text-sm text-slate-500 dark:text-slate-400 line-through'>{currency}{product.mrp}</span>
                                   </div>
                                   <div className='flex gap-2 mt-auto'>
                                       <button onClick={(e) => handleAddToCart(product, e)} className='flex-1 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 text-white py-2.5 rounded-lg transition font-medium text-sm'>
                                           <ShoppingCart size={16} />
                                           Add to Cart
                                       </button>
                                       <button onClick={(e) => {
                                           handleBuyNow(product, e)
                                       }} className='flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-lg transition font-medium text-sm'>
                                           Buy Now
                                       </button>
                                   </div>
                               </div>
                            </Link>
                            )
                            })}
                            </div>

                {/* View All Button */}
                <div className='text-center mt-8'>
                    <Link href='/shop' className='inline-block px-8 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition'>
                        View All Deals
                    </Link>
                </div>
            </div>
        </div>
        </>
    )
}

export default FlashSale
