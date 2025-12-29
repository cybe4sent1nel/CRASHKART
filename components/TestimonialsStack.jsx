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
        id: 1,
        name: 'Sarah Johnson',
        role: 'Customer',
        text: 'Amazing quality products and super fast delivery! CrashKart has become my go-to for all electronics.',
        rating: 5,
        image: assets.profile_pic1
    },
    {
        id: 2,
        name: 'Michael Chen',
        role: 'Customer',
        text: 'Excellent customer service and the prices are unbeatable. Highly recommend CrashKart!',
        rating: 5,
        image: assets.profile_pic2
    },
    {
        id: 3,
        name: 'Emma Rodriguez',
        role: 'Customer',
        text: 'Best shopping experience ever. The website is smooth and checkout is super quick.',
        rating: 5,
        image: assets.profile_pic3
    }
]

export function TestimonialsStack() {
    const [currentIndex, setCurrentIndex] = useState(0)
    const [isAutoplay, setIsAutoplay] = useState(true)
    const [testimonials, setTestimonials] = useState(defaultTestimonials)
    const [loading, setLoading] = useState(true)

    // Fetch app reviews
    useEffect(() => {
        const fetchReviews = async () => {
            try {
                const response = await fetch('/api/app-reviews?limit=10')
                const data = await response.json()
                
                if (data.success && data.testimonials.length > 0) {
                    // Add profile images to testimonials
                    const testimonialsWithImages = data.testimonials.map((t, idx) => ({
                        ...t,
                        image: [assets.profile_pic1, assets.profile_pic2, assets.profile_pic3][idx % 3]
                    }))
                    setTestimonials(testimonialsWithImages)
                }
            } catch (error) {
                console.error('Error fetching reviews:', error)
                // Keep default testimonials on error
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
                                            <Image
                                                src={testimonial.image}
                                                alt={testimonial.name}
                                                width={60}
                                                height={60}
                                                className='rounded-full object-cover'
                                            />
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
