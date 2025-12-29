'use client'
import { useState, useEffect } from 'react'
import { Star, ThumbsUp, MessageSquare, User, Edit2, Trash2, X } from 'lucide-react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'

export default function ProductReviews({ productId }) {
    const [reviews, setReviews] = useState([])
    const [showReviewForm, setShowReviewForm] = useState(false)
    const [rating, setRating] = useState(0)
    const [hoverRating, setHoverRating] = useState(0)
    const [reviewText, setReviewText] = useState('')
    const [userName, setUserName] = useState('')
    const [editingReviewId, setEditingReviewId] = useState(null)
    const [editRating, setEditRating] = useState(0)
    const [editReviewText, setEditReviewText] = useState('')
    const [editHoverRating, setEditHoverRating] = useState(0)

    useEffect(() => {
        // Load reviews from localStorage
        const allReviews = localStorage.getItem('productReviews')
        if (allReviews) {
            const parsed = JSON.parse(allReviews)
            const productReviews = parsed.filter(r => r.productId === productId)
            setReviews(productReviews)
        } else {
            // Mock reviews
            setReviews([
                {
                    id: 1,
                    productId,
                    userName: 'Rahul Sharma',
                    rating: 5,
                    text: 'Excellent product! Worth every rupee. Fast delivery and great quality.',
                    date: '2025-11-20',
                    helpful: 12
                },
                {
                    id: 2,
                    productId,
                    userName: 'Priya Singh',
                    rating: 4,
                    text: 'Good product. Exactly as described. Packaging could be better.',
                    date: '2025-11-18',
                    helpful: 8
                },
                {
                    id: 3,
                    productId,
                    userName: 'Amit Kumar',
                    rating: 5,
                    text: 'Amazing! This is my second purchase from CrashKart. Never disappointed.',
                    date: '2025-11-15',
                    helpful: 15
                }
            ])
        }

        // Get current user
        const user = localStorage.getItem('user')
        if (user) {
            const parsed = JSON.parse(user)
            setUserName(parsed.name)
        }
    }, [productId])

    const handleSubmitReview = (e) => {
        e.preventDefault()

        if (!userName) {
            toast.error('Please login to submit a review')
            return
        }

        if (rating === 0) {
            toast.error('Please select a rating')
            return
        }

        if (!reviewText.trim()) {
            toast.error('Please write a review')
            return
        }

        const newReview = {
            id: Date.now(),
            productId,
            userName,
            rating,
            text: reviewText,
            date: new Date().toISOString().split('T')[0],
            helpful: 0
        }

        const updatedReviews = [newReview, ...reviews]
        setReviews(updatedReviews)

        // Save to localStorage
        const allReviews = localStorage.getItem('productReviews')
        const all = allReviews ? JSON.parse(allReviews) : []
        all.push(newReview)
        localStorage.setItem('productReviews', JSON.stringify(all))

        // Reset form
        setRating(0)
        setReviewText('')
        setShowReviewForm(false)
        toast.success('Review submitted successfully!')
    }

    const handleEditReview = (review) => {
        setEditingReviewId(review.id)
        setEditRating(review.rating)
        setEditReviewText(review.text)
    }

    const handleSaveEditedReview = (reviewId) => {
        if (editRating === 0) {
            toast.error('Please select a rating')
            return
        }

        if (!editReviewText.trim()) {
            toast.error('Please write a review')
            return
        }

        // Update review in state
        const updatedReviews = reviews.map(r => 
            r.id === reviewId 
                ? { ...r, rating: editRating, text: editReviewText, date: new Date().toISOString().split('T')[0] }
                : r
        )
        setReviews(updatedReviews)

        // Update in localStorage
        const allReviews = localStorage.getItem('productReviews')
        if (allReviews) {
            const all = JSON.parse(allReviews)
            const updated = all.map(r => 
                r.id === reviewId 
                    ? { ...r, rating: editRating, text: editReviewText, date: new Date().toISOString().split('T')[0] }
                    : r
            )
            localStorage.setItem('productReviews', JSON.stringify(updated))
        }

        setEditingReviewId(null)
        setEditRating(0)
        setEditReviewText('')
        toast.success('Review updated successfully!')
    }

    const handleDeleteReview = async (reviewId) => {
        const { showConfirm } = await import('@/lib/alertUtils');
        const confirmed = await showConfirm(
            'Delete Review?',
            'Are you sure you want to delete this review? This action cannot be undone.'
        );
        
        if (!confirmed) return;
        
        const updatedReviews = reviews.filter(r => r.id !== reviewId)
        setReviews(updatedReviews)

        // Update in localStorage
        const allReviews = localStorage.getItem('productReviews')
        if (allReviews) {
            const all = JSON.parse(allReviews)
            const updated = all.filter(r => r.id !== reviewId)
            localStorage.setItem('productReviews', JSON.stringify(updated))
        }

        toast.success('Review deleted successfully!')
    }

    const avgRating = reviews.length > 0 
        ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
        : 0

    return (
        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 border border-slate-100">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">
                        Customer Reviews
                    </h2>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                            <span className="text-3xl font-bold text-yellow-500">{avgRating}</span>
                            <Star className="fill-yellow-400 text-yellow-400" size={24} />
                        </div>
                        <span className="text-slate-600">Based on {reviews.length} reviews</span>
                    </div>
                </div>
                {userName && !showReviewForm && (
                    <button
                        onClick={() => setShowReviewForm(true)}
                        className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition"
                    >
                        Write Review
                    </button>
                )}
            </div>

            {/* Review Form */}
            {showReviewForm && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-slate-50 rounded-xl p-6 mb-6 border border-slate-200"
                >
                    <h3 className="font-semibold text-slate-800 mb-4">Write Your Review</h3>
                    <form onSubmit={handleSubmitReview} className="space-y-4">
                        {/* Rating Stars */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Your Rating
                            </label>
                            <div className="flex gap-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        onClick={() => setRating(star)}
                                        onMouseEnter={() => setHoverRating(star)}
                                        onMouseLeave={() => setHoverRating(0)}
                                    >
                                        <Star
                                            size={32}
                                            className={`transition ${
                                                (hoverRating || rating) >= star
                                                    ? 'fill-yellow-400 text-yellow-400'
                                                    : 'text-slate-300'
                                            }`}
                                        />
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Review Text */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Your Review
                            </label>
                            <textarea
                                value={reviewText}
                                onChange={(e) => setReviewText(e.target.value)}
                                rows={4}
                                placeholder="Share your experience with this product..."
                                className="w-full border border-slate-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-red-500"
                            />
                        </div>

                        {/* Buttons */}
                        <div className="flex gap-3">
                            <button
                                type="submit"
                                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition"
                            >
                                Submit Review
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowReviewForm(false)
                                    setRating(0)
                                    setReviewText('')
                                }}
                                className="px-6 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-semibold transition"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </motion.div>
            )}

            {/* Reviews List */}
            <div className="space-y-4">
                {reviews.map((review, index) => (
                    <motion.div
                        key={review.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-slate-50 rounded-xl p-6 border border-slate-200 hover:border-red-200 transition"
                    >
                        {editingReviewId === review.id ? (
                            // Edit Mode
                            <div className="space-y-4">
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="font-semibold text-slate-800">Edit Your Review</h4>
                                    <button 
                                        onClick={() => setEditingReviewId(null)}
                                        className="text-gray-500 hover:text-gray-700"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                {/* Edit Rating */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Rating
                                    </label>
                                    <div className="flex gap-2">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                type="button"
                                                onClick={() => setEditRating(star)}
                                                onMouseEnter={() => setEditHoverRating(star)}
                                                onMouseLeave={() => setEditHoverRating(0)}
                                            >
                                                <Star
                                                    size={28}
                                                    className={`transition ${
                                                        (editHoverRating || editRating) >= star
                                                            ? 'fill-yellow-400 text-yellow-400'
                                                            : 'text-slate-300'
                                                    }`}
                                                />
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Edit Review Text */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Review
                                    </label>
                                    <textarea
                                        value={editReviewText}
                                        onChange={(e) => setEditReviewText(e.target.value)}
                                        rows={4}
                                        placeholder="Update your review..."
                                        className="w-full border border-slate-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-red-500"
                                    />
                                </div>

                                {/* Edit Buttons */}
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => handleSaveEditedReview(review.id)}
                                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition"
                                    >
                                        Save Changes
                                    </button>
                                    <button
                                        onClick={() => setEditingReviewId(null)}
                                        className="px-4 py-2 bg-slate-300 hover:bg-slate-400 text-slate-800 rounded-lg font-semibold transition"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            // View Mode
                            <>
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-gradient-to-br from-red-400 to-orange-400 rounded-full flex items-center justify-center text-white font-bold">
                                            {review.userName.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-slate-800">{review.userName}</p>
                                            <p className="text-xs text-slate-500">{new Date(review.date).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="flex">
                                            {[...Array(5)].map((_, i) => (
                                                <Star
                                                    key={i}
                                                    size={16}
                                                    className={i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300'}
                                                />
                                            ))}
                                        </div>
                                        {userName === review.userName && (
                                            <div className="flex gap-2 ml-4">
                                                <button 
                                                    onClick={() => handleEditReview(review)}
                                                    className="text-blue-600 hover:bg-blue-100 p-2 rounded transition"
                                                    title="Edit review"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button 
                                                    onClick={() => handleDeleteReview(review.id)}
                                                    className="text-red-600 hover:bg-red-100 p-2 rounded transition"
                                                    title="Delete review"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <p className="text-slate-700 leading-relaxed mb-4">
                                    {review.text}
                                </p>

                                <div className="flex items-center gap-4 text-sm">
                                    <button className="flex items-center gap-2 text-slate-600 hover:text-red-600 transition">
                                        <ThumbsUp size={16} />
                                        <span>Helpful ({review.helpful})</span>
                                    </button>
                                    <button className="flex items-center gap-2 text-slate-600 hover:text-blue-600 transition">
                                        <MessageSquare size={16} />
                                        <span>Reply</span>
                                    </button>
                                </div>
                            </>
                        )}
                    </motion.div>
                ))}
            </div>

            {/* No Reviews State */}
            {reviews.length === 0 && (
                <div className="text-center py-12">
                    <MessageSquare size={48} className="mx-auto text-slate-300 mb-4" />
                    <p className="text-slate-600 mb-4">No reviews yet. Be the first to review!</p>
                    {userName && (
                        <button
                            onClick={() => setShowReviewForm(true)}
                            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition"
                        >
                            Write First Review
                        </button>
                    )}
                </div>
            )}
        </div>
    )
}
