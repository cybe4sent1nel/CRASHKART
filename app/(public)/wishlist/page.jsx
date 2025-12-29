'use client'
import { useRouter } from 'next/navigation'
import { Heart, ShoppingCart, Trash2, ShoppingBag, TrendingDown, Package, Bell, Star, ArrowRight, CheckSquare } from 'lucide-react'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useSelector, useDispatch } from 'react-redux'
import { removeFromWishlist, addToWishlist, clearWishlist } from '@/lib/features/wishlist/wishlistSlice'
import { addToCart } from '@/lib/features/cart/cartSlice'
import toast from 'react-hot-toast'
import Link from 'next/link'
import EmptyGhostAnimation from '@/components/animations/EmptyGhostAnimation'
import { motion } from 'framer-motion'
import NeonCheckbox from '@/components/NeonCheckbox'

export default function Wishlist() {
    const router = useRouter()
    const [wishlist, setWishlist] = useState([])
    const [currency] = useState(() => process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '₹')
    const wishlistItems = useSelector(state => {
        const items = state.wishlist?.items
        return Array.isArray(items) ? items : []
    })
    const dispatch = useDispatch()
    
    // Bulk selection state
    const [selectedItems, setSelectedItems] = useState([])
    const [selectAll, setSelectAll] = useState(false)

    useEffect(() => {
        // Use Redux state first, fallback to localStorage
        if (Array.isArray(wishlistItems) && wishlistItems.length > 0) {
            setWishlist(wishlistItems)
        } else {
            const savedWishlist = localStorage.getItem('wishlist')
            if (savedWishlist) {
                try {
                    const parsed = JSON.parse(savedWishlist)
                    setWishlist(Array.isArray(parsed) ? parsed : [])
                } catch (error) {
                    console.error('Error parsing wishlist:', error)
                    setWishlist([])
                }
            }
        }
    }, [wishlistItems])

    // Sync selectAll state when items change
    useEffect(() => {
        if (wishlist.length > 0 && selectedItems.length === wishlist.length) {
            setSelectAll(true)
        } else {
            setSelectAll(false)
        }
    }, [selectedItems, wishlist])

    // Bulk selection handlers
    const handleSelectItem = (productId) => {
        setSelectedItems(prev => 
            prev.includes(productId) 
                ? prev.filter(id => id !== productId) 
                : [...prev, productId]
        )
    }

    const handleSelectAll = () => {
        if (selectAll) {
            setSelectedItems([])
        } else {
            setSelectedItems(wishlist.map(item => item.id))
        }
    }

    const handleBulkDelete = () => {
        selectedItems.forEach(productId => {
            dispatch(removeFromWishlist(productId))
        })
        toast.success(`${selectedItems.length} item(s) removed from wishlist`)
        setSelectedItems([])
    }

    const handleMoveAllToCart = () => {
        const selectedProducts = wishlist.filter(item => selectedItems.includes(item.id))
        selectedProducts.forEach(product => {
            dispatch(addToCart({ productId: product.id }))
            dispatch(removeFromWishlist(product.id))
        })
        toast.success(`${selectedItems.length} item(s) moved to cart`)
        setSelectedItems([])
    }

    const handleRemoveFromWishlist = (productId, productName) => {
        dispatch(removeFromWishlist(productId))
        toast.success(`${productName} removed from wishlist`)
    }

    const handleAddToCart = (product) => {
        dispatch(addToCart({ productId: product.id }))
        toast.success(`${product.name} added to cart!`)
    }

    const handleBuyNow = (product) => {
         // Use sale price if available for flash sale items
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
         router.push('/buy-now-checkout')
     }

    if (wishlist.length === 0) {
        return (
            <div className="min-h-[70vh] flex items-center justify-center mx-6">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center"
                >
                    <EmptyGhostAnimation width="250px" height="250px" />
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full mb-4 mt-2">
                        <Heart className="w-8 h-8 text-red-400" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Your Wishlist is Empty</h1>
                    <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-md mx-auto">
                        Save items you love to your wishlist and get notified when prices drop!
                    </p>
                    <button
                        onClick={() => router.push('/shop')}
                        className="inline-flex items-center gap-2 px-8 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl transition font-medium"
                    >
                        <ShoppingBag className="w-5 h-5" />
                        Explore Products
                    </button>
                </motion.div>
            </div>
        )
    }

    return (
        <div className="mx-6 my-10 min-h-[70vh]">
            {/* Header */}
            <div className="max-w-7xl mx-auto mb-8">
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-xl">
                            <Heart className="w-6 h-6 text-red-500" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">My Wishlist</h1>
                            <p className="text-sm text-slate-500 dark:text-slate-400">{wishlist.length} saved item{wishlist.length !== 1 ? 's' : ''}</p>
                        </div>
                    </div>
                    <Link href="/shop" className="flex items-center gap-2 text-red-500 hover:text-red-600 font-medium transition-colors">
                        <ShoppingBag className="w-4 h-4" />
                        Continue Shopping
                    </Link>
                </div>
            </div>

            {/* Bulk Actions Bar */}
            <div className="max-w-7xl mx-auto bg-white dark:bg-slate-800 rounded-xl p-4 mb-6 shadow-md flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                    <NeonCheckbox 
                        checked={selectAll}
                        onChange={handleSelectAll}
                        size={20}
                    />
                    <span className="text-slate-700 dark:text-slate-200 font-medium">
                        {selectedItems.length > 0 ? `${selectedItems.length} selected` : 'Select All'}
                    </span>
                </div>
                {selectedItems.length > 0 && (
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleMoveAllToCart}
                            className="flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 transition font-medium"
                        >
                            <ShoppingCart className="w-4 h-4" />
                            Move to Cart
                        </button>
                        <button
                            onClick={handleBulkDelete}
                            className="flex items-center gap-2 px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition font-medium"
                        >
                            <Trash2 className="w-4 h-4" />
                            Remove Selected
                        </button>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-7xl mx-auto">
                {wishlist.map((product, index) => (
                    <motion.div 
                        key={product.id ? `${product.id}-${index}` : index} 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="bg-white dark:bg-slate-800 rounded-2xl shadow-md hover:shadow-xl transition-all overflow-hidden group relative"
                    >
                        {/* Selection Checkbox */}
                        <div className="absolute top-3 left-3 z-10">
                            <NeonCheckbox 
                                checked={selectedItems.includes(product.id)}
                                onChange={() => handleSelectItem(product.id)}
                                size={20}
                            />
                        </div>
                        
                        {/* Product Image - Clickable */}
                        <Link href={`/product/${product.id}`}>
                             <div className="relative w-full h-48 bg-slate-100 dark:bg-slate-700 flex items-center justify-center cursor-pointer overflow-hidden group-hover:bg-slate-50 dark:group-hover:bg-slate-600 transition">
                                  {product.images && product.images[0] && (
                                      <Image
                                          src={product.images[0]}
                                          alt={product.name}
                                          width={250}
                                          height={200}
                                          className="object-contain max-h-48 group-hover:scale-110 transition duration-300"
                                          priority={false}
                                      />
                                  )}
                                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition flex items-center justify-center">
                                      <span className="text-white opacity-0 group-hover:opacity-100 transition font-semibold">View Details</span>
                                  </div>
                              </div>
                         </Link>

                         {/* Product Info */}
                         <div className="p-4 flex flex-col h-full">
                              {/* Product Name - Clickable */}
                              <Link href={`/product/${product.id}`} className="hover:text-red-600 transition">
                                  <h3 className="font-semibold text-slate-800 dark:text-white mb-2 line-clamp-2 flex-grow hover:text-red-600 transition">{product.name}</h3>
                              </Link>

                             {/* Price Section */}
                              <div className="flex items-center justify-between mb-4">
                                  <div>
                                      <span className="text-2xl font-bold text-red-600">{currency}{product.price}</span>
                                      {product.mrp && product.mrp > product.price && (
                                          <span className="text-sm text-slate-500 dark:text-slate-400 line-through ml-2">{currency}{product.mrp}</span>
                                      )}
                                  </div>
                                  <button
                                      onClick={() => handleRemoveFromWishlist(product.id, product.name)}
                                      className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-slate-700 p-2 rounded-full flex-shrink-0 transition"
                                      title="Remove from wishlist"
                                  >
                                      <Trash2 size={18} />
                                  </button>
                              </div>

                             {/* Action Buttons */}
                              <div className="flex gap-2 flex-col sm:flex-row">
                                  <button
                                      onClick={() => handleBuyNow(product)}
                                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition font-medium"
                                  >
                                      Buy Now
                                  </button>
                                  <button
                                      onClick={() => handleAddToCart(product)}
                                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-white rounded-lg transition font-medium"
                                  >
                                      <ShoppingCart size={16} />
                                      Add to Cart
                                  </button>
                              </div>
                              </div>
                              </motion.div>
                              ))}
                              </div>
        </div>
    )
}
