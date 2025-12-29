'use client'
import { useState, useEffect } from 'react'
import { Star, User, Package } from 'lucide-react'
import { motion } from 'framer-motion'

export default function AdminReviewsPage() {
    const [reviews, setReviews] = useState([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('all')

    useEffect(() => {
        fetchReviews()
    }, [])

    const fetchReviews = async () => {
        try {
            console.log('🔍 Admin fetching all reviews')
            const response = await fetch('/api/ratings/get-all-ratings')
            const data = await response.json()
            console.log('⭐ Admin reviews received:', data.ratings?.length || 0, 'items')
            if (data.success) {
                setReviews(data.ratings)
            } else {
                console.error('❌ Failed to fetch admin reviews')
            }
        } catch (error) {
            console.error('❌ Error fetching reviews:', error)
        } finally {
            setLoading(false)
        }
    }

    const filteredReviews = filter === 'all' 
        ? reviews 
        : reviews.filter(r => r.rating === parseInt(filter))

    const getRatingColor = (rating) => {
        if (rating >= 4) return 'text-green-500'
        if (rating >= 3) return 'text-yellow-500'
        return 'text-red-500'
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-8"
        >
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-4xl font-bold text-slate-800 dark:text-white mb-2">Feedback & Reviews</h1>
                <p className="text-slate-600 dark:text-slate-400">All product reviews and customer feedback</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
                <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                    <p className="text-slate-600 dark:text-slate-400 text-sm mb-2">Total Reviews</p>
                    <p className="text-3xl font-bold text-slate-800 dark:text-white">{reviews.length}</p>
                </div>
                <div className="bg-green-50 dark:bg-green-900/30 rounded-xl p-6 border border-green-200 dark:border-green-800">
                    <p className="text-green-700 dark:text-green-300 text-sm mb-2">5 Stars</p>
                    <p className="text-3xl font-bold text-green-800 dark:text-green-200">{reviews.filter(r => r.rating === 5).length}</p>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/30 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
                    <p className="text-blue-700 dark:text-blue-300 text-sm mb-2">4 Stars</p>
                    <p className="text-3xl font-bold text-blue-800 dark:text-blue-200">{reviews.filter(r => r.rating === 4).length}</p>
                </div>
                <div className="bg-yellow-50 dark:bg-yellow-900/30 rounded-xl p-6 border border-yellow-200 dark:border-yellow-800">
                    <p className="text-yellow-700 dark:text-yellow-300 text-sm mb-2">3 Stars</p>
                    <p className="text-3xl font-bold text-yellow-800 dark:text-yellow-200">{reviews.filter(r => r.rating === 3).length}</p>
                </div>
                <div className="bg-red-50 dark:bg-red-900/30 rounded-xl p-6 border border-red-200 dark:border-red-800">
                    <p className="text-red-700 dark:text-red-300 text-sm mb-2">1-2 Stars</p>
                    <p className="text-3xl font-bold text-red-800 dark:text-red-200">{reviews.filter(r => r.rating <= 2).length}</p>
                </div>
            </div>

            {/* Filters */}
            <div className="mb-6 flex gap-3 overflow-x-auto pb-2">
                {['all', '5', '4', '3', '2', '1'].map(rating => (
                    <button
                        key={rating}
                        onClick={() => setFilter(rating)}
                        className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition ${
                            filter === rating
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white hover:bg-slate-300 dark:hover:bg-slate-600'
                        }`}
                    >
                        {rating === 'all' ? 'ALL' : `${rating} ★`}
                    </button>
                ))}
            </div>

            {/* Reviews List */}
            <div className="space-y-4">
                {filteredReviews.length === 0 ? (
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-12 text-center border border-slate-200 dark:border-slate-700">
                        <Star size={48} className="mx-auto text-slate-400 dark:text-slate-600 mb-4" />
                        <p className="text-slate-600 dark:text-slate-400">No reviews found</p>
                    </div>
                ) : (
                    filteredReviews.map((review, idx) => (
                        <motion.div
                            key={review.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.02 }}
                            className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 hover:shadow-lg transition"
                        >
                            <div className="flex items-start gap-4">
                                {/* Product Image */}
                                {review.product?.images?.[0] && (
                                    <img
                                        src={review.product.images[0]}
                                        alt={review.product.name}
                                        className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
                                    />
                                )}

                                <div className="flex-1">
                                    {/* Product Name */}
                                    <div className="flex items-start justify-between gap-4 mb-3">
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                                <Package size={18} className="text-blue-600" />
                                                {review.product?.name || 'Product'}
                                            </h3>
                                            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                                                Order: {review.orderId?.slice(-8)}
                                            </p>
                                        </div>

                                        {/* Rating */}
                                        <div className="flex items-center gap-2">
                                            <div className="flex gap-1">
                                                {[1, 2, 3, 4, 5].map((star) => (
                                                    <Star
                                                        key={star}
                                                        size={20}
                                                        className={star <= review.rating ? getRatingColor(review.rating) : 'text-slate-300 dark:text-slate-600'}
                                                        fill={star <= review.rating ? 'currentColor' : 'none'}
                                                    />
                                                ))}
                                            </div>
                                            <span className="text-lg font-bold text-slate-800 dark:text-white">
                                                {review.rating}/5
                                            </span>
                                        </div>
                                    </div>

                                    {/* Review Text */}
                                    <p className="text-slate-700 dark:text-slate-300 mb-4 leading-relaxed">
                                        {review.review}
                                    </p>

                                    {/* User & Date */}
                                    <div className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                                            <User size={16} />
                                            <span>User ID: {review.userId?.slice(-8)}</span>
                                        </div>
                                        <span className="text-slate-500 dark:text-slate-500">
                                            {new Date(review.createdAt).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric'
                                            })}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>
        </motion.div>
    )
}
