'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, Trash2, Bell, BellOff, ShoppingCart, TrendingDown, Package } from 'lucide-react';
import toast from 'react-hot-toast';
import OutOfStockDisplay from './OutOfStockDisplay';

export default function Wishlist({ userId }) {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchWishlist();
    }
  }, [userId]);

  const fetchWishlist = async () => {
    try {
      const response = await fetch(`/api/wishlist?userId=${userId}`, {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        setWishlist(data.wishlist);
      }
    } catch (error) {
      console.error('Failed to fetch wishlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeFromWishlist = async (productId) => {
    try {
      const response = await fetch(`/api/wishlist?userId=${userId}&productId=${productId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        setWishlist(prev => prev.filter(item => item.productId !== productId));
        toast.success('Removed from wishlist');
      }
    } catch (error) {
      toast.error('Failed to remove item');
    }
  };

  const toggleNotification = async (productId, type, currentValue) => {
    try {
      const updateData = {
        userId,
        productId,
        [type]: !currentValue
      };

      const response = await fetch('/api/wishlist', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });

      const data = await response.json();
      if (data.success) {
        setWishlist(prev => prev.map(item => 
          item.productId === productId 
            ? { ...item, [type]: !currentValue }
            : item
        ));
        toast.success(`${type === 'notifyPrice' ? 'Price' : 'Stock'} alerts ${!currentValue ? 'enabled' : 'disabled'}`);
      }
    } catch (error) {
      toast.error('Failed to update preferences');
    }
  };

  const addToCart = async (product) => {
    // Get existing cart from localStorage
    const existingCart = JSON.parse(localStorage.getItem('cart') || '[]');
    
    // Check if product already in cart
    const existingIndex = existingCart.findIndex(item => item.id === product.id);
    
    if (existingIndex >= 0) {
      existingCart[existingIndex].quantity += 1;
    } else {
      existingCart.push({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.images?.[0],
        quantity: 1
      });
    }
    
    localStorage.setItem('cart', JSON.stringify(existingCart));
    try {
      // persist sale price override if available
      const { CartOverrides } = await import('@/lib/cartOverrides')
      if (product?.salePrice || product?.price) {
        CartOverrides.set(product.id || product.productId, { salePrice: product.salePrice || product.price, expiresAt: localStorage.getItem('flashSaleEndTime') || null })
      }
    } catch (e) {
      // dynamic import failure should not block
      console.warn('Cart override dynamic import failed', e)
    }
    window.dispatchEvent(new Event('cartUpdated'));
    toast.success('Added to cart');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
      </div>
    );
  }

  if (wishlist.length === 0) {
    return (
      <div className="text-center py-20">
        <Heart className="w-20 h-20 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Your wishlist is empty
        </h3>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          Save items you love to your wishlist and get notified about price drops!
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-xl font-medium transition-all"
        >
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Heart className="w-6 h-6 text-red-500" />
          My Wishlist ({wishlist.length})
        </h2>
      </div>

      {/* Wishlist Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <AnimatePresence>
          {wishlist.map((item) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden group"
            >
              {/* Product Image */}
              <Link href={`/product/${item.productId}`} className="block relative">
                <div className="aspect-square relative overflow-hidden">
                   {!item.product?.inStock ? (
                     <>
                       {/* Show product image with out of stock overlay */}
                       {item.product?.images?.[0] ? (
                         <Image
                           src={item.product.images[0]}
                           alt={item.product.name}
                           fill
                           className="object-cover opacity-30"
                         />
                       ) : (
                         <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center opacity-30">
                           <Package className="w-12 h-12 text-gray-400" />
                         </div>
                       )}
                       {/* Out of stock animation overlay */}
                       <div className="absolute inset-0 flex items-center justify-center">
                         <OutOfStockDisplay size="small" />
                       </div>
                     </>
                   ) : (
                     <>
                       {item.product?.images?.[0] ? (
                         <Image
                           src={item.product.images[0]}
                           alt={item.product.name}
                           fill
                           className="object-cover group-hover:scale-105 transition-transform duration-300"
                         />
                       ) : (
                         <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                           <Package className="w-12 h-12 text-gray-400" />
                         </div>
                       )}
                       
                       {/* Price Drop Badge */}
                       {item.priceDropped && (
                         <div className="absolute top-3 left-3 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                           <TrendingDown className="w-4 h-4" />
                           {item.priceDropPercent}% OFF
                         </div>
                       )}
                     </>
                   )}
                 </div>
              </Link>

              {/* Product Info */}
              <div className="p-4">
                <Link href={`/product/${item.productId}`}>
                  <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2 hover:text-red-500 transition-colors">
                    {item.product?.name || 'Product Unavailable'}
                  </h3>
                </Link>

                {/* Price */}
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xl font-bold text-red-500">
                    ₹{item.product?.price?.toFixed(2)}
                  </span>
                  {item.priceDropped && (
                    <span className="text-sm text-gray-400 line-through">
                      ₹{item.originalPrice?.toFixed(2)}
                    </span>
                  )}
                </div>

                {/* Store */}
                {item.product?.store && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    by {item.product.store.name}
                  </p>
                )}

                {/* Notification Toggles */}
                <div className="flex items-center gap-2 mt-3">
                  <button
                    onClick={() => toggleNotification(item.productId, 'notifyPrice', item.notifyPrice)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      item.notifyPrice
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-500'
                    }`}
                    title="Price drop alerts"
                  >
                    <TrendingDown className="w-3.5 h-3.5" />
                    Price
                  </button>
                  <button
                    onClick={() => toggleNotification(item.productId, 'notifyStock', item.notifyStock)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      item.notifyStock
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-500'
                    }`}
                    title="Back in stock alerts"
                  >
                    <Package className="w-3.5 h-3.5" />
                    Stock
                  </button>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 mt-4">
                  <button
                    onClick={() => item.product?.inStock && addToCart(item.product)}
                    disabled={!item.product?.inStock}
                    className="flex-1 flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white py-2.5 rounded-xl font-medium transition-all"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    Add to Cart
                  </button>
                  <button
                    onClick={() => removeFromWishlist(item.productId)}
                    className="p-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-500 hover:text-red-500 rounded-xl transition-all"
                    title="Remove from wishlist"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Wishlist Button for product cards
export function WishlistButton({ productId, userId, className = '' }) {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if product is in wishlist
    checkWishlistStatus();
  }, [productId, userId]);

  const checkWishlistStatus = async () => {
    if (!userId) return;
    
    try {
      const response = await fetch(`/api/wishlist?userId=${userId}`);
      const data = await response.json();
      if (data.success) {
        const inWishlist = data.wishlist.some(item => item.productId === productId);
        setIsWishlisted(inWishlist);
      }
    } catch (error) {
      console.error('Failed to check wishlist status:', error);
    }
  };

  const toggleWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!userId) {
      toast.error('Please login to add to wishlist');
      return;
    }

    setLoading(true);
    try {
      if (isWishlisted) {
        const response = await fetch(`/api/wishlist?userId=${userId}&productId=${productId}`, {
          method: 'DELETE'
        });
        if ((await response.json()).success) {
          setIsWishlisted(false);
          toast.success('Removed from wishlist');
        }
      } else {
        const response = await fetch('/api/wishlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, productId })
        });
        if ((await response.json()).success) {
          setIsWishlisted(true);
          toast.success('Added to wishlist');
        }
      }
    } catch (error) {
      toast.error('Failed to update wishlist');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={toggleWishlist}
      disabled={loading}
      className={`p-2 rounded-full transition-all ${
        isWishlisted 
          ? 'bg-red-500 text-white' 
          : 'bg-white/80 dark:bg-gray-800/80 text-gray-600 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-500'
      } ${className}`}
    >
      <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`} />
    </button>
  );
}
