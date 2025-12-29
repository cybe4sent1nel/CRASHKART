'use client'

import { Star, Smile } from 'lucide-react';
import React, { useState, useEffect } from 'react'
import { XIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { useDispatch } from 'react-redux';

const RatingModal = ({ ratingModal, setRatingModal }) => {

    const [rating, setRating] = useState(0);
    const [review, setReview] = useState('');
    const [userName, setUserName] = useState('');
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [images, setImages] = useState([]);
    const [videos, setVideos] = useState([]);
    const [uploading, setUploading] = useState(false);
    const dispatch = useDispatch();

    // Common emojis for reviews
    const emojis = ['😀', '😃', '😄', '😁', '😊', '🙂', '😍', '🥰', '😘', '😗', 
                    '😙', '😚', '🤗', '🤩', '🤔', '🤨', '😐', '😑', '😶', '🙄',
                    '😏', '😣', '😥', '😮', '🤐', '😯', '😪', '😫', '😴', '😌',
                    '👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '👏', '🙌', '👐',
                    '🔥', '⭐', '✨', '💯', '💪', '❤️', '💕', '💖', '💗', '💝'];

    const addEmoji = (emoji) => {
        setReview(prev => prev + emoji);
        setShowEmojiPicker(false);
    };

    const handleImageUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (images.length + files.length > 5) {
            return toast.error('Maximum 5 images allowed');
        }

        setUploading(true);
        const newImages = [];

        for (const file of files) {
            if (file.size > 5 * 1024 * 1024) {
                toast.error(`${file.name} is too large (max 5MB)`);
                continue;
            }

            const reader = new FileReader();
            reader.readAsDataURL(file);
            await new Promise((resolve) => {
                reader.onload = () => {
                    newImages.push(reader.result);
                    resolve();
                };
            });
        }

        setImages(prev => [...prev, ...newImages]);
        setUploading(false);
    };

    const handleVideoUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (videos.length + files.length > 2) {
            return toast.error('Maximum 2 videos allowed');
        }

        setUploading(true);
        const newVideos = [];

        for (const file of files) {
            if (file.size > 20 * 1024 * 1024) {
                toast.error(`${file.name} is too large (max 20MB)`);
                continue;
            }

            const reader = new FileReader();
            reader.readAsDataURL(file);
            await new Promise((resolve) => {
                reader.onload = () => {
                    newVideos.push(reader.result);
                    resolve();
                };
            });
        }

        setVideos(prev => [...prev, ...newVideos]);
        setUploading(false);
    };

    const removeImage = (index) => {
        setImages(prev => prev.filter((_, i) => i !== index));
    };

    const removeVideo = (index) => {
        setVideos(prev => prev.filter((_, i) => i !== index));
    };

    // Get user info from localStorage
    useEffect(() => {
        const user = localStorage.getItem('user');
        if (user) {
            const parsed = JSON.parse(user);
            setUserName(parsed.name || 'Anonymous');
        }
    }, []);

    const handleSubmit = async () => {
        if (rating < 1) {
            return toast.error('Please select a rating');
        }
        if (review.trim().length < 5) {
            return toast.error('Please write a review (at least 5 characters)');
        }

        try {
            // Get user email from localStorage
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const userId = user.email; // Use email as userId for Prisma queries
            
            if (!userId) {
                return toast.error('Please log in to submit a review');
            }

            // Submit review to database via API
            const response = await fetch('/api/reviews', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    productId: ratingModal.productId,
                    userId,
                    orderId: ratingModal.orderId,
                    rating,
                    review: review.trim(),
                    images,
                    videos
                })
            });

            const data = await response.json();
            
            if (response.ok && data.success) {
                // Dispatch action to update ratings in Redux
                dispatch({
                    type: 'rating/addRating',
                    payload: {
                        orderId: ratingModal.orderId,
                        productId: ratingModal.productId,
                        rating,
                        review
                    }
                });

                toast.success('Review submitted successfully! ✨');
                setRatingModal(null);
                setRating(0);
                setReview('');
                setImages([]);
                setVideos([]);
            } else {
                toast.error(data.error || 'Failed to submit review');
            }
        } catch (error) {
            toast.error('Failed to submit review');
            console.error(error);
        }
    }

    return (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm'>
            <div className='bg-white dark:bg-gray-900 p-8 rounded-xl shadow-2xl w-96 relative border border-gray-200 dark:border-gray-700'>
                <button 
                    onClick={() => {
                        setRatingModal(null);
                        setRating(0);
                        setReview('');
                    }} 
                    className='absolute top-4 right-4 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition'
                >
                    <XIcon size={24} />
                </button>

                <h2 className='text-2xl font-bold text-gray-900 dark:text-white mb-2'>Rate This Product</h2>
                <p className='text-sm text-gray-600 dark:text-gray-400 mb-6'>Your feedback helps other customers!</p>

                {/* Star Rating */}
                <div className='mb-6'>
                    <label className='block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3'>
                        Your Rating
                    </label>
                    <div className='flex items-center justify-center gap-2'>
                        {Array.from({ length: 5 }, (_, i) => (
                            <button
                                key={i}
                                type='button'
                                onClick={() => setRating(i + 1)}
                                className='transition-transform hover:scale-110'
                            >
                                <Star
                                    size={36}
                                    className={`transition-all ${
                                        rating > i 
                                            ? "text-green-400 fill-green-400" 
                                            : "text-gray-300 dark:text-gray-600"
                                    }`}
                                />
                            </button>
                        ))}
                    </div>
                    {rating > 0 && (
                        <p className='text-center text-sm text-green-600 dark:text-green-400 mt-2 font-medium'>
                            {rating} out of 5 stars
                        </p>
                    )}
                </div>

                {/* Review Text */}
                <div className='mb-6'>
                    <label className='block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2'>
                        Your Review
                    </label>
                    <div className='relative'>
                        <textarea
                            className='w-full p-3 pr-12 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-lg mb-2 focus:outline-none focus:ring-2 focus:ring-green-500 transition'
                            placeholder='Share your experience with this product...'
                            rows='4'
                            value={review}
                            onChange={(e) => setReview(e.target.value)}
                            maxLength={200}
                        />
                        <button
                            type='button'
                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                            className='absolute right-3 top-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition'
                        >
                            <Smile size={20} />
                        </button>
                        
                        {/* Emoji Picker */}
                        {showEmojiPicker && (
                            <div className='absolute right-0 top-full mt-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg p-2 z-10 grid grid-cols-8 gap-1 max-h-48 overflow-y-auto'>
                                {emojis.map((emoji, idx) => (
                                    <button
                                        key={idx}
                                        type='button'
                                        onClick={() => addEmoji(emoji)}
                                        className='text-2xl hover:bg-gray-100 dark:hover:bg-gray-700 rounded p-1 transition'
                                    >
                                        {emoji}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    <p className='text-xs text-gray-500 dark:text-gray-400'>
                        {review.length}/200 characters
                    </p>
                </div>

                {/* Media Upload */}
                <div className='mb-6 space-y-4'>
                    {/* Image Upload */}
                    <div>
                        <label className='block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2'>
                            Images (Optional - Max 5)
                        </label>
                        <input
                            type='file'
                            accept='image/*'
                            multiple
                            onChange={handleImageUpload}
                            disabled={uploading || images.length >= 5}
                            className='hidden'
                            id='image-upload'
                        />
                        <label 
                            htmlFor='image-upload'
                            className={`block w-full p-3 border-2 border-dashed rounded-lg text-center cursor-pointer transition ${
                                uploading || images.length >= 5
                                    ? 'border-gray-300 dark:border-gray-600 opacity-50 cursor-not-allowed'
                                    : 'border-gray-300 dark:border-gray-600 hover:border-green-500 dark:hover:border-green-500'
                            }`}
                        >
                            <span className='text-sm text-gray-600 dark:text-gray-400'>
                                📷 Click to upload images
                            </span>
                        </label>
                        {images.length > 0 && (
                            <div className='grid grid-cols-3 gap-2 mt-2'>
                                {images.map((img, idx) => (
                                    <div key={idx} className='relative group'>
                                        <img 
                                            src={img} 
                                            alt={`Upload ${idx + 1}`}
                                            className='w-full h-20 object-cover rounded-lg'
                                        />
                                        <button
                                            onClick={() => removeImage(idx)}
                                            className='absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition'
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Video Upload */}
                    <div>
                        <label className='block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2'>
                            Videos (Optional - Max 2)
                        </label>
                        <input
                            type='file'
                            accept='video/*'
                            multiple
                            onChange={handleVideoUpload}
                            disabled={uploading || videos.length >= 2}
                            className='hidden'
                            id='video-upload'
                        />
                        <label 
                            htmlFor='video-upload'
                            className={`block w-full p-3 border-2 border-dashed rounded-lg text-center cursor-pointer transition ${
                                uploading || videos.length >= 2
                                    ? 'border-gray-300 dark:border-gray-600 opacity-50 cursor-not-allowed'
                                    : 'border-gray-300 dark:border-gray-600 hover:border-green-500 dark:hover:border-green-500'
                            }`}
                        >
                            <span className='text-sm text-gray-600 dark:text-gray-400'>
                                🎥 Click to upload videos
                            </span>
                        </label>
                        {videos.length > 0 && (
                            <div className='grid grid-cols-2 gap-2 mt-2'>
                                {videos.map((vid, idx) => (
                                    <div key={idx} className='relative group'>
                                        <video 
                                            src={vid} 
                                            className='w-full h-20 object-cover rounded-lg'
                                            controls={false}
                                        />
                                        <button
                                            onClick={() => removeVideo(idx)}
                                            className='absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition'
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Buttons */}
                <div className='flex gap-3'>
                    <button 
                        onClick={() => {
                            setRatingModal(null);
                            setRating(0);
                            setReview('');
                        }} 
                        className='flex-1 px-4 py-2.5 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition'
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleSubmit} 
                        disabled={rating === 0 || review.trim().length < 5}
                        className='flex-1 px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg font-semibold hover:from-green-600 hover:to-emerald-600 transition disabled:opacity-50 disabled:cursor-not-allowed'
                    >
                        Submit Review
                    </button>
                </div>
            </div>
        </div>
    )
}

export default RatingModal