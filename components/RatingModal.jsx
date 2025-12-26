'use client'

import { Star } from 'lucide-react';
import React, { useState, useEffect } from 'react'
import { XIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { useDispatch } from 'react-redux';

const RatingModal = ({ ratingModal, setRatingModal }) => {

    const [rating, setRating] = useState(0);
    const [review, setReview] = useState('');
    const [userName, setUserName] = useState('');
    const dispatch = useDispatch();

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
            // Create review object
            const newReview = {
                id: Date.now(),
                productId: ratingModal.productId,
                orderId: ratingModal.orderId,
                userName: userName || 'Anonymous',
                rating,
                text: review,
                date: new Date().toISOString().split('T')[0],
                helpful: 0
            };

            // Get existing reviews
            const allReviews = localStorage.getItem('productReviews');
            const reviews = allReviews ? JSON.parse(allReviews) : [];

            // Add new review
            reviews.push(newReview);
            localStorage.setItem('productReviews', JSON.stringify(reviews));

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
                    <textarea
                        className='w-full p-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-lg mb-2 focus:outline-none focus:ring-2 focus:ring-green-500 transition'
                        placeholder='Share your experience with this product...'
                        rows='4'
                        value={review}
                        onChange={(e) => setReview(e.target.value)}
                    />
                    <p className='text-xs text-gray-500 dark:text-gray-400'>
                        {review.length}/200 characters
                    </p>
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