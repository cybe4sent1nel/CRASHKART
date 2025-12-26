'use client'

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Trash2, Edit2, Eye, Star } from 'lucide-react';
import Image from 'next/image';

export default function AdminProductsPage() {
  const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '₹';
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showReviewsModal, setShowReviewsModal] = useState(false);
  const [averageRating, setAverageRating] = useState(0);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/products/search?limit=1000');
      const data = await response.json();
      if (data.success) {
        setProducts(data.products);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async (productId) => {
    try {
      const response = await fetch(`/api/products/ratings?productId=${productId}&limit=100`);
      const data = await response.json();
      if (data.success) {
        setReviews(data.ratings);
        setAverageRating(data.averageRating);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
      toast.error('Failed to load reviews');
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleViewReviews = (product) => {
    setSelectedProduct(product);
    fetchReviews(product.id);
    setShowReviewsModal(true);
  };

  const handleDeleteProduct = async (productId) => {
    const { showConfirm } = await import('@/lib/alertUtils');
    const confirmed = await showConfirm(
      'Delete Product?',
      'Are you sure you want to delete this product? This action cannot be undone.'
    );
    
    if (!confirmed) return;
    
    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setProducts(products.filter(p => p.id !== productId));
        toast.success('Product deleted successfully');
      } else {
        toast.error('Failed to delete product');
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Error deleting product');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Product Management
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Total Products: {products.length}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No products found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map(product => (
              <div
                key={product.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition"
              >
                <div className="relative w-full h-48 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  {product.images && product.images[0] ? (
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center text-gray-500 dark:text-gray-400">
                      <p>No Image</p>
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                    {product.name}
                  </h3>

                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 my-2">
                    {product.description}
                  </p>

                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg font-bold text-gray-900 dark:text-white">
                      {currency}{product.price}
                    </span>
                    <span className="text-sm text-gray-500 line-through">
                      {currency}{product.mrp}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex gap-1">
                      {Array(5).fill('').map((_, i) => (
                        <Star
                          key={i}
                          size={14}
                          className={i < Math.round(product.avgRating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      ({product.totalRatings || 0})
                    </span>
                  </div>

                  <div className="flex gap-2 mb-3">
                    <span className={`text-xs px-2 py-1 rounded ${product.inStock ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
                      {product.inStock ? 'In Stock' : 'Out of Stock'}
                    </span>
                    <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      Stock: {product.quantity}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleViewReviews(product)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm transition"
                    >
                      <Eye size={16} />
                      Reviews ({product.totalRatings || 0})
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(product.id)}
                      className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded text-sm transition"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reviews Modal */}
      {showReviewsModal && selectedProduct && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6">
              <div className="flex justify-between items-start gap-4">
                <div className="flex gap-4 items-start flex-1">
                  {selectedProduct.images && selectedProduct.images[0] && (
                    <img
                      src={selectedProduct.images[0]}
                      alt={selectedProduct.name}
                      className="w-20 h-20 object-cover rounded flex-shrink-0"
                    />
                  )}
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {selectedProduct.name}
                    </h2>
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex gap-1">
                        {Array(5).fill('').map((_, i) => (
                          <Star
                            key={i}
                            size={18}
                            className={i < Math.round(averageRating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {averageRating.toFixed(1)} ({reviews.length} reviews)
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setShowReviewsModal(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 flex-shrink-0"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6">
              {reviews.length === 0 ? (
                <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                  No reviews yet
                </p>
              ) : (
                <div className="space-y-6">
                  {reviews.map(review => (
                    <div
                      key={review.id}
                      className="border-b border-gray-200 dark:border-gray-700 pb-6 last:border-0"
                    >
                      <div className="flex items-start gap-4">
                        {review.user?.image && (
                          <Image
                            src={review.user.image?.src || review.user.image}
                            alt={review.user.name}
                            width={40}
                            height={40}
                            className="rounded-full"
                          />
                        )}
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <p className="font-semibold text-gray-900 dark:text-white">
                                {review.user?.name}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {new Date(review.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex gap-1">
                              {Array(5).fill('').map((_, i) => (
                                <Star
                                  key={i}
                                  size={14}
                                  className={i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
                                />
                              ))}
                            </div>
                          </div>
                          <p className="text-gray-700 dark:text-gray-300 text-sm">
                            {review.review}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
