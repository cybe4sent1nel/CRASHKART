'use client'
import Image from 'next/image'
import Link from 'next/link'
import { Heart } from 'lucide-react'
import WishlistButton from './WishlistButton'
import { useState } from 'react'

export default function ProductCardEnhanced({ product }) {
    const [isHovered, setIsHovered] = useState(false)
    
    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '₹'
    
    const discountedPrice = product.currentPrice
    const originalPrice = product.originalPrice || product.currentPrice
    const discountPercent = originalPrice > 0 ? Math.round(((originalPrice - discountedPrice) / originalPrice) * 100) : 0

    return (
        <Link href={`/product/${product._id}`}>
            <div 
                className='relative group cursor-pointer bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-500'
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                {/* Image Container with Lens Effect Ready */}
                <div className='relative w-full h-64 bg-gray-200 overflow-hidden rounded-t-xl'>
                    <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        className={`object-cover w-full h-full transition-all duration-500 ${
                            isHovered ? 'scale-110' : 'scale-100'
                        }`}
                    />
                    
                    {/* Discount Badge */}
                    {discountPercent > 0 && (
                        <div className='absolute top-3 right-3 bg-red-500 text-white px-2 py-1 rounded-lg text-xs font-bold'>
                            -{discountPercent}%
                        </div>
                    )}
                    
                    {/* Hover Actions - Moving Border Style */}
                    <div className={`absolute inset-0 bg-black/40 flex items-center justify-center gap-3 transition-opacity duration-300 ${
                        isHovered ? 'opacity-100' : 'opacity-0'
                    }`}>
                        <button className='bg-white text-black px-4 py-2 rounded-lg font-semibold hover:bg-gray-100 transition'>
                            Quick View
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className='p-4'>
                    <h3 className='font-semibold text-gray-900 text-sm truncate mb-2 group-hover:text-blue-600 transition'>
                        {product.name}
                    </h3>
                    
                    {/* Rating */}
                    {product.rating && (
                        <div className='flex items-center gap-1 mb-2'>
                            <div className='flex text-yellow-400'>
                                {[...Array(5)].map((_, i) => (
                                    <span key={i} className={i < Math.round(product.rating) ? 'text-yellow-400' : 'text-gray-300'}>
                                        ★
                                    </span>
                                ))}
                            </div>
                            <span className='text-xs text-gray-600'>({product.reviews?.length || 0})</span>
                        </div>
                    )}
                    
                    {/* Price */}
                    <div className='flex items-center gap-2 mb-3'>
                        <span className='text-lg font-bold text-gray-900'>
                            {currency}{discountedPrice}
                        </span>
                        {originalPrice > discountedPrice && (
                            <span className='text-sm text-gray-500 line-through'>
                                {currency}{originalPrice}
                            </span>
                        )}
                    </div>

                    {/* Crash Cash Badge */}
                    {product.crashCashValue && (
                        <div className='text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1 mb-3 inline-flex items-center gap-1 font-medium'>
                            <img src="/crashcash.ico" alt="Crash Cash" className="w-3 h-3" />
                            Earn {currency}{product.crashCashValue}
                        </div>
                    )}

                    {/* Add to Cart Button with Moving Border Effect */}
                    <button className='w-full py-2 px-3 border-2 border-transparent bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg font-semibold text-sm hover:shadow-lg hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 group'>
                        Add to Cart
                    </button>
                </div>

                {/* Wishlist Button - Floating */}
                <div className='absolute top-3 left-3'>
                    <WishlistButton productId={product._id} />
                </div>
            </div>
        </Link>
    )
}
