'use client'
import React, { useState } from 'react'
import Title from './Title'
import NeonCheckbox from './NeonCheckbox'
import toast from 'react-hot-toast'

const Newsletter = () => {
    const [email, setEmail] = useState('')
    const [agreedToMarketing, setAgreedToMarketing] = useState(false)

    const handleSubscribe = () => {
        if (!email) {
            toast.error('Please enter your email address')
            return
        }
        if (!agreedToMarketing) {
            toast.error('Please agree to receive marketing emails')
            return
        }
        // Here you would typically send to your API
        toast.success('Successfully subscribed to newsletter!')
        setEmail('')
        setAgreedToMarketing(false)
    }

    return (
        <div className='flex flex-col items-center mx-4 my-36'>
            <Title title="Join Newsletter" description="Subscribe to get exclusive deals, new arrivals, and insider updates delivered straight to your inbox every week." visibleButton={false} />
            <div className='flex bg-slate-100 dark:bg-slate-800 text-sm p-1 rounded-full w-full max-w-xl my-10 border-2 border-white dark:border-slate-700 ring ring-slate-200 dark:ring-slate-600'>
                <input 
                    className='flex-1 pl-5 outline-none bg-transparent dark:text-white' 
                    type="email" 
                    placeholder='Enter your email address'
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
                <button 
                    onClick={handleSubscribe}
                    className='font-medium bg-green-500 text-white px-7 py-3 rounded-full hover:scale-103 active:scale-95 transition'
                >
                    Get Updates
                </button>
            </div>
            <div className='flex items-center gap-3'>
                <NeonCheckbox 
                    checked={agreedToMarketing}
                    onChange={(e) => setAgreedToMarketing(e.target.checked)}
                    size={18}
                />
                <span className='text-sm text-slate-600 dark:text-slate-400'>
                    I agree to receive marketing emails and promotions
                </span>
            </div>
        </div>
    )
}

export default Newsletter
