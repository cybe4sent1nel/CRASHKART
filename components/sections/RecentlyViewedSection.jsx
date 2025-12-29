'use client'
import { useEffect, useState } from 'react'
import { Eye } from 'lucide-react'
import RecentlyViewed from '../RecentlyViewed'

export default function RecentlyViewedSection() {
    const [hasRecentlyViewed, setHasRecentlyViewed] = useState(false)

    useEffect(() => {
        // Check if there are recently viewed items
        const viewed = localStorage.getItem('recentlyViewed')
        if (viewed) {
            const products = JSON.parse(viewed)
            setHasRecentlyViewed(products.length > 0)
        }
    }, [])

    if (!hasRecentlyViewed) return null

    return (
        <div className="border-t-2 border-slate-200 dark:border-slate-700 pt-8">
            <RecentlyViewed />
        </div>
    )
}
