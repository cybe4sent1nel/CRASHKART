'use client'
import React, { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Image from 'next/image'
import { assets } from '@/assets/assets'
import dynamic from 'next/dynamic'
import reviewAnimData from '@/public/animations/Review.json'

const LottieAnimation = dynamic(() => import('./LottieAnimation'), { ssr: false })

const defaultTestimonials = [
    {
        id: 'dummy-1',
        name: 'Sarah Johnson',
        role: 'Customer',
        text: 'Absolutely love CrashKart! 🎉 The app is super fast, easy to navigate, and has amazing deals. Delivery was quick and customer support is very responsive. Highly recommend!',
        rating: 5,
        image: assets.profile_pic1
    },
    {
        id: 'dummy-2',
        name: 'Michael Chen',
        role: 'Customer',
        text: 'Excellent customer service and the prices are unbeatable. The CrashCash rewards are a great bonus! Best shopping app I\'ve used. 💯',
        rating: 5,
        image: assets.profile_pic2
    },
    {
        id: 'dummy-3',
        name: 'Emma Rodriguez',
        role: 'Customer',
        text: 'Best shopping experience ever! The interface is beautiful, checkout is seamless, and tracking orders is so easy. Keep up the great work! ⭐',
        rating: 5,
        image: assets.profile_pic3
    },
    {
        id: 'dummy-4',
        name: 'Rahul Verma',
        role: 'Customer',
        text: 'Really good app with lots of features. Product quality is excellent and delivery is always on time. Great variety of products! 👍',
        rating: 4,
        image: assets.profile_pic1
    },
    {
        id: 'dummy-5',
        name: 'Priya Singh',
        role: 'Customer',
        text: 'Very satisfied with my purchases! Good customer service and the app works smoothly. Love the flash sales and discounts! 😊',
        rating: 5,
        image: assets.profile_pic2
    }
]

export function TestimonialsStack() {
    const [currentIndex, setCurrentIndex] = useState(0)
    const [isAutoplay, setIsAutoplay] = useState(true)
    const [testimonials, setTestimonials] = useState(defaultTestimonials)
    const [loading, setLoading] = useState(true)

    // Fetch app reviews and merge with dummy reviews
    useEffect(() => {
        const fetchReviews = async () => {
            try {
                const response = await fetch('/api/app-reviews?limit=10')
                const data = await response.json()
                
                console.log('📱 Testimonials: API response:', data)
                console.log('📱 Testimonials: Real reviews count:', data.testimonials?.length || 0)
                
                if (data.success && data.testimonials && data.testimonials.length > 0) {
                    // Process real reviews
                    const realReviews = data.testimonials.map((t) => ({
                        id: t.id,
                        name: t.name,
                        role: t.role || 'Customer',
                        text: t.text,
                        rating: t.rating,
                        image: t.image || null // Use image from API if available
                    }))
                    
                    console.log('📱 Testimonials: Processed real reviews:', realReviews.length)
                    
                    // Merge dummy reviews (with asset images) with real reviews
                    const allTestimonials = [...defaultTestimonials, ...realReviews]
                    console.log('📱 Testimonials: Total testimonials:', allTestimonials.length)
                    setTestimonials(allTestimonials)
                } else {
                    // No real reviews yet, show only dummy reviews with asset images
                    console.log('📱 Testimonials: No real reviews, showing only dummy reviews')
                    setTestimonials(defaultTestimonials)
                }
            } catch (error) {
                console.error('❌ Error fetching reviews:', error)
                // Keep default testimonials with asset images on error
                setTestimonials(defaultTestimonials)
            } finally {
                setLoading(false)
            }
        }

        fetchReviews()
    }, [])

    useEffect(() => {
        if (!isAutoplay || loading) return

        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % testimonials.length)
        }, 5000)

        return () => clearInterval(timer)
    }, [isAutoplay, loading, testimonials.length])

    const goToPrevious = () => {
        setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length)
        setIsAutoplay(false)
    }

    const goToNext = () => {
        setCurrentIndex((prev) => (prev + 1) % testimonials.length)
        setIsAutoplay(false)
    }

    return (
        <div className='w-full max-w-6xl mx-auto py-12'>
            {/* Header with Animation Background */}
            <div className='relative mb-12'>
                {/* Lottie Animation Background */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                    <LottieAnimation 
                        animationData={reviewAnimData}
                        width='300px'
                        height='300px'
                        loop={true}
                        autoplay={true}
                    />
                </div>
                
                {/* Text Content */}
                <div className='relative z-10 text-center'>
                    <h2 className='text-5xl font-bold mb-3 bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent'>
                        What Our Customers Say
                    </h2>
                    <p className='text-gray-600 text-lg'>Real reviews from real customers</p>
                </div>
            </div>

            <div className='relative h-96 perspective'>
                {testimonials.map((testimonial, index) => {
                    const distance = (index - currentIndex + testimonials.length) % testimonials.length
                    const isVisible = distance < 3
                    
                    return (
                        isVisible && (
                            <div
                                key={testimonial.id}
                                className={`absolute w-full transition-all duration-500 ease-out`}
                                style={{
                                    transform: `
                                        translateY(${distance * 20}px) 
                                        scale(${1 - distance * 0.05})
                                        opacity: ${1 - distance * 0.2}
                                    `,
                                    zIndex: testimonials.length - distance,
                                }}
                            >
                                <div className='bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow border border-blue-100'>
                                    {/* Header */}
                                    <div className='flex items-start justify-between mb-4'>
                                        <div className='flex items-center gap-4'>
                                            {testimonial.image ? (
                                                <Image
                                                    src={testimonial.image}
                                                    alt={testimonial.name}
                                                    width={60}
                                                    height={60}
                                                    className='rounded-full object-cover border-2 border-blue-200'
                                                />
                                            ) : (
                                                <div className='w-15 h-15 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center text-white text-2xl font-bold border-2 border-blue-200'>
                                                    {testimonial.name.charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                            <div>
                                                <h3 className='font-bold text-gray-900'>{testimonial.name}</h3>
                                                <p className='text-sm text-gray-600'>{testimonial.role}</p>
                                            </div>
                                        </div>
                                        <div className='flex gap-1'>
                                            {[...Array(5)].map((_, i) => (
                                                <span
                                                    key={i}
                                                    className={i < testimonial.rating ? 'text-yellow-400' : 'text-gray-300'}
                                                >
                                                    ★
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Text */}
                                    <p className='text-gray-700 text-lg leading-relaxed'>
                                        "{testimonial.text}"
                                    </p>

                                    {/* Quote Mark */}
                                    <div className='mt-4 text-6xl text-blue-200 opacity-50'>
                                        "
                                    </div>
                                </div>
                            </div>
                        )
                    )
                })}
            </div>

            {/* Controls */}
            <div className='flex items-center justify-between mt-8'>
                <button
                    onClick={goToPrevious}
                    className='p-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition transform hover:scale-110'
                >
                    <ChevronLeft size={24} />
                </button>

                <div className='flex gap-2'>
                    {testimonials.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => {
                                setCurrentIndex(index)
                                setIsAutoplay(false)
                            }}
                            className={`w-3 h-3 rounded-full transition-all ${
                                index === currentIndex
                                    ? 'bg-blue-500 w-8'
                                    : 'bg-gray-300 hover:bg-gray-400'
                            }`}
                        />
                    ))}
                </div>

                <button
                    onClick={goToNext}
                    className='p-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition transform hover:scale-110'
                >
                    <ChevronRight size={24} />
                </button>
            </div>
        </div>
    )
}

export default TestimonialsStack
