'use client'
import { StarIcon, Heart } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { addToWishlist, removeFromWishlist } from '@/lib/features/wishlist/wishlistSlice'
import { Lens } from '@/components/ui/lens'
import { MovingBorder } from '@/components/ui/moving-border'

const ProductCardEnhancedUI = ({ product }) => {

    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '$'
    const dispatch = useDispatch()
    const wishlistItems = useSelector(state => state.wishlist?.items || [], (prev, next) => 
        Array.isArray(prev) && Array.isArray(next) ? prev.length === next.length && prev.every((item, idx) => item?.id === next[idx]?.id) : prev === next
    )
    const isInWishlist = wishlistItems.some(item => item.id === product.id)
    const [isHovering, setIsHovering] = useState(false)

    // calculate the average rating of the product
    const rating = Math.round(product.rating.reduce((acc, curr) => acc + curr.rating, 0) / product.rating.length);
    const reviewCount = product.rating.length

    const toggleWishlist = (e) => {
        e.preventDefault()
        e.stopPropagation()
        
        if (isInWishlist) {
            dispatch(removeFromWishlist(product.id))
        } else {
            dispatch(addToWishlist(product))
        }
    }

    return (
        <Link href={`/product/${product.id}`} className='group max-xl:mx-auto relative'>
            <MovingBorder duration={3000} borderClassName="bg-gradient-to-r from-red-500 to-slate-500">
                <div className='bg-white rounded-lg overflow-hidden'>
                    {/* Product Image with Lens Effect */}
                    <div className='bg-[#F5F5F5] h-40 sm:w-60 sm:h-68 relative overflow-hidden'
                         onMouseEnter={() => setIsHovering(true)}
                         onMouseLeave={() => setIsHovering(false)}>
                        {isHovering ? (
                            <Lens zoomLevel={1.5} lensSize={150}>
                                <Image 
                                    width={500} 
                                    height={500} 
                                    className='w-full h-full object-cover' 
                                    src={product.images[0]} 
                                    alt="" 
                                />
                            </Lens>
                        ) : (
                            <Image 
                                width={500} 
                                height={500} 
                                className='max-h-30 sm:max-h-40 w-auto group-hover:scale-115 transition duration-300 mx-auto' 
                                src={product.images[0]} 
                                alt="" 
                            />
                        )}
                        <button
                            onClick={toggleWishlist}
                            className='absolute top-2 right-2 bg-white hover:bg-red-50 p-2 rounded-full transition opacity-0 group-hover:opacity-100 z-10'
                        >
                            <Heart 
                                size={18} 
                                className={isInWishlist ? 'fill-red-600 text-red-600' : 'text-slate-400'}
                            />
                        </button>
                    </div>

                    {/* Product Info */}
                    <div className='p-4'>
                        <p className='font-medium text-slate-800 text-sm line-clamp-2'>{product.name}</p>
                        
                        {/* Rating */}
                        <div className='flex items-center gap-1 mt-2'>
                            <div className='flex'>
                                {Array(5).fill('').map((_, index) => (
                                    <StarIcon key={index} size={12} className='text-transparent' fill={rating >= index + 1 ? "#22C55E" : "#D1D5DB"} />
                                ))}
                            </div>
                            <span className='text-xs text-slate-500'>({reviewCount})</span>
                        </div>

                        {/* Price */}
                        <div className='flex items-center gap-2 mt-3'>
                            <p className='font-bold text-red-600 text-lg'>{currency}{product.price}</p>
                            {product.mrp > product.price && (
                                <p className='text-xs text-slate-500 line-through'>{currency}{product.mrp}</p>
                            )}
                        </div>
                    </div>
                </div>
            </MovingBorder>
        </Link>
    )
}

export default ProductCardEnhancedUI
