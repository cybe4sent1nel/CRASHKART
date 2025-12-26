'use client'
import { Heart, Check } from 'lucide-react'
import { useState } from 'react'

const WishlistButton = ({ productId, productName }) => {
    const [isInWishlist, setIsInWishlist] = useState(false)
    const [showNotification, setShowNotification] = useState(false)

    const toggleWishlist = (e) => {
        e.preventDefault()
        e.stopPropagation()
        
        setIsInWishlist(!isInWishlist)
        setShowNotification(true)
        
        // Add/remove from localStorage
        const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]')
        if (isInWishlist) {
            const filtered = wishlist.filter(id => id !== productId)
            localStorage.setItem('wishlist', JSON.stringify(filtered))
        } else {
            wishlist.push(productId)
            localStorage.setItem('wishlist', JSON.stringify(wishlist))
        }
        
        setTimeout(() => setShowNotification(false), 2000)
    }

    return (
        <>
            <button
                onClick={toggleWishlist}
                className='bg-white hover:bg-red-50 p-2 rounded-full transition'
                title={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
            >
                <Heart 
                    size={18} 
                    className={isInWishlist ? 'fill-red-600 text-red-600' : 'text-slate-400'}
                />
            </button>
            
            {showNotification && (
                <div className='fixed bottom-4 right-4 bg-slate-800 text-white px-4 py-2 rounded-lg text-sm z-40 animate-fade-in-out flex items-center gap-2'>
                    <Check size={16} className='text-green-400' />
                    {isInWishlist ? `${productName} added to wishlist` : `${productName} removed from wishlist`}
                </div>
            )}
        </>
    )
}

export default WishlistButton
