'use client'

export function ProductCardSkeleton() {
    return (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-slate-100 animate-pulse">
            {/* Image Skeleton */}
            <div className="relative bg-slate-200 aspect-square" />

            {/* Content Skeleton */}
            <div className="p-4 space-y-3">
                {/* Category */}
                <div className="h-3 bg-slate-200 rounded w-1/3" />
                
                {/* Title */}
                <div className="space-y-2">
                    <div className="h-4 bg-slate-200 rounded w-full" />
                    <div className="h-4 bg-slate-200 rounded w-2/3" />
                </div>

                {/* Price */}
                <div className="h-6 bg-slate-200 rounded w-1/2" />

                {/* Button */}
                <div className="h-10 bg-slate-200 rounded-lg w-full" />
            </div>
        </div>
    )
}

export function ProductGridSkeleton({ count = 8 }) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(count)].map((_, index) => (
                <ProductCardSkeleton key={index} />
            ))}
        </div>
    )
}

export function HeroSkeleton() {
    return (
        <div className="mx-6 my-10 animate-pulse">
            <div className="max-w-7xl mx-auto">
                <div className="flex max-xl:flex-col gap-8">
                    {/* Main Card */}
                    <div className="flex-1 bg-slate-200 rounded-3xl min-h-[400px]" />
                    
                    {/* Side Cards */}
                    <div className="flex flex-col gap-5 w-full xl:max-w-sm">
                        <div className="flex-1 bg-slate-200 rounded-3xl min-h-[180px]" />
                        <div className="flex-1 bg-slate-200 rounded-3xl min-h-[180px]" />
                    </div>
                </div>
            </div>
        </div>
    )
}

export function OrderCardSkeleton() {
    return (
        <div className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
            <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="h-6 bg-slate-200 rounded w-32" />
                    <div className="h-6 bg-slate-200 rounded-full w-24" />
                </div>
                <div className="space-y-2">
                    <div className="h-4 bg-slate-200 rounded w-48" />
                    <div className="h-4 bg-slate-200 rounded w-40" />
                </div>
            </div>
        </div>
    )
}

export function CartItemSkeleton() {
    return (
        <div className="flex gap-4 p-4 bg-white rounded-lg animate-pulse">
            {/* Image */}
            <div className="w-20 h-20 bg-slate-200 rounded-lg flex-shrink-0" />
            
            {/* Details */}
            <div className="flex-1 space-y-2">
                <div className="h-4 bg-slate-200 rounded w-3/4" />
                <div className="h-3 bg-slate-200 rounded w-1/2" />
                <div className="h-5 bg-slate-200 rounded w-1/4" />
            </div>
        </div>
    )
}

export function ProfileSkeleton() {
    return (
        <div className="max-w-4xl mx-auto p-6 space-y-6 animate-pulse">
            {/* Header */}
            <div className="flex items-center gap-4">
                <div className="w-24 h-24 bg-slate-200 rounded-full" />
                <div className="space-y-2">
                    <div className="h-6 bg-slate-200 rounded w-48" />
                    <div className="h-4 bg-slate-200 rounded w-64" />
                </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="space-y-2">
                        <div className="h-4 bg-slate-200 rounded w-24" />
                        <div className="h-10 bg-slate-200 rounded w-full" />
                    </div>
                ))}
            </div>

            {/* Button */}
            <div className="h-12 bg-slate-200 rounded-lg w-full" />
        </div>
    )
}
