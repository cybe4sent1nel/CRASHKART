'use client'
import { useState } from 'react'
import { X, ShoppingCart, Heart, Minus, Plus, Star, Truck, Shield } from 'lucide-react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { useDispatch } from 'react-redux'
import { addToCart } from '@/lib/features/cart/cartSlice'
import { addToWishlist } from '@/lib/features/wishlist/wishlistSlice'
import toast from 'react-hot-toast'

export default function ProductQuickView({ product, isOpen, onClose }) {
    const [quantity, setQuantity] = useState(1)
    const [selectedImage, setSelectedImage] = useState(0)
    const dispatch = useDispatch()
    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '₹'

    if (!product) return null

    const handleAddToCart = async () => {
        try {
            const mod = await import('@/lib/cartOverrides')
            const CartOverrides = mod.CartOverrides || mod.default
            CartOverrides.set(product.id, { salePrice: product.salePrice || product.price, expiresAt: localStorage.getItem('flashSaleEndTime') || null })
        } catch (e) {
            console.warn('cart override set failed', e)
        }
        dispatch(addToCart({ 
            productId: product.id, 
            quantity 
        }))
        toast.success(`${product.name} added to cart!`)
        onClose()
    }

    const handleAddToWishlist = () => {
        dispatch(addToWishlist({ productId: product.id }))
        toast.success('Added to wishlist!')
    }

    const discount = Math.round(((product.mrp - product.price) / product.mrp) * 100)

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200]"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="fixed inset-4 md:inset-10 lg:inset-20 bg-white rounded-2xl shadow-2xl z-[201] overflow-hidden"
                    >
                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 z-10 p-2 bg-white rounded-full shadow-lg hover:bg-slate-100 transition"
                        >
                            <X size={24} className="text-slate-600" />
                        </button>

                        {/* Content */}
                        <div className="h-full overflow-y-auto">
                            <div className="grid md:grid-cols-2 gap-8 p-6 md:p-10">
                                {/* Left: Images */}
                                <div className="space-y-4">
                                    {/* Discount Badge */}
                                    {discount > 0 && (
                                        <div className="absolute top-6 left-6 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold z-10">
                                            {discount}% OFF
                                        </div>
                                    )}

                                    {/* Main Image */}
                                    <div className="relative bg-slate-100 rounded-2xl overflow-hidden aspect-square">
                                        <Image
                                            src={product.images[selectedImage]}
                                            alt={product.name}
                                            fill
                                            className="object-contain p-4 hover:scale-110 transition-transform duration-500"
                                        />
                                    </div>

                                    {/* Thumbnail Images */}
                                    <div className="flex gap-2 overflow-x-auto pb-2">
                                        {product.images.map((img, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => setSelectedImage(idx)}
                                                className={`relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition ${
                                                    selectedImage === idx ? 'border-red-600' : 'border-slate-200 hover:border-red-300'
                                                }`}
                                            >
                                                <Image
                                                    src={img}
                                                    alt={`${product.name} ${idx + 1}`}
                                                    fill
                                                    className="object-contain p-1"
                                                />
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Right: Details */}
                                <div className="space-y-6">
                                    {/* Category */}
                                    <div className="inline-block px-3 py-1 bg-slate-100 text-slate-600 text-sm rounded-full">
                                        {product.category}
                                    </div>

                                    {/* Title */}
                                    <h2 className="text-3xl font-bold text-slate-800">
                                        {product.name}
                                    </h2>

                                    {/* Rating */}
                                    <div className="flex items-center gap-2">
                                        <div className="flex">
                                            {[...Array(5)].map((_, i) => (
                                                <Star
                                                    key={i}
                                                    size={18}
                                                    className={i < 4 ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300'}
                                                />
                                            ))}
                                        </div>
                                        <span className="text-sm text-slate-600">(4.0 • 120 reviews)</span>
                                    </div>

                                    {/* Price */}
                                    <div className="flex items-baseline gap-3">
                                        <span className="text-4xl font-bold text-slate-800">
                                            {currency}{product.price}
                                        </span>
                                        {product.mrp > product.price && (
                                            <>
                                                <span className="text-xl text-slate-400 line-through">
                                                    {currency}{product.mrp}
                                                </span>
                                                <span className="text-green-600 font-semibold">
                                                    Save {currency}{product.mrp - product.price}
                                                </span>
                                            </>
                                        )}
                                    </div>

                                    {/* Description */}
                                    <p className="text-slate-600 leading-relaxed">
                                        {product.description || 'Experience premium quality with this amazing product. Perfect for everyday use with outstanding features and durability.'}
                                    </p>

                                    {/* Crash Cash Reward Badge */}
                                    {product.crashCashValue && (
                                        <div className="bg-amber-50 border-2 border-amber-300 rounded-lg p-3">
                                            <div className="flex items-center gap-2">
                                                <img src="/crashcash.ico" alt="Crash Cash" className="w-6 h-6" />
                                                <div>
                                                    <p className="font-semibold text-amber-900">Earn Crash Cash</p>
                                                    <p className="text-sm text-amber-800">Get {currency}{product.crashCashValue} on this purchase</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Features */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="flex items-center gap-2 text-sm text-slate-600">
                                            <Truck size={18} className="text-green-600" />
                                            <span>Free Delivery</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-slate-600">
                                            <Shield size={18} className="text-blue-600" />
                                            <span>1 Year Warranty</span>
                                        </div>
                                    </div>

                                    {/* Quantity Selector */}
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">
                                            Quantity
                                        </label>
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                                className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                                            >
                                                <Minus size={20} />
                                            </button>
                                            <span className="w-12 text-center font-semibold text-lg">
                                                {quantity}
                                            </span>
                                            <button
                                                onClick={() => setQuantity(quantity + 1)}
                                                className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                                            >
                                                <Plus size={20} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex gap-3">
                                        <button
                                            onClick={handleAddToCart}
                                            className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition shadow-lg hover:shadow-xl"
                                        >
                                            <ShoppingCart size={20} />
                                            Add to Cart
                                        </button>
                                        <button
                                            onClick={handleAddToWishlist}
                                            className="p-4 border-2 border-red-600 text-red-600 hover:bg-red-50 rounded-xl transition"
                                        >
                                            <Heart size={20} />
                                        </button>
                                    </div>

                                    {/* Additional Info */}
                                    <div className="border-t border-slate-200 pt-4 space-y-2 text-sm text-slate-600">
                                        <p>• In Stock - Ships within 24 hours</p>
                                        <p>• Cash on Delivery available</p>
                                        <p>• Easy 7-day returns</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}
