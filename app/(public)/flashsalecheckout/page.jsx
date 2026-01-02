'use client'
import dynamic from 'next/dynamic'
import React from 'react'

// Dynamically reuse the existing buy-now-checkout client page
const BuyNowCheckout = dynamic(() => import('../buy-now-checkout/page').then(m => m.default), { ssr: false })

export default function FlashSaleCheckoutPage() {
    return (
        <div>
            <BuyNowCheckout />
        </div>
    )
}
