'use client'
import { useSelector } from 'react-redux'
import ProductCard from '../ProductCard'
import { TrendingUp } from 'lucide-react'

const BestSellingSection = () => {

    const displayQuantity = 8
    const products = useSelector(state => state.product.list)

    // Sort by highest number of ratings to determine best sellers
    const bestSellers = products.slice().sort((a, b) => b.rating.length - a.rating.length).slice(0, displayQuantity)

    if (bestSellers.length === 0) return null

    return (
        <div className='border-t-2 border-slate-200 dark:border-slate-700 pt-8'>
            <div className='px-6 my-12 max-w-7xl mx-auto'>
                <div className='mb-8'>
                    <div className='flex items-center gap-3 mb-2'>
                        <TrendingUp size={32} className='text-orange-600' />
                        <h2 className='text-3xl font-bold text-slate-800 dark:text-white'>Best Selling</h2>
                    </div>
                    <p className='text-slate-600 dark:text-slate-400'>
                        Showing {bestSellers.length < displayQuantity ? bestSellers.length : displayQuantity} of {products.length} products
                    </p>
                </div>
                <div className='mt-12 grid grid-cols-2 sm:flex flex-wrap gap-6 xl:gap-12'>
                    {bestSellers.map((product, index) => (
                        <ProductCard key={index} product={product} />
                    ))}
                </div>
            </div>
        </div>
    )
}

export default BestSellingSection
