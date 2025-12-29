'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Package, Search, Truck, CheckCircle, Clock, MapPin, 
  Phone, Mail, Calendar, CreditCard, Store, ChevronRight,
  AlertCircle, RefreshCw
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function TrackOrderPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [order, setOrder] = useState(null);
  const [tracking, setTracking] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) {
      toast.error('Please enter an order ID');
      return;
    }

    setLoading(true);
    setError('');
    setOrder(null);
    setTracking(null);

    try {
      const response = await fetch(`/api/orders/${searchQuery}/tracking`);
      const data = await response.json();

      if (data.success) {
        setOrder(data.order);
        setTracking(data.tracking);
      } else {
        setError(data.error || 'Order not found');
      }
    } catch (err) {
      setError('Failed to fetch order details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: Clock,
      processing: Package,
      shipped: Truck,
      out_for_delivery: Truck,
      delivered: CheckCircle,
      cancelled: AlertCircle
    };
    return icons[status] || Package;
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-500',
      processing: 'bg-blue-500',
      shipped: 'bg-purple-500',
      out_for_delivery: 'bg-orange-500',
      delivered: 'bg-green-500',
      cancelled: 'bg-red-500'
    };
    return colors[status] || 'bg-gray-500';
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full mb-4">
            <Package className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Track Your Order
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Enter your order ID to see real-time tracking information
          </p>
        </motion.div>

        {/* Search Form */}
        <motion.form
          onSubmit={handleSearch}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 mb-8"
        >
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Enter Order ID (e.g., ORD-XXXXXXXX)"
                className="w-full pl-12 pr-4 py-4 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-4 bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Tracking...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  Track
                </>
              )}
            </button>
          </div>
        </motion.form>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl p-6 text-center mb-8"
          >
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-red-700 dark:text-red-300 mb-1">
              Order Not Found
            </h3>
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </motion.div>
        )}

        {/* Order Details */}
        {order && tracking && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Status Card */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
              <div className={`${getStatusColor(order.status)} p-6 text-white`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {(() => {
                      const StatusIcon = getStatusIcon(order.status);
                      return <StatusIcon className="w-8 h-8" />;
                    })()}
                    <div>
                      <h2 className="text-2xl font-bold capitalize">
                        {order.status.replace(/_/g, ' ')}
                      </h2>
                      <p className="text-white/80">
                        Order ID: {order.orderId}
                      </p>
                    </div>
                  </div>
                  {tracking.estimatedDelivery && order.status !== 'delivered' && order.status !== 'cancelled' && (
                    <div className="text-right">
                      <p className="text-sm text-white/80">Estimated Delivery</p>
                      <p className="text-lg font-semibold">
                        {new Date(tracking.estimatedDelivery.earliest).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        {' - '}
                        {new Date(tracking.estimatedDelivery.latest).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Timeline */}
              <div className="p-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                  Tracking Timeline
                </h3>
                <div className="space-y-4">
                  {tracking.timeline.map((event, index) => (
                    <div key={index} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className={`w-4 h-4 rounded-full ${
                          event.completed 
                            ? 'bg-green-500' 
                            : 'bg-gray-300 dark:bg-gray-600'
                        }`} />
                        {index < tracking.timeline.length - 1 && (
                          <div className={`w-0.5 h-12 ${
                            event.completed && tracking.timeline[index + 1]?.completed
                              ? 'bg-green-500'
                              : 'bg-gray-200 dark:bg-gray-700'
                          }`} />
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="flex items-center justify-between">
                          <h4 className={`font-medium ${
                            event.completed 
                              ? 'text-gray-900 dark:text-white' 
                              : 'text-gray-400'
                          }`}>
                            {event.status}
                          </h4>
                          {event.timestamp && (
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              {formatDate(event.timestamp)}
                            </span>
                          )}
                        </div>
                        {event.description && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {event.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Order Info Grid */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Shipping Address */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <MapPin className="w-5 h-5 text-blue-500" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Shipping Address
                  </h3>
                </div>
                {order.address ? (
                  <div className="text-gray-600 dark:text-gray-400 space-y-1">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {order.address.fullName}
                    </p>
                    <p>{order.address.street}</p>
                    <p>{order.address.city}, {order.address.state} {order.address.zipCode}</p>
                    {order.address.phone && (
                      <p className="flex items-center gap-2 mt-2">
                        <Phone className="w-4 h-4" />
                        {order.address.phone}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400">
                    No address provided
                  </p>
                )}
              </div>

              {/* Order Summary */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <CreditCard className="w-5 h-5 text-green-500" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Order Summary
                  </h3>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>Order Date</span>
                    <span>{formatDate(order.createdAt)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>Items</span>
                    <span>{order.items?.length || 0}</span>
                  </div>
                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>Payment Method</span>
                    <span className="capitalize">{order.paymentMethod || 'N/A'}</span>
                  </div>
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
                    <div className="flex justify-between font-semibold text-gray-900 dark:text-white">
                      <span>Total</span>
                      <span className="text-red-500">₹{order.total?.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Package className="w-5 h-5 text-red-500" />
                Order Items ({order.items?.length || 0})
              </h3>
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {order.items?.map((item, index) => (
                  <div key={index} className="py-4 flex items-center gap-4">
                    <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-xl overflow-hidden relative flex-shrink-0">
                      {item.product?.images?.[0] ? (
                        <Image
                          src={item.product.images[0]}
                          alt={item.product.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <Link 
                        href={`/product/${item.productId}`}
                        className="font-medium text-gray-900 dark:text-white hover:text-red-500 transition-colors"
                      >
                        {item.product?.name || 'Product'}
                      </Link>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Qty: {item.quantity}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900 dark:text-white">
                        ₹{((item.price || 0) * item.quantity).toFixed(2)}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        ₹{item.price?.toFixed(2)} each
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Need Help */}
            <div className="bg-gradient-to-r from-red-500 to-orange-500 rounded-2xl shadow-xl p-6 text-white">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold mb-1">Need Help?</h3>
                  <p className="text-white/80">
                    Contact our support team for any questions about your order.
                  </p>
                </div>
                <div className="flex gap-3">
                  <Link
                    href="/contact"
                    className="px-6 py-3 bg-white text-red-500 font-semibold rounded-xl hover:bg-gray-100 transition-all flex items-center gap-2"
                  >
                    <Mail className="w-5 h-5" />
                    Contact Us
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* How It Works */}
        {!order && !error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8"
          >
            <h3 className="text-xl font-bold text-gray-900 dark:text-white text-center mb-8">
              How to Track Your Order
            </h3>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-red-500" />
                </div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Enter Order ID
                </h4>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Find your order ID in the confirmation email or your order history
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Truck className="w-8 h-8 text-blue-500" />
                </div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                  View Status
                </h4>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  See real-time updates on your order's journey to you
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Get Updates
                </h4>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Receive email notifications at every stage of delivery
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
