'use client'
import { ArrowRight, StarIcon, AlertTriangle, Store } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useState, useEffect } from "react"

const ProductDescription = ({ product }) => {

    const [selectedTab, setSelectedTab] = useState('Description')
    const [reviews, setReviews] = useState([])
    const [averageRating, setAverageRating] = useState(0)
    const [reviewsLoading, setReviewsLoading] = useState(false)

    useEffect(() => {
        const fetchReviews = async () => {
            if (!product?.id) return
            
            setReviewsLoading(true)
            try {
                const response = await fetch(`/api/products/ratings?productId=${product.id}&limit=10`)
                if (response.ok) {
                    const data = await response.json()
                    if (data.success) {
                        setReviews(data.ratings || [])
                        setAverageRating(data.averageRating || 0)
                    } else {
                        setReviews([])
                        setAverageRating(0)
                    }
                } else {
                    // If API fails, just show no reviews
                    setReviews([])
                    setAverageRating(0)
                }
            } catch (error) {
                console.error('Error fetching reviews:', error)
                setReviews([])
                setAverageRating(0)
            } finally {
                setReviewsLoading(false)
            }
        }
        
        fetchReviews()
    }, [product?.id])

    return (
        <div className="my-18 text-sm text-slate-600 dark:text-slate-400">

            {/* Out of Stock Alert */}
            {product.quantity === 0 && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6 flex gap-3">
                    <AlertTriangle className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" size={18} />
                    <div>
                        <p className="font-semibold text-red-800 dark:text-red-300 mb-1">This product is currently out of stock</p>
                        <p className="text-sm text-red-700 dark:text-red-400">Check back soon or request a notification to be alerted when it's available again.</p>
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div className="flex border-b border-slate-200 dark:border-slate-700 mb-6 max-w-2xl">
                {['Description', 'Reviews'].map((tab, index) => (
                    <button className={`${tab === selectedTab ? 'border-b-[1.5px] font-semibold dark:text-white' : 'text-slate-400 dark:text-slate-500'} px-3 py-2 font-medium`} key={index} onClick={() => setSelectedTab(tab)}>
                        {tab}
                    </button>
                ))}
            </div>

            {/* Description */}
            {selectedTab === "Description" && (
                <p className="max-w-xl">{product.description}</p>
            )}

            {/* Reviews */}
            {selectedTab === "Reviews" && (
                <div className="flex flex-col gap-3 mt-14">
                    {/* Average Rating Summary */}
                    <div className="mb-8 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <div className="flex items-center gap-4">
                            <div className="text-center">
                                <p className="text-3xl font-bold text-slate-900 dark:text-white">{averageRating.toFixed(1)}</p>
                                <div className="flex gap-1 mt-2">
                                    {Array(5).fill('').map((_, index) => (
                                        <StarIcon key={index} size={16} className='text-transparent' fill={averageRating >= index + 1 ? "#FCD34D" : "#D1D5DB"} />
                                    ))}
                                </div>
                                <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">{reviews.length} reviews</p>
                            </div>
                        </div>
                    </div>

                    {/* Reviews List */}
                    {reviewsLoading ? (
                        <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                            <p className="text-slate-600 dark:text-slate-400 mt-2">Loading reviews...</p>
                        </div>
                    ) : reviews.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-slate-600 dark:text-slate-400">No reviews yet. Be the first to review!</p>
                        </div>
                    ) : (
                        reviews.map((item, index) => (
                            <div key={index} className="flex gap-5 mb-10 border-b border-slate-200 dark:border-slate-700 pb-8 last:border-0">
                                {item.user?.image ? (
                                    <Image src={item.user.image} alt={item.user?.name} className="size-10 rounded-full flex-shrink-0" width={100} height={100} />
                                ) : (
                                    <div className="size-10 rounded-full flex-shrink-0 bg-slate-300 dark:bg-slate-600 flex items-center justify-center">
                                        <span className="text-xs font-bold">{item.user?.name?.charAt(0) || '?'}</span>
                                    </div>
                                )}
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-2">
                                        <div>
                                            <p className="font-medium text-slate-800 dark:text-white">{item.user?.name}</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">{new Date(item.createdAt).toDateString()}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 mb-3">
                                        {Array(5).fill('').map((_, index) => (
                                            <StarIcon key={index} size={14} className='text-transparent' fill={item.rating >= index + 1 ? "#FCD34D" : "#D1D5DB"} />
                                        ))}
                                        <span className="text-xs font-semibold text-slate-800 dark:text-white ml-2">{item.rating} out of 5</span>
                                    </div>
                                    <p className="text-sm max-w-lg dark:text-slate-300">{item.review}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Store Page */}
             {product.store && (
                 <div className="flex gap-3 mt-14">
                     <div className="size-11 rounded-full ring ring-slate-400 dark:ring-slate-600 flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-600">
                         <Store size={20} className="text-white" />
                     </div>
                     <div>
                         <p className="font-medium text-slate-600 dark:text-slate-400">Product by {product.store.name}</p>
                         {product.store.username && (
                             <Link href={`/shop/${product.store.username}`} className="flex items-center gap-1.5 text-green-500"> view store <ArrowRight size={14} /></Link>
                         )}
                     </div>
                 </div>
             )}
        </div>
    )
}

export default ProductDescription