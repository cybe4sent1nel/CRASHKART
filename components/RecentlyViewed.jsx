'use client'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { Eye, ShoppingCart } from 'lucide-react'
import { useDispatch } from 'react-redux'
import { addToCart } from '@/lib/features/cart/cartSlice'
import toast from 'react-hot-toast'
import OutOfStockDisplay from './OutOfStockDisplay'

export default function RecentlyViewed() {
    const [products, setProducts] = useState([])
    const dispatch = useDispatch()
    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '₹'

    useEffect(() => {
        // Load recently viewed products from localStorage
        const viewed = localStorage.getItem('recentlyViewed')
        if (viewed) {
            const parsedProducts = JSON.parse(viewed)
            setProducts(parsedProducts.slice(0, 6)) // Show max 6
        }
    }, [])

    if (products.length === 0) return null

    const handleAddToCart = (product, e) => {
        e.preventDefault()
        try {
            import('@/lib/cartOverrides').then(mod => {
                const CartOverrides = mod.CartOverrides || mod.default
                CartOverrides.set(product.id, { salePrice: product.salePrice || product.price, expiresAt: localStorage.getItem('flashSaleEndTime') || null })
            }).catch(() => {})
        } catch (e) {}
        dispatch(addToCart({ productId: product.id }))
        toast.success(`${product.name} added to cart!`)
    }

    return (
        <div className="mx-6 my-16">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center gap-3 mb-6">
                    <Eye className="text-slate-600" size={28} />
                    <h2 className="text-3xl font-bold text-slate-800">
                        Recently Viewed
                    </h2>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {products.map((product, index) => {
                        // Validate product has required data
                        if (!product.id || !product.name || !product.images || product.images.length === 0) {
                            return null
                        }
                        
                        return (
                        <motion.div
                            key={product.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <Link
                                href={`/product/${product.id}`}
                                className="group block bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-slate-100"
                            >
                                {/* Image */}
                                 <div className="relative bg-slate-50 aspect-square overflow-hidden">
                                     {!product.inStock ? (
                                         <>
                                             {/* Show product image with out of stock overlay */}
                                             {product.images[0] && (
                                                 <Image
                                                     src={product.images[0]}
                                                     alt={product.name}
                                                     fill
                                                     className="object-contain p-2 opacity-30"
                                                 />
                                             )}
                                             {/* Out of stock animation overlay */}
                                             <div className='absolute inset-0 flex items-center justify-center'>
                                                 <OutOfStockDisplay size="small" />
                                             </div>
                                         </>
                                     ) : (
                                         product.images[0] && (
                                             <Image
                                                 src={product.images[0]}
                                                 alt={product.name}
                                                 fill
                                                 className="object-contain p-2 group-hover:scale-110 transition-transform duration-300"
                                             />
                                         )
                                     )}
                                 </div>

                                {/* Details */}
                                <div className="p-3">
                                    <p className="text-xs text-slate-500 mb-1 truncate">
                                        {product.category}
                                    </p>
                                    <h3 className="font-semibold text-slate-800 text-sm mb-2 line-clamp-2 min-h-[40px]">
                                        {product.name}
                                    </h3>
                                    
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="font-bold text-slate-800">
                                            {currency}{product.price}
                                        </span>
                                        {product.mrp > product.price && (
                                            <span className="text-xs text-slate-400 line-through">
                                                {currency}{product.mrp}
                                            </span>
                                        )}
                                    </div>

                                    {/* Quick Add Button */}
                                    <button
                                        onClick={(e) => handleAddToCart(product, e)}
                                        className="w-full flex items-center justify-center gap-2 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition opacity-0 group-hover:opacity-100"
                                    >
                                        <ShoppingCart size={14} />
                                        <span>Add</span>
                                    </button>
                                </div>
                            </Link>
                        </motion.div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}

// Utility function to track viewed products
export function trackProductView(product) {
    if (typeof window === 'undefined') return

    const viewed = localStorage.getItem('recentlyViewed')
    let products = viewed ? JSON.parse(viewed) : []

    // Remove if already exists
    products = products.filter(p => p.id !== product.id)

    // Add to beginning
    products.unshift(product)

    // Keep only last 12 products
    products = products.slice(0, 12)

    localStorage.setItem('recentlyViewed', JSON.stringify(products))
}
