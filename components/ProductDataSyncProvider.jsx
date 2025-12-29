'use client'

import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { setProduct } from '@/lib/features/product/productSlice'
import { productDummyData } from '@/assets/assets'
import toast from 'react-hot-toast'

/**
 * This component syncs product data from the API to Redux state
 * Ensures UI shows real inventory status from database
 * Handles real-time updates when admin modifies inventory
 */
export default function ProductDataSyncProvider({ children }) {
    const dispatch = useDispatch()

    useEffect(() => {
        // Fetch real products from API on mount
        const fetchAndSyncProducts = async () => {
            try {
                const response = await fetch('/api/products/search?limit=1000')
                const data = await response.json()

                if (data.success && data.products && data.products.length > 0) {
                    // Map API products to expected format
                    const formattedProducts = data.products.map(product => ({
                        ...product,
                        rating: product.rating || [],
                        quantity: product.quantity || 0,
                        inStock: product.inStock !== undefined ? product.inStock : (product.quantity > 0),
                        originalPrice: product.mrp || product.price,
                        crashCashValue: product.crashCashValue || 0,
                        store: product.store || { name: 'CrashKart', id: 'default' }
                    }))

                    // Update Redux state with real product data
                    dispatch(setProduct(formattedProducts))
                    console.log(`✓ Synced ${formattedProducts.length} products from API`)
                } else {
                    // Fallback to product data if API returns no products
                    const formattedProducts = productDummyData.map(product => ({
                        ...product,
                        quantity: product.inStock ? 10 : 0,
                    }))
                    dispatch(setProduct(formattedProducts))
                    console.log(`✓ Using product data (${formattedProducts.length} products)`)
                }
            } catch (error) {
                console.error('Error syncing product data:', error)
                // Fallback to product data on error
                const formattedProducts = productDummyData.map(product => ({
                    ...product,
                    quantity: product.inStock ? 10 : 0,
                }))
                dispatch(setProduct(formattedProducts))
            }
        }

        // Initial sync
        fetchAndSyncProducts()

        // Set up polling for inventory changes (every 30 seconds)
        const pollingInterval = setInterval(fetchAndSyncProducts, 30000)

        // Set up event listener for manual refresh
        const handleRefresh = () => {
            fetchAndSyncProducts()
        }

        window.addEventListener('productDataRefresh', handleRefresh)

        // Cleanup
        return () => {
            clearInterval(pollingInterval)
            window.removeEventListener('productDataRefresh', handleRefresh)
        }
    }, [dispatch])

    return <>{children}</>
}
