'use client'
import React, { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Image from 'next/image'
import { assets } from '@/assets/assets'

const testimonials = [
    {
        id: 1,
        name: 'Sarah Johnson',
        role: 'Tech Enthusiast',
        text: 'Amazing quality products and super fast delivery! CrashKart has become my go-to for all electronics.',
        rating: 5,
        image: assets.profile_pic1
    },
    {
        id: 2,
        name: 'Michael Chen',
        role: 'Product Manager',
        text: 'Excellent customer service and the prices are unbeatable. Highly recommend CrashKart!',
        rating: 5,
        image: assets.profile_pic2
    },
    {
        id: 3,
        name: 'Emma Rodriguez',
        role: 'Freelancer',
        text: 'Best shopping experience ever. The website is smooth and checkout is super quick.',
        rating: 5,
        image: assets.profile_pic3
    },
    {
        id: 4,
        name: 'David Kumar',
        role: 'Student',
        text: 'Love the Flash Sale section! Got amazing deals on gadgets I was wanting.',
        rating: 4,
        image: assets.profile_pic1
    },
    {
        id: 5,
        name: 'Lisa Anderson',
        role: 'Business Owner',
        text: 'Bulk orders are handled professionally. CrashKart is perfect for business needs too.',
        rating: 5,
        image: assets.profile_pic2
    }
]

export function TestimonialsStack() {
    const [currentIndex, setCurrentIndex] = useState(0)
    const [isAutoplay, setIsAutoplay] = useState(true)

    useEffect(() => {
        if (!isAutoplay) return

        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % testimonials.length)
        }, 5000)

        return () => clearInterval(timer)
    }, [isAutoplay])

    const goToPrevious = () => {
        setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length)
        setIsAutoplay(false)
    }

    const goToNext = () => {
        setCurrentIndex((prev) => (prev + 1) % testimonials.length)
        setIsAutoplay(false)
    }

    return (
        <div className='w-full max-w-4xl mx-auto py-12'>
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
