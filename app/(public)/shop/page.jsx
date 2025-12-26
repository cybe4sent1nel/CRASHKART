'use client'
import { Suspense, useState, useEffect } from "react"
import ProductCard from "@/components/ProductCard"
import SellerStoreCard from "@/components/SellerStoreCard"
import { MoveLeftIcon, ChevronDown } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useSelector } from "react-redux"
import { BackgroundBoxes } from "@/components/ui/background-boxes"
import { ProductGridSkeleton } from "@/components/SkeletonLoader"
import LottieIcon from "@/components/LottieIcon"
import NeonCheckbox from "@/components/NeonCheckbox"

 function ShopContent() {

     // get query params ?search=abc
     const searchParams = useSearchParams()
     const search = searchParams.get('search')
     const router = useRouter()
     const [loading, setLoading] = useState(true)
     const [sortBy, setSortBy] = useState('featured')
     const [sortOpen, setSortOpen] = useState(false)
     const [filterOpen, setFilterOpen] = useState(false)
     const [selectedCategories, setSelectedCategories] = useState([])
     const [priceRange, setPriceRange] = useState([0, 100000])
     const [inStockOnly, setInStockOnly] = useState(false)
     const [hasDiscount, setHasDiscount] = useState(false)
     const [hasCashback, setHasCashback] = useState(false)

     const products = useSelector(state => state.product.list)
     
     useEffect(() => {
         if (products.length > 0) {
             setLoading(false)
         }
     }, [products])

     // Get unique categories
     const categories = [...new Set(products.map(p => p.category))]

     let filteredProducts = search
         ? products.filter(product =>
             product.name.toLowerCase().includes(search.toLowerCase())
         )
         : products;

     // Apply category filter (multi-select)
     if (selectedCategories.length > 0) {
         filteredProducts = filteredProducts.filter(p => selectedCategories.includes(p.category))
     }

     // Apply price range filter
     filteredProducts = filteredProducts.filter(p => p.price >= priceRange[0] && p.price <= priceRange[1])

     // Apply in-stock filter
     if (inStockOnly) {
         filteredProducts = filteredProducts.filter(p => p.stock > 0 || p.inStock !== false)
     }

     // Apply discount filter
     if (hasDiscount) {
         filteredProducts = filteredProducts.filter(p => p.mrp && p.mrp > p.price)
     }

     // Apply cashback filter
     if (hasCashback) {
         filteredProducts = filteredProducts.filter(p => p.crashCashValue && p.crashCashValue > 0)
     }

     // Toggle category selection
     const toggleCategory = (cat) => {
         setSelectedCategories(prev => 
             prev.includes(cat) 
                 ? prev.filter(c => c !== cat)
                 : [...prev, cat]
         )
     }

     // Clear all filters
     const clearFilters = () => {
         setSelectedCategories([])
         setPriceRange([0, 100000])
         setInStockOnly(false)
         setHasDiscount(false)
         setHasCashback(false)
     }

     // Apply sorting
     const sortedProducts = [...filteredProducts].sort((a, b) => {
         switch (sortBy) {
             case 'priceLowHigh':
                 return a.price - b.price
             case 'priceHighLow':
                 return b.price - a.price
             case 'newest':
                 return new Date(b.createdAt) - new Date(a.createdAt)
             case 'rating':
                 const ratingA = a.rating?.length > 0 ? a.rating.reduce((sum, r) => sum + r.rating, 0) / a.rating.length : 0
                 const ratingB = b.rating?.length > 0 ? b.rating.reduce((sum, r) => sum + r.rating, 0) / b.rating.length : 0
                 return ratingB - ratingA
             case 'cashback':
                 return (b.crashCashValue || 0) - (a.crashCashValue || 0)
             default:
                 return 0
         }
     })

    return (
        <div className="relative min-h-[70vh] mx-6">
            <BackgroundBoxes className="absolute inset-0 opacity-10" />
            <div className=" max-w-7xl mx-auto relative z-10">
                {/* Seller Store Card */}
                <div className="mb-8">
                    <SellerStoreCard />
                </div>
                
                <h1 onClick={() => router.push('/shop')} className="text-2xl text-slate-500 dark:text-slate-400 my-6 flex items-center gap-2 cursor-pointer"> {search && <MoveLeftIcon size={20} />}  All <span className="text-slate-700 dark:text-white font-medium">Products</span></h1>
                
                {/* Sort and Filter Bar */}
                <div className="flex gap-3 mb-8 flex-wrap">
                    {/* Sort Dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setSortOpen(!sortOpen)}
                            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition"
                        >
                            <div className="w-5 h-5">
                                <LottieIcon animationPath="/animations/Sort.json" width="20px" height="20px" loop={true} />
                            </div>
                            <span className="font-medium text-slate-700 dark:text-white">Sort</span>
                            <ChevronDown size={16} className={`transition ${sortOpen ? 'rotate-180' : ''}`} />
                        </button>
                        
                        {sortOpen && (
                            <div className="absolute top-full mt-2 left-0 bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 rounded-lg shadow-lg z-50 min-w-48">
                                <button
                                    onClick={() => { setSortBy('featured'); setSortOpen(false) }}
                                    className={`w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 transition dark:text-slate-200 ${sortBy === 'featured' ? 'bg-blue-50 font-bold text-blue-600 dark:bg-blue-900 dark:text-blue-300' : ''}`}
                                >
                                    Featured
                                </button>
                                <button
                                    onClick={() => { setSortBy('newest'); setSortOpen(false) }}
                                    className={`w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 transition dark:text-slate-200 ${sortBy === 'newest' ? 'bg-blue-50 font-bold text-blue-600 dark:bg-blue-900 dark:text-blue-300' : ''}`}
                                >
                                    Newest
                                </button>
                                <button
                                    onClick={() => { setSortBy('priceLowHigh'); setSortOpen(false) }}
                                    className={`w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 transition dark:text-slate-200 ${sortBy === 'priceLowHigh' ? 'bg-blue-50 font-bold text-blue-600 dark:bg-blue-900 dark:text-blue-300' : ''}`}
                                >
                                    Price: Low to High
                                </button>
                                <button
                                    onClick={() => { setSortBy('priceHighLow'); setSortOpen(false) }}
                                    className={`w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 transition dark:text-slate-200 ${sortBy === 'priceHighLow' ? 'bg-blue-50 font-bold text-blue-600 dark:bg-blue-900 dark:text-blue-300' : ''}`}
                                >
                                    Price: High to Low
                                </button>
                                <button
                                    onClick={() => { setSortBy('rating'); setSortOpen(false) }}
                                    className={`w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 transition dark:text-slate-200 ${sortBy === 'rating' ? 'bg-blue-50 font-bold text-blue-600 dark:bg-blue-900 dark:text-blue-300' : ''}`}
                                >
                                    Top Rated
                                </button>
                                <button
                                    onClick={() => { setSortBy('cashback'); setSortOpen(false) }}
                                    className={`w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 transition flex items-center gap-2 dark:text-slate-200 ${sortBy === 'cashback' ? 'bg-blue-50 font-bold text-blue-600 dark:bg-blue-900 dark:text-blue-300' : ''}`}
                                >
                                    <img src="/crashcash.ico" alt="Crash Cash" className="w-4 h-4" />
                                    <span>Highest Cashback</span>
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Filter Dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setFilterOpen(!filterOpen)}
                            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition"
                        >
                            <div className="w-6 h-6">
                                <LottieIcon animationPath="/animations/Filter.json" width="24px" height="24px" loop={true} />
                            </div>
                            <span className="font-medium text-slate-700 dark:text-white">Filter</span>
                            <ChevronDown size={16} className={`transition ${filterOpen ? 'rotate-180' : ''}`} />
                        </button>
                        
                        {filterOpen && (
                            <div className="absolute top-full mt-2 left-0 bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 rounded-lg shadow-lg z-50 min-w-72 p-4 max-h-[70vh] overflow-y-auto">
                                {/* Clear Filters */}
                                {(selectedCategories.length > 0 || inStockOnly || hasDiscount || hasCashback || priceRange[0] > 0 || priceRange[1] < 100000) && (
                                    <button
                                        onClick={clearFilters}
                                        className="w-full text-center py-2 mb-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition text-sm font-medium"
                                    >
                                        Clear All Filters
                                    </button>
                                )}

                                {/* Quick Filters */}
                                <div className="mb-4 pb-4 border-b border-slate-200 dark:border-slate-700">
                                    <h3 className="font-bold text-slate-800 dark:text-white mb-3">Quick Filters</h3>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3">
                                            <NeonCheckbox 
                                                checked={inStockOnly}
                                                onChange={() => setInStockOnly(!inStockOnly)}
                                                size={18}
                                            />
                                            <span className="text-slate-700 dark:text-slate-200 text-sm">In Stock Only</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <NeonCheckbox 
                                                checked={hasDiscount}
                                                onChange={() => setHasDiscount(!hasDiscount)}
                                                size={18}
                                            />
                                            <span className="text-slate-700 dark:text-slate-200 text-sm">On Sale / Discounted</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <NeonCheckbox 
                                                checked={hasCashback}
                                                onChange={() => setHasCashback(!hasCashback)}
                                                size={18}
                                            />
                                            <span className="text-slate-700 dark:text-slate-200 text-sm flex items-center gap-1">
                                                <img src="/crashcash.ico" alt="" className="w-4 h-4" />
                                                Has CrashCash
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Category Filter with Checkboxes */}
                                <div className="mb-4 pb-4 border-b border-slate-200 dark:border-slate-700">
                                    <h3 className="font-bold text-slate-800 dark:text-white mb-3">Categories</h3>
                                    <div className="space-y-2 max-h-40 overflow-y-auto">
                                        {categories.map(cat => (
                                            <div key={cat} className="flex items-center gap-3 py-1">
                                                <NeonCheckbox 
                                                    checked={selectedCategories.includes(cat)}
                                                    onChange={() => toggleCategory(cat)}
                                                    size={18}
                                                />
                                                <span className={`text-sm ${selectedCategories.includes(cat) ? 'text-red-500 font-medium' : 'text-slate-700 dark:text-slate-200'}`}>
                                                    {cat}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Price Range Filter */}
                                <div>
                                    <h3 className="font-bold text-slate-800 dark:text-white mb-2">Price Range</h3>
                                    <div className="space-y-2">
                                        <div>
                                            <label className="text-sm text-slate-600 dark:text-slate-400">Min: ₹{priceRange[0].toLocaleString()}</label>
                                            <input
                                                type="range"
                                                min="0"
                                                max="100000"
                                                step="1000"
                                                value={priceRange[0]}
                                                onChange={(e) => setPriceRange([parseInt(e.target.value), priceRange[1]])}
                                                className="w-full accent-red-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-sm text-slate-600 dark:text-slate-400">Max: ₹{priceRange[1].toLocaleString()}</label>
                                            <input
                                                type="range"
                                                min="0"
                                                max="100000"
                                                step="1000"
                                                value={priceRange[1]}
                                                onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                                                className="w-full accent-red-500"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => setFilterOpen(false)}
                                    className="mt-4 w-full px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition"
                                >
                                    Apply Filters
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Results count */}
                    <div className="ml-auto flex items-center text-slate-600 dark:text-slate-400">
                        <span className="font-medium">{sortedProducts.length} products found</span>
                    </div>
                </div>
                
                {loading ? (
                    <ProductGridSkeleton count={12} />
                ) : sortedProducts.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-slate-600 dark:text-slate-400 text-lg">No products found matching your criteria</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:flex flex-wrap gap-6 xl:gap-12 mx-auto mb-32">
                        {sortedProducts.map((product) => <ProductCard key={product.id} product={product} />)}
                    </div>
                )}
            </div>
        </div>
    )
}


export default function Shop() {
  return (
    <Suspense fallback={<div>Loading shop...</div>}>
      <ShopContent />
    </Suspense>
  );
}