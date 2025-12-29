'use client'
import { useState, useEffect, useMemo } from 'react'
import { useDispatch, useSelector, shallowEqual } from 'react-redux'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ShoppingCart, Flame, Heart, Bell, Star } from 'lucide-react'
import Image from 'next/image'
import { addToWishlist, removeFromWishlist } from '@/lib/features/wishlist/wishlistSlice'
import { addToCart } from '@/lib/features/cart/cartSlice'
import OutOfStockDisplay from './OutOfStockDisplay'
import LottieAnimation from './LottieAnimation'
import wishlistAnimData from '@/public/animations/Wishlist Animation.json'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'

const FlashSaleNew = () => {
    const router = useRouter()
    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '₹'
    const dispatch = useDispatch()
    
    const wishlistItems = useSelector(state => state.wishlist?.items || [], shallowEqual)
    const cartItems = useSelector(state => state.cart?.items || [], shallowEqual)
    
    const [flashSales, setFlashSales] = useState([])
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const [notifyLoading, setNotifyLoading] = useState(null)
    const [timeLeft, setTimeLeft] = useState({})
    const [showWishlistAnim, setShowWishlistAnim] = useState(false)

    useEffect(() => {
        fetchFlashSales()
    }, [])

    const fetchFlashSales = async () => {
        try {
            // Fetch active flash sales
            const salesResponse = await fetch('/api/admin/flash-sales?isActive=true')
            if (salesResponse.ok) {
                const salesData = await salesResponse.json()
                setFlashSales(salesData)
                
                // Fetch all products from inventory
                const productsResponse = await fetch('/api/admin/inventory?limit=500')
                if (productsResponse.ok) {
                    const productsData = await productsResponse.json()
                    const allDbProducts = productsData.products || []
                    
                    // Match products from flash sales with database products
                    const flashSaleProductIds = new Set()
                    const salesByProductId = {}
                    
                    salesData.forEach(sale => {
                        if (Array.isArray(sale.products)) {
                            sale.products.forEach(id => {
                                flashSaleProductIds.add(id)
                                salesByProductId[id] = sale
                            })
                        }
                    })
                    
                    // Filter to only include products in active flash sales
                    // and add flash sale quantity info to each product
                    const flashSaleProducts = allDbProducts.filter(p => 
                        flashSaleProductIds.has(p.id)
                    ).map(p => ({
                        ...p,
                        flashSaleQuantity: salesByProductId[p.id]?.productQuantities?.[p.id] || salesByProductId[p.id]?.maxQuantity || p.quantity,
                        flashSaleId: salesByProductId[p.id]?.id
                    }))
                    
                    setProducts(flashSaleProducts)
                }
            }
        } catch (error) {
            console.error('Error fetching flash sales:', error)
        } finally {
            setLoading(false)
        }
    }

    // Update time left for each sale
    useEffect(() => {
        const timer = setInterval(() => {
            const newTimeLeft = {}
            flashSales.forEach(sale => {
                const now = Date.now()
                const endTime = new Date(sale.endTime).getTime()
                const diff = endTime - now

                if (diff <= 0) {
                    newTimeLeft[sale.id] = { hours: 0, minutes: 0, seconds: 0 }
                } else {
                    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
                    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
                    const seconds = Math.floor((diff % (1000 * 60)) / 1000)
                    newTimeLeft[sale.id] = { hours, minutes, seconds }
                }
            })
            setTimeLeft(newTimeLeft)
        }, 1000)

        return () => clearInterval(timer)
    }, [flashSales])

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
        
        // Calculate flash sale price
        const flashSaleDiscount = flashSales.find(sale => 
            sale.products.includes(product.id)
        )?.discount || 0
        
        const discountedPrice = product.price * (1 - flashSaleDiscount / 100)
        
        const buyNowData = {
            isBuyNow: true,
            product: {
                id: product.id,
                productId: product.id,
                name: product.name,
                price: discountedPrice,
                salePrice: discountedPrice,
                originalPrice: product.price,
                quantity: 1,
                images: product.images,
                storeId: product.storeId || 'seller_1',
                category: product.category,
                description: product.description,
                discount: flashSaleDiscount
            }
        }
        sessionStorage.setItem('buyNowData', JSON.stringify(buyNowData))
        router.push('/buy-now-checkout')
    }

    const handleNotifyMe = async (product, e) => {
        e.preventDefault()
        e.stopPropagation()

        if (product.quantity > 0) {
            alert('This product is in stock!')
            return
        }

        setNotifyLoading(product.id)

        try {
            const response = await fetch('/api/notifications/out-of-stock', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    productId: product.id,
                    userEmail: localStorage.getItem('userEmail') || 'guest@example.com',
                    userName: localStorage.getItem('userName') || 'Guest',
                    notificationType: 'email'
                })
            })

            if (response.ok) {
                toast.success('✓ You will be notified when this product is back in stock!')
            } else {
                toast.error('Failed to register notification')
            }
        } catch (error) {
            console.error('Error registering notification:', error)
            toast.error('Error registering notification')
        } finally {
            setNotifyLoading(null)
        }
    }

    if (loading) {
        return (
            <div className="mx-6 py-12 text-center">
                <p className="text-slate-600">Loading flash sales...</p>
            </div>
        )
    }

    if (flashSales.length === 0 || products.length === 0) {
        return null
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
                    {flashSales.length > 0 && (
                        <div className='flex items-center gap-6'>
                            {(() => {
                                const time = timeLeft[flashSales[0]?.id]
                                return time ? (
                                    <>
                                        <div className='text-center'>
                                            <div className='text-2xl font-bold text-red-600'>{String(time.hours).padStart(2, '0')}</div>
                                            <div className='text-xs text-slate-600 dark:text-slate-400'>Hours</div>
                                        </div>
                                        <span className='text-3xl text-slate-400 dark:text-slate-500'>:</span>
                                        <div className='text-center'>
                                            <div className='text-2xl font-bold text-red-600'>{String(time.minutes).padStart(2, '0')}</div>
                                            <div className='text-xs text-slate-600 dark:text-slate-400'>Minutes</div>
                                        </div>
                                        <span className='text-3xl text-slate-400 dark:text-slate-500'>:</span>
                                        <div className='text-center'>
                                            <div className='text-2xl font-bold text-red-600'>{String(time.seconds).padStart(2, '0')}</div>
                                            <div className='text-xs text-slate-600 dark:text-slate-400'>Seconds</div>
                                        </div>
                                    </>
                                ) : null
                            })()}
                        </div>
                    )}
                </div>

                {/* Products Grid */}
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6'>
                    {products.map(product => {
                        const flashSale = flashSales.find(sale => sale.products.includes(product.id))
                        const discount = flashSale?.discount || 0
                        const discountedPrice = product.price * (1 - discount / 100)
                        const isOutOfStock = product.quantity === 0
                        
                        return (
                            <Link 
                                href={`/product/${product.id}`} 
                                key={product.id} 
                                className='bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition group cursor-pointer block h-full'
                            >
                                <div className='relative h-40 bg-slate-100 dark:bg-slate-700 overflow-hidden flex items-center justify-center'>
                                    {isOutOfStock ? (
                                        <>
                                            {/* Show product image with out of stock overlay */}
                                            {product.images && product.images[0] && (
                                                <Image
                                                    src={product.images[0]}
                                                    alt={product.name}
                                                    fill
                                                    className='object-cover opacity-30'
                                                />
                                            )}
                                            {/* Out of stock animation overlay */}
                                            <div className='absolute inset-0 flex items-center justify-center'>
                                                <OutOfStockDisplay size="small" />
                                            </div>
                                        </>
                                    ) : (
                                        product.images && product.images[0] && (
                                            <Image
                                                src={product.images[0]}
                                                alt={product.name}
                                                fill
                                                className='object-cover group-hover:scale-110 transition duration-300'
                                            />
                                        )
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
                                    <h3 className='font-semibold text-slate-800 dark:text-white mb-1 line-clamp-2 h-14'>
                                        {product.name}
                                    </h3>
                                    
                                    {/* Rating Display */}
                                    {product.rating && product.rating.length > 0 && (
                                        <div className='flex items-center gap-2 mb-3'>
                                            <div className='flex'>
                                                {Array(5).fill('').map((_, index) => {
                                                    const avgRating = product.rating.reduce((acc, curr) => acc + curr.rating, 0) / product.rating.length;
                                                    return (
                                                        <Star 
                                                            key={index} 
                                                            size={14} 
                                                            className={avgRating >= index + 1 ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-300 text-gray-300'}
                                                        />
                                                    )
                                                })}
                                            </div>
                                            <span className='text-xs text-slate-500 dark:text-slate-400'>
                                                ({product.rating.length})
                                            </span>
                                        </div>
                                    )}
                                    
                                    {/* Price Display */}
                                    <div className='flex items-center gap-2 mb-4'>
                                        <span className='text-2xl font-bold text-red-600'>
                                            {currency}{discountedPrice.toFixed(2)}
                                        </span>
                                        <span className='text-sm text-slate-500 dark:text-slate-400 line-through'>
                                            {currency}{product.price.toFixed(2)}
                                        </span>
                                    </div>

                                    {/* Stock Info - Show "Only few left" badge only when in stock and qty <= 5 */}
                                     <div className='mb-4'>
                                         {!isOutOfStock && product.flashSaleQuantity > 5 && (
                                             <p className='text-xs font-semibold text-green-600'>
                                                 ✓ In Stock
                                             </p>
                                         )}
                                         {!isOutOfStock && product.flashSaleQuantity > 0 && product.flashSaleQuantity <= 5 && (
                                             <p className='text-xs font-semibold text-red-600 bg-red-50 px-2 py-1 rounded inline-block'>
                                                 🔥 Hurry! Only few left
                                             </p>
                                         )}
                                         {isOutOfStock && (
                                             <p className='text-xs font-semibold text-red-600'>
                                                 Out of Stock
                                             </p>
                                         )}
                                     </div>

                                    {/* Actions */}
                                    <div className='flex gap-2 mt-auto'>
                                        {isOutOfStock ? (
                                            <button 
                                                onClick={(e) => handleNotifyMe(product, e)} 
                                                disabled={notifyLoading === product.id}
                                                className='flex-1 flex items-center justify-center gap-2 bg-slate-600 hover:bg-slate-700 text-white py-2.5 rounded-lg transition font-medium text-sm disabled:opacity-50'
                                            >
                                                <Bell size={16} />
                                                {notifyLoading === product.id ? 'Notifying...' : 'Notify Me'}
                                            </button>
                                        ) : (
                                            <>
                                                <button 
                                                    onClick={(e) => handleAddToCart(product, e)} 
                                                    className='flex-1 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 text-white py-2.5 rounded-lg transition font-medium text-sm'
                                                >
                                                    <ShoppingCart size={16} />
                                                    Add to Cart
                                                </button>
                                                <button 
                                                    onClick={(e) => handleBuyNow(product, e)} 
                                                    className='flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-lg transition font-medium text-sm'
                                                >
                                                    Buy Now
                                                </button>
                                            </>
                                        )}
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

export default FlashSaleNew
