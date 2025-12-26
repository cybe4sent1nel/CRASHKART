'use client'
import Image from 'next/image'
import Link from 'next/link'
import { Store, ExternalLink, Award, Users, ThumbsUp, Clock, Briefcase } from 'lucide-react'

const SellerStoreCard = ({ seller = null }) => {
    // Default seller info with the happy_store.webp logo
    const defaultSeller = {
        id: 'happy_store',
        name: 'Happy Store',
        logo: '/happy_store.webp',
        rating: 4.8,
        reviews: 2450,
        followers: 12500,
        description: 'Premium quality products with best customer service',
        verified: true,
        productCount: 2500,
        positiveFeedback: 98,
        avgResponse: '24hrs'
    }

    const sellerInfo = {
        ...defaultSeller,
        ...(seller && typeof seller === 'object' ? seller : {})
    }

    const safeReviews = sellerInfo.reviews || 0
    const safeFollowers = sellerInfo.followers || 0

    return (
        <div className="w-full bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 rounded-2xl border border-slate-200 dark:border-slate-600 shadow-lg p-6">
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 mb-6 pb-6 border-b border-slate-200 dark:border-slate-600">
                {/* Left: Logo and Info */}
                <div className="flex items-start gap-4 flex-1 w-full">
                    {/* Store Logo */}
                     <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 border-2 border-slate-200 dark:border-slate-600 flex-shrink-0 shadow-sm flex items-center justify-center">
                         <Briefcase size={48} className="text-white" />
                     </div>
                    
                    {/* Store Details */}
                    <div className="flex-1 min-w-0">
                        {/* Name and Badge */}
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <div className="flex items-center gap-2">
                                <Store size={22} className="text-blue-600 flex-shrink-0" />
                                <h3 className="text-2xl font-bold text-slate-800 dark:text-white truncate">
                                    {sellerInfo.name || 'Store Name'}
                                </h3>
                            </div>
                            {sellerInfo.verified && (
                                <span className="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 flex-shrink-0">
                                    <Award size={14} />
                                    Verified
                                </span>
                            )}
                        </div>

                        {/* Description */}
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-3 line-clamp-2">
                            {sellerInfo.description || 'Quality products with excellent customer service'}
                        </p>

                        {/* Stats Row */}
                        <div className="flex items-center gap-6 text-sm flex-wrap">
                            {/* Rating */}
                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1">
                                    <span className="text-yellow-500 font-bold text-lg">★</span>
                                    <span className="text-slate-700 dark:text-slate-300 font-bold text-base">
                                        {sellerInfo.rating || 4.5}
                                    </span>
                                </div>
                                <span className="text-slate-500 dark:text-slate-400 text-xs">
                                    ({safeReviews.toLocaleString()} reviews)
                                </span>
                            </div>

                            {/* Followers */}
                            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                                <Users size={16} className="text-blue-500" />
                                <span className="font-semibold">{safeFollowers.toLocaleString()}</span>
                                <span className="text-xs">followers</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Action Buttons */}
                <div className="flex flex-col lg:flex-row gap-2 w-full lg:w-auto lg:flex-shrink-0">
                    <Link 
                        href={`/shop/${sellerInfo.id || 'default'}`}
                        className="flex-1 lg:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-semibold text-sm whitespace-nowrap shadow-sm"
                    >
                        <ExternalLink size={16} />
                        View Store
                    </Link>
                    <button className="flex-1 lg:flex-initial px-5 py-2.5 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-800 dark:text-white border border-slate-300 dark:border-slate-600 rounded-lg transition font-semibold text-sm whitespace-nowrap shadow-sm">
                        Follow
                    </button>
                </div>
            </div>

            {/* Store Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Products */}
                <div className="text-center p-4 bg-white dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-600">
                    <div className="flex items-center justify-center mb-2">
                        <Store size={20} className="text-blue-500" />
                    </div>
                    <p className="text-2xl font-bold text-slate-800 dark:text-white">
                        {(sellerInfo.productCount || 2500) >= 1000 ? 
                            `${((sellerInfo.productCount || 2500) / 1000).toFixed(1)}K` : 
                            sellerInfo.productCount || '2.5K'}+
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">Products</p>
                </div>

                {/* Positive Feedback */}
                <div className="text-center p-4 bg-white dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-600">
                    <div className="flex items-center justify-center mb-2">
                        <ThumbsUp size={20} className="text-green-500" />
                    </div>
                    <p className="text-2xl font-bold text-slate-800 dark:text-white">
                        {sellerInfo.positiveFeedback || 98}%
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">Positive Feedback</p>
                </div>

                {/* Avg Response */}
                <div className="text-center p-4 bg-white dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-600">
                    <div className="flex items-center justify-center mb-2">
                        <Clock size={20} className="text-amber-500" />
                    </div>
                    <p className="text-2xl font-bold text-slate-800 dark:text-white">
                        {sellerInfo.avgResponse || '24hrs'}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">Avg Response</p>
                </div>

                {/* Rating */}
                <div className="text-center p-4 bg-white dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-600">
                    <div className="flex items-center justify-center mb-2">
                        <Award size={20} className="text-yellow-500" />
                    </div>
                    <p className="text-2xl font-bold text-slate-800 dark:text-white">
                        {sellerInfo.rating || 4.8}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">Rating</p>
                </div>
            </div>
        </div>
    )
}

export default SellerStoreCard
