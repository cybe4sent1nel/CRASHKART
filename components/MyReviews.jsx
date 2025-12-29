'use client'
import { useState, useEffect } from 'react'
import { Star, Edit2, Trash2, X, Upload, Smile } from 'lucide-react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import Image from 'next/image'

export default function MyReviews() {
    const [reviews, setReviews] = useState([])
    const [loading, setLoading] = useState(true)
    const [editingReview, setEditingReview] = useState(null)
    const [editRating, setEditRating] = useState(0)
    const [editText, setEditText] = useState('')
    const [editImages, setEditImages] = useState([])
    const [editVideos, setEditVideos] = useState([])
    const [uploading, setUploading] = useState(false)
    const [showEmojiPicker, setShowEmojiPicker] = useState(false)

    const emojis = ['😀', '😃', '😄', '😁', '😊', '🙂', '😍', '🥰', '😘', '😗', 
                    '😙', '😚', '🤗', '🤩', '🤔', '🤨', '😐', '😑', '😶', '🙄',
                    '😏', '😣', '😥', '😮', '🤐', '😯', '😪', '😫', '😴', '😌',
                    '👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '👏', '🙌', '👐',
                    '🔥', '⭐', '✨', '💯', '💪', '❤️', '💕', '💖', '💗', '💝']

    const addEmoji = (emoji) => {
        setEditText(prev => prev + emoji)
        setShowEmojiPicker(false)
    }

    useEffect(() => {
        fetchReviews()
    }, [])

    const fetchReviews = async () => {
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}')
            if (!user.email) {
                setLoading(false)
                return
            }

            const response = await fetch(`/api/user-reviews?userEmail=${user.email}`)
            const data = await response.json()

            if (data.success) {
                setReviews(data.reviews)
            }
        } catch (error) {
            console.error('Error fetching reviews:', error)
            toast.error('Failed to load reviews')
        } finally {
            setLoading(false)
        }
    }

    const handleEdit = (review) => {
        setEditingReview(review)
        setEditRating(review.rating)
        setEditText(review.review || review.message || '')
        setEditImages(review.images || [])
        setEditVideos(review.videos || [])
    }

    const handleImageUpload = async (e) => {
        const files = Array.from(e.target.files)
        if (editImages.length + files.length > 5) {
            return toast.error('Maximum 5 images allowed')
        }

        setUploading(true)
        const newImages = []

        for (const file of files) {
            if (file.size > 5 * 1024 * 1024) {
                toast.error(`${file.name} is too large (max 5MB)`)
                continue
            }

            const reader = new FileReader()
            reader.readAsDataURL(file)
            await new Promise((resolve) => {
                reader.onload = () => {
                    newImages.push(reader.result)
                    resolve()
                }
            })
        }

        setEditImages(prev => [...prev, ...newImages])
        setUploading(false)
    }

    const handleVideoUpload = async (e) => {
        const files = Array.from(e.target.files)
        if (editVideos.length + files.length > 2) {
            return toast.error('Maximum 2 videos allowed')
        }

        setUploading(true)
        const newVideos = []

        for (const file of files) {
            if (file.size > 20 * 1024 * 1024) {
                toast.error(`${file.name} is too large (max 20MB)`)
                continue
            }

            const reader = new FileReader()
            reader.readAsDataURL(file)
            await new Promise((resolve) => {
                reader.onload = () => {
                    newVideos.push(reader.result)
                    resolve()
                }
            })
        }

        setEditVideos(prev => [...prev, ...newVideos])
        setUploading(false)
    }

    const removeImage = (index) => {
        setEditImages(prev => prev.filter((_, i) => i !== index))
    }

    const removeVideo = (index) => {
        setEditVideos(prev => prev.filter((_, i) => i !== index))
    }

    const handleSaveEdit = async () => {
        if (editRating === 0) {
            return toast.error('Please select a rating')
        }

        if (!editText.trim()) {
            return toast.error('Please write a review')
        }

        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}')
            
            if (editingReview.type === 'product') {
                const response = await fetch('/api/reviews', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        reviewId: editingReview.id,
                        userId: user.email,
                        rating: editRating,
                        review: editText,
                        images: editImages,
                        videos: editVideos
                    })
                })

                if (response.ok) {
                    toast.success('Review updated successfully!')
                    setEditingReview(null)
                    fetchReviews()
                } else {
                    toast.error('Failed to update review')
                }
            } else {
                // Update app review
                const response = await fetch(`/api/feedback/${editingReview.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        rating: editRating,
                        message: editText
                    })
                })

                if (response.ok) {
                    toast.success('Review updated successfully!')
                    setEditingReview(null)
                    fetchReviews()
                } else {
                    toast.error('Failed to update review')
                }
            }
        } catch (error) {
            console.error('Error updating review:', error)
            toast.error('Failed to update review')
        }
    }

    const handleDelete = async (review) => {
        const { showConfirm } = await import('@/lib/alertUtils')
        const confirmed = await showConfirm(
            'Delete Review?',
            'Are you sure you want to delete this review?'
        )

        if (!confirmed) return

        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}')
            
            if (review.type === 'product') {
                const response = await fetch('/api/reviews', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        reviewId: review.id,
                        userId: user.email
                    })
                })

                if (response.ok) {
                    toast.success('Review deleted successfully!')
                    fetchReviews()
                } else {
                    toast.error('Failed to delete review')
                }
            } else {
                const response = await fetch(`/api/feedback/${review.id}`, {
                    method: 'DELETE'
                })

                if (response.ok) {
                    toast.success('Review deleted successfully!')
                    fetchReviews()
                } else {
                    toast.error('Failed to delete review')
                }
            }
        } catch (error) {
            console.error('Error deleting review:', error)
            toast.error('Failed to delete review')
        }
    }

    if (loading) {
        return (
            <div className="bg-white rounded-xl shadow-lg p-6">
                <p className="text-center text-gray-600">Loading your reviews...</p>
            </div>
        )
    }

    return (
        <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">My Reviews</h2>

            {reviews.length === 0 ? (
                <div className="text-center py-12 text-gray-600">
                    <p>You haven't written any reviews yet.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {reviews.map(review => (
                        <motion.div
                            key={`${review.type}-${review.id}`}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="border border-gray-200 rounded-lg p-4"
                        >
                            {editingReview?.id === review.id ? (
                                // Edit Mode
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-semibold text-gray-900">
                                            Edit Your Review
                                        </h3>
                                        <button
                                            onClick={() => setEditingReview(null)}
                                            className="text-gray-500 hover:text-gray-700"
                                        >
                                            <X size={20} />
                                        </button>
                                    </div>

                                    {/* Rating */}
                                    <div className="flex gap-2">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                onClick={() => setEditRating(star)}
                                            >
                                                <Star
                                                    size={24}
                                                    className={`transition ${
                                                        editRating >= star
                                                            ? 'fill-yellow-400 text-yellow-400'
                                                            : 'text-gray-300'
                                                    }`}
                                                />
                                            </button>
                                        ))}
                                    </div>

                                    {/* Review Text */}
                                    <div className="relative">
                                        <textarea
                                            value={editText}
                                            onChange={(e) => setEditText(e.target.value)}
                                            rows={4}
                                            className="w-full border border-gray-300 rounded-lg p-3 pr-12 focus:outline-none focus:ring-2 focus:ring-red-500"
                                            placeholder="Update your review..."
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                            className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                                        >
                                            <Smile size={20} />
                                        </button>
                                        
                                        {showEmojiPicker && (
                                            <div className="absolute right-0 top-full mt-2 bg-white border border-gray-300 rounded-lg shadow-lg p-2 z-10 grid grid-cols-8 gap-1 max-h-48 overflow-y-auto">
                                                {emojis.map((emoji, idx) => (
                                                    <button
                                                        key={idx}
                                                        type="button"
                                                        onClick={() => addEmoji(emoji)}
                                                        className="text-2xl hover:bg-gray-100 rounded p-1"
                                                    >
                                                        {emoji}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Media Upload (Only for product reviews) */}
                                    {review.type === 'product' && (
                                        <div className="space-y-3">
                                            {/* Images */}
                                            <div>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    multiple
                                                    onChange={handleImageUpload}
                                                    disabled={uploading || editImages.length >= 5}
                                                    className="hidden"
                                                    id={`image-upload-${review.id}`}
                                                />
                                                <label
                                                    htmlFor={`image-upload-${review.id}`}
                                                    className={`block w-full p-2 border-2 border-dashed rounded-lg text-center cursor-pointer text-sm ${
                                                        uploading || editImages.length >= 5
                                                            ? 'border-gray-300 opacity-50 cursor-not-allowed'
                                                            : 'border-gray-300 hover:border-red-500'
                                                    }`}
                                                >
                                                    📷 Upload Images ({editImages.length}/5)
                                                </label>
                                                {editImages.length > 0 && (
                                                    <div className="grid grid-cols-5 gap-2 mt-2">
                                                        {editImages.map((img, idx) => (
                                                            <div key={idx} className="relative group">
                                                                <img
                                                                    src={img}
                                                                    alt={`Upload ${idx + 1}`}
                                                                    className="w-full h-16 object-cover rounded"
                                                                />
                                                                <button
                                                                    onClick={() => removeImage(idx)}
                                                                    className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100"
                                                                >
                                                                    ×
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Videos */}
                                            <div>
                                                <input
                                                    type="file"
                                                    accept="video/*"
                                                    multiple
                                                    onChange={handleVideoUpload}
                                                    disabled={uploading || editVideos.length >= 2}
                                                    className="hidden"
                                                    id={`video-upload-${review.id}`}
                                                />
                                                <label
                                                    htmlFor={`video-upload-${review.id}`}
                                                    className={`block w-full p-2 border-2 border-dashed rounded-lg text-center cursor-pointer text-sm ${
                                                        uploading || editVideos.length >= 2
                                                            ? 'border-gray-300 opacity-50 cursor-not-allowed'
                                                            : 'border-gray-300 hover:border-red-500'
                                                    }`}
                                                >
                                                    🎥 Upload Videos ({editVideos.length}/2)
                                                </label>
                                                {editVideos.length > 0 && (
                                                    <div className="grid grid-cols-2 gap-2 mt-2">
                                                        {editVideos.map((vid, idx) => (
                                                            <div key={idx} className="relative group">
                                                                <video
                                                                    src={vid}
                                                                    className="w-full h-16 object-cover rounded"
                                                                />
                                                                <button
                                                                    onClick={() => removeVideo(idx)}
                                                                    className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100"
                                                                >
                                                                    ×
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Action Buttons */}
                                    <div className="flex gap-3">
                                        <button
                                            onClick={handleSaveEdit}
                                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold"
                                        >
                                            Save Changes
                                        </button>
                                        <button
                                            onClick={() => setEditingReview(null)}
                                            className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg font-semibold"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                // View Mode
                                <>
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                                    review.type === 'product'
                                                        ? 'bg-blue-100 text-blue-800'
                                                        : 'bg-green-100 text-green-800'
                                                }`}>
                                                    {review.type === 'product' ? 'Product Review' : 'App Review'}
                                                </span>
                                                <div className="flex">
                                                    {[...Array(5)].map((_, i) => (
                                                        <Star
                                                            key={i}
                                                            size={16}
                                                            className={
                                                                i < review.rating
                                                                    ? 'fill-yellow-400 text-yellow-400'
                                                                    : 'text-gray-300'
                                                            }
                                                        />
                                                    ))}
                                                </div>
                                            </div>

                                            {review.type === 'product' && review.productTitle && (
                                                <div className="flex items-center gap-2 mb-2">
                                                    {review.productImage && (
                                                        <img
                                                            src={review.productImage}
                                                            alt={review.productTitle}
                                                            className="w-12 h-12 object-cover rounded"
                                                        />
                                                    )}
                                                    <p className="font-medium text-gray-900">
                                                        {review.productTitle}
                                                    </p>
                                                </div>
                                            )}

                                            {review.title && (
                                                <h3 className="font-semibold text-gray-900 mb-1">
                                                    {review.title}
                                                </h3>
                                            )}

                                            <p className="text-gray-700 mb-2">
                                                {review.review || review.message}
                                            </p>

                                            {/* Images */}
                                            {review.images && review.images.length > 0 && (
                                                <div className="grid grid-cols-4 gap-2 mb-2">
                                                    {review.images.map((img, idx) => (
                                                        <img
                                                            key={idx}
                                                            src={img}
                                                            alt={`Review ${idx + 1}`}
                                                            className="w-full h-20 object-cover rounded cursor-pointer"
                                                            onClick={() => window.open(img, '_blank')}
                                                        />
                                                    ))}
                                                </div>
                                            )}

                                            {/* Videos */}
                                            {review.videos && review.videos.length > 0 && (
                                                <div className="grid grid-cols-2 gap-2 mb-2">
                                                    {review.videos.map((vid, idx) => (
                                                        <video
                                                            key={idx}
                                                            src={vid}
                                                            className="w-full h-24 object-cover rounded"
                                                            controls
                                                        />
                                                    ))}
                                                </div>
                                            )}

                                            <p className="text-xs text-gray-500">
                                                {new Date(review.createdAt).toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                })}
                                            </p>
                                        </div>

                                        <div className="flex gap-2 ml-4">
                                            <button
                                                onClick={() => handleEdit(review)}
                                                className="p-2 text-blue-600 hover:bg-blue-100 rounded transition"
                                                title="Edit review"
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(review)}
                                                className="p-2 text-red-600 hover:bg-red-100 rounded transition"
                                                title="Delete review"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    )
}
