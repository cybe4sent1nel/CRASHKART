'use client'
import Counter from "@/components/Counter";
import PageTitle from "@/components/PageTitle";
import { deleteItemFromCart, clearCart } from "@/lib/features/cart/cartSlice";
import { addToWishlist } from "@/lib/features/wishlist/wishlistSlice";
import { Trash2Icon, ShoppingCart, Package, Tag, ArrowRight, Heart, ShoppingBag, Sparkles, CheckSquare, ChevronRight } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import EmptyGhostAnimation from "@/components/animations/EmptyGhostAnimation";
import Link from "next/link";
import { motion } from "framer-motion";
import NeonCheckbox from "@/components/NeonCheckbox";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { allProductsData } from "@/assets/assets";
import OutOfStockDisplay from "@/components/OutOfStockDisplay";

export default function Cart() {

    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '₹';
    const router = useRouter();
    
    const { cartItems } = useSelector(state => state.cart);
    const products = useSelector(state => state.product.list);

    const dispatch = useDispatch();

    const [cartArray, setCartArray] = useState([]);
    const [totalPrice, setTotalPrice] = useState(0);
    const [selectedItems, setSelectedItems] = useState([]);
    const [selectAll, setSelectAll] = useState(false);

    const createCartArray = () => {
        let totalPrice = 0;
        const cartArray = [];
        
        // Use products from Redux, fallback to allProductsData
        const productList = products && products.length > 0 ? products : allProductsData;
        
        for (const [key, value] of Object.entries(cartItems)) {
            // Try to find product by id or _id
            let product = productList?.find(p => p.id === key || p._id === key);
            
            if (product) {
                const price = product.price || product.originalPrice || 0;
                cartArray.push({
                    ...product,
                    id: product.id || product._id,
                    quantity: value,
                });
                totalPrice += price * value;
            }
        }
        
        setCartArray(cartArray);
        setTotalPrice(totalPrice);
    }

    const handleDeleteItemFromCart = (productId) => {
        dispatch(deleteItemFromCart({ productId }))
    }

    // Bulk selection handlers
    const handleSelectItem = (productId) => {
        setSelectedItems(prev => 
            prev.includes(productId) 
                ? prev.filter(id => id !== productId)
                : [...prev, productId]
        )
    }

    const handleSelectAll = () => {
        if (selectAll) {
            setSelectedItems([])
        } else {
            setSelectedItems(cartArray.map(item => item.id))
        }
        setSelectAll(!selectAll)
    }

    const handleBulkDelete = () => {
        if (selectedItems.length === 0) {
            toast.error('Please select items to delete')
            return
        }
        selectedItems.forEach(id => dispatch(deleteItemFromCart({ productId: id })))
        toast.success(`${selectedItems.length} item(s) removed from cart`)
        setSelectedItems([])
        setSelectAll(false)
    }

    const handleMoveToWishlist = () => {
        if (selectedItems.length === 0) {
            toast.error('Please select items to move')
            return
        }
        selectedItems.forEach(id => {
            const product = cartArray.find(item => item.id === id)
            if (product) {
                dispatch(addToWishlist(product))
                dispatch(deleteItemFromCart({ productId: id }))
            }
        })
        toast.success(`${selectedItems.length} item(s) moved to wishlist`)
        setSelectedItems([])
        setSelectAll(false)
    }

    useEffect(() => {
        // Update selectAll state when items change
        if (cartArray.length > 0 && selectedItems.length === cartArray.length) {
            setSelectAll(true)
        } else {
            setSelectAll(false)
        }
    }, [selectedItems, cartArray])

    useEffect(() => {
        if (products.length > 0) {
            createCartArray();
        }
    }, [cartItems, products]);

    return cartArray.length > 0 ? (
        <div className="min-h-screen mx-6 text-slate-800 dark:text-slate-200 py-6">

            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-xl">
                            <ShoppingCart className="w-6 h-6 text-red-500" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Shopping Cart</h1>
                            <p className="text-sm text-slate-500 dark:text-slate-400">{cartArray.length} item{cartArray.length !== 1 ? 's' : ''} in your cart</p>
                        </div>
                    </div>
                    <Link href="/shop" className="flex items-center gap-2 text-red-500 hover:text-red-600 font-medium transition-colors">
                        <ShoppingBag className="w-4 h-4" />
                        Continue Shopping
                    </Link>
                </div>

                {/* Bulk Actions Bar */}
                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 mb-4 shadow-md flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                        <NeonCheckbox 
                            checked={selectAll}
                            onChange={handleSelectAll}
                            size={20}
                        />
                        <span className="text-slate-700 dark:text-slate-200 font-medium">
                            {selectedItems.length > 0 ? `${selectedItems.length} selected` : 'Select All'}
                        </span>
                    </div>
                    {selectedItems.length > 0 && (
                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleMoveToWishlist}
                                className="flex items-center gap-2 px-4 py-2 bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 rounded-lg hover:bg-pink-200 dark:hover:bg-pink-900/50 transition font-medium"
                            >
                                <Heart className="w-4 h-4" />
                                Move to Wishlist
                            </button>
                            <button
                                onClick={handleBulkDelete}
                                className="flex items-center gap-2 px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition font-medium"
                            >
                                <Trash2Icon className="w-4 h-4" />
                                Delete Selected
                            </button>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Cart Items */}
                    <div className="lg:col-span-2 space-y-4">
                        {cartArray.map((item, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-md hover:shadow-lg transition-all"
                            >
                                <div className="flex gap-4 items-center">
                                    {/* Selection Checkbox */}
                                    <NeonCheckbox 
                                        checked={selectedItems.includes(item.id)}
                                        onChange={() => handleSelectItem(item.id)}
                                        size={20}
                                    />
                                    
                                    {/* Product Image */}
                                     <Link href={`/product/${item.id}`} className="flex-shrink-0">
                                         <div className="relative w-24 h-24 bg-slate-100 dark:bg-slate-700 rounded-xl overflow-hidden flex items-center justify-center group">
                                             {!item.inStock ? (
                                                 <>
                                                     {/* Show product image with out of stock overlay */}
                                                     <Image 
                                                         src={item.images[0]} 
                                                         className="h-20 w-auto object-contain opacity-30" 
                                                         alt={item.name} 
                                                         width={80} 
                                                         height={80} 
                                                     />
                                                     {/* Out of stock animation overlay */}
                                                     <div className='absolute inset-0 flex items-center justify-center'>
                                                         <OutOfStockDisplay size="small" />
                                                     </div>
                                                 </>
                                             ) : (
                                                 <Image 
                                                     src={item.images[0]} 
                                                     className="h-20 w-auto object-contain group-hover:scale-110 transition-transform" 
                                                     alt={item.name} 
                                                     width={80} 
                                                     height={80} 
                                                 />
                                             )}
                                         </div>
                                     </Link>
                                    
                                    {/* Product Info */}
                                    <div className="flex-1 min-w-0">
                                        <Link href={`/product/${item.id}`}>
                                            <h3 className="font-semibold text-slate-800 dark:text-white hover:text-red-500 transition-colors line-clamp-1">{item.name}</h3>
                                        </Link>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Tag className="w-3 h-3 text-slate-400" />
                                            <span className="text-xs text-slate-500 dark:text-slate-400">{item.category}</span>
                                        </div>
                                        <div className="flex items-center gap-2 mt-2">
                                            <span className="text-lg font-bold text-red-500">{currency}{item.price.toLocaleString()}</span>
                                            {item.mrp > item.price && (
                                                <span className="text-sm text-slate-400 line-through">{currency}{item.mrp.toLocaleString()}</span>
                                            )}
                                        </div>
                                        {item.crashCashValue > 0 && (
                                            <div className="flex items-center gap-1 mt-1">
                                                <Sparkles className="w-3 h-3 text-yellow-500" />
                                                <span className="text-xs text-yellow-600 dark:text-yellow-400">Earn {item.crashCashValue} CrashCash</span>
                                            </div>
                                        )}
                                    </div>
                                    
                                    {/* Quantity & Actions */}
                                    <div className="flex flex-col items-end gap-3">
                                        <Counter productId={item.id} />
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-slate-700 dark:text-slate-200">{currency}{(item.price * item.quantity).toLocaleString()}</span>
                                            <button 
                                                onClick={() => handleDeleteItemFromCart(item.id)} 
                                                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg active:scale-95 transition-all"
                                                title="Remove from cart"
                                            >
                                                <Trash2Icon size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                    {/* Checkout Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-lg p-8 sticky top-24 space-y-4">
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white">Order Total</h3>
                            
                            <div className="space-y-3 pb-4 border-b border-slate-200 dark:border-slate-700">
                                <div className="flex justify-between">
                                    <span className="text-slate-600 dark:text-slate-400">Subtotal:</span>
                                    <span className="font-semibold">{currency}{totalPrice.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-slate-500 dark:text-slate-400">
                                    <span>Shipping:</span>
                                    <span>Free</span>
                                </div>
                            </div>

                            <div className="flex justify-between items-center py-4">
                                <span className="text-lg font-bold text-slate-800 dark:text-white">Total:</span>
                                <span className="text-3xl font-bold text-red-500">{currency}{totalPrice.toLocaleString()}</span>
                            </div>

                            <button
                                onClick={() => router.push('/checkout')}
                                className="w-full px-6 py-4 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold rounded-lg transition shadow-lg hover:shadow-xl flex items-center justify-center gap-2 active:scale-95"
                            >
                                Proceed to Checkout
                                <ChevronRight size={20} />
                            </button>

                            <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
                                Secure checkout with multiple payment options
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    ) : (
        <div className="min-h-[80vh] mx-6 flex items-center justify-center">
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center"
            >
                <div className="mb-6">
                    <EmptyGhostAnimation width="250px" height="250px" />
                </div>
                <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full mb-4">
                    <ShoppingCart className="w-8 h-8 text-slate-400" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-white mb-3">Your cart is empty</h1>
                <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-md mx-auto">
                    Looks like you haven't added any items to your cart yet. Start shopping to fill it up!
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link href="/shop" className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl transition font-medium">
                        <ShoppingBag className="w-5 h-5" />
                        Start Shopping
                    </Link>
                    <Link href="/wishlist" className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl transition font-medium">
                        <Heart className="w-5 h-5" />
                        View Wishlist
                    </Link>
                </div>
            </motion.div>
        </div>
    )
}