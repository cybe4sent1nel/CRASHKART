'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { Zap } from 'lucide-react'

export default function FlashBuyNowButton({ product, flashSaleDiscount, flashSaleData, displayPrice }) {
    const router = useRouter()

    const handleClick = async () => {
        try {
            const effectivePrice = product.salePrice || displayPrice || product.price
            const flashId = product.flashSaleId || flashSaleData?.id || null
            const buyNowData = {
                isBuyNow: true,
                product: {
                    id: product.id,
                    productId: product.id,
                    name: product.name,
                    price: effectivePrice,
                    salePrice: effectivePrice,
                    flashSaleId: flashId,
                    quantity: 1,
                    images: product.images,
                    originalPrice: product.originalPrice || product.price,
                    storeId: product.storeId || product.store_id || 'seller_1',
                    category: product.category,
                    description: product.description
                }
            }

            try {
                const mod = await import('@/lib/cartOverrides')
                const CartOverrides = mod.CartOverrides || mod.default
                CartOverrides.set(product.id, { salePrice: effectivePrice, flashSaleId: flashId, expiresAt: localStorage.getItem('flashSaleEndTime') || null })
            } catch (e) {
                // ignore
            }

            sessionStorage.setItem('buyNowData', JSON.stringify(buyNowData))

            if (flashSaleDiscount > 0 || flashId) {
                router.push('/flashsalecheckout')
            } else {
                router.push('/buy-now-checkout')
            }
        } catch (err) {
            console.error('FlashBuyNow failed:', err)
            toast.error('Failed to start Buy Now flow')
        }
    }

    return (
        <button onClick={handleClick} className={flashSaleDiscount > 0 ? "bg-yellow-600 text-white px-10 py-3 text-sm font-medium rounded hover:bg-yellow-700 active:scale-95 transition flex items-center justify-center" : "bg-red-600 text-white px-10 py-3 text-sm font-medium rounded hover:bg-red-700 active:scale-95 transition"}>
            {flashSaleDiscount > 0 ? (
                <>
                    <Zap className="w-4 h-4 mr-2" />
                    Buy Now
                </>
            ) : (
                'Buy Now'
            )}
        </button>
    )
}
