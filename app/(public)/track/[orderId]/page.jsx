'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Package, Truck, CheckCircle, Clock, MapPin, 
  Phone, Mail, Calendar, CreditCard, Store, ChevronRight,
  AlertCircle, RefreshCw, ArrowLeft
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function TrackOrderByIdPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params?.orderId;
  
  const [order, setOrder] = useState(null);
  const [tracking, setTracking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId]);

  const fetchOrderDetails = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/orders/${orderId}/tracking`);
      const data = await response.json();

      if (data.success) {
        setOrder(data.order);
        setTracking(data.tracking);
      } else {
        setError(data.error || 'Order not found');
        toast.error('Order not found');
      }
    } catch (err) {
      setError('Failed to fetch order details. Please try again.');
      toast.error('Failed to load order');
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
      cancelled: AlertCircle,
      order_placed: Package
    };
    return icons[status?.toLowerCase()] || Package;
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-500',
      processing: 'bg-blue-500',
      shipped: 'bg-purple-500',
      out_for_delivery: 'bg-orange-500',
      delivered: 'bg-green-500',
      cancelled: 'bg-red-500',
      order_placed: 'bg-blue-500'
    };
    return colors[status?.toLowerCase()] || 'bg-gray-500';
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center"
          >
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Order Not Found
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {error}
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => router.push('/my-orders')}
                className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                View My Orders
              </button>
              <button
                onClick={() => router.push('/track-order')}
                className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
              >
                Track Another Order
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  if (!order) {
    return null;
  }

  const StatusIcon = getStatusIcon(order.status);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Back Button */}
        <Link
          href="/my-orders"
          className="inline-flex items-center gap-2 text-red-600 hover:text-red-700 mb-6 transition"
        >
          <ArrowLeft size={20} />
          Back to My Orders
        </Link>

        {/* Order Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Order #{order.id.slice(-8).toUpperCase()}
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Placed on {formatDate(order.createdAt)}
              </p>
            </div>
            <div className={`flex items-center gap-2 px-4 py-2 ${getStatusColor(order.status)} bg-opacity-10 rounded-full`}>
              <StatusIcon className={`w-5 h-5 ${getStatusColor(order.status).replace('bg-', 'text-')}`} />
              <span className={`font-medium ${getStatusColor(order.status).replace('bg-', 'text-')}`}>
                {order.status?.replace(/_/g, ' ').toUpperCase()}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <CreditCard className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Payment Method</p>
                <p className="font-medium text-gray-900 dark:text-white">{order.paymentMethod}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Package className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Total Items</p>
                <p className="font-medium text-gray-900 dark:text-white">{order.orderItems?.length || 0}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Order Total</p>
                <p className="font-medium text-gray-900 dark:text-white">₹{order.total}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Tracking Timeline */}
        {tracking && tracking.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6"
          >
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
              Tracking History
            </h2>
            <div className="space-y-4">
              {tracking.map((event, index) => {
                const EventIcon = getStatusIcon(event.status);
                return (
                  <div key={index} className="flex gap-4">
                    <div className="relative">
                      <div className={`flex items-center justify-center w-10 h-10 rounded-full ${getStatusColor(event.status)}`}>
                        <EventIcon className="w-5 h-5 text-white" />
                      </div>
                      {index < tracking.length - 1 && (
                        <div className="absolute left-5 top-10 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700 -mb-4"></div>
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {event.status?.replace(/_/g, ' ').toUpperCase()}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {event.message || event.description}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        {formatDate(event.timestamp || event.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Delivery Address */}
        {order.address && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6"
          >
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-red-600" />
              Delivery Address
            </h2>
            <div className="space-y-2">
              <p className="font-medium text-gray-900 dark:text-white">{order.address.name}</p>
              <p className="text-gray-600 dark:text-gray-400">{order.address.street}</p>
              <p className="text-gray-600 dark:text-gray-400">
                {order.address.city}, {order.address.state} - {order.address.zip}
              </p>
              {order.address.phone && (
                <p className="text-gray-600 dark:text-gray-400 flex items-center gap-2 mt-3">
                  <Phone size={16} />
                  {order.address.phone}
                </p>
              )}
            </div>
          </motion.div>
        )}

        {/* Order Items */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6"
        >
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Order Items
          </h2>
          <div className="space-y-4">
            {order.orderItems?.map((item, index) => (
              <div key={index} className="flex gap-4 pb-4 border-b border-gray-200 dark:border-gray-700 last:border-0">
                {item.product?.images?.[0] && (
                  <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden flex-shrink-0">
                    <Image
                      src={item.product.images[0]}
                      alt={item.product.name || 'Product'}
                      width={80}
                      height={80}
                      className="object-cover w-full h-full"
                    />
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    {item.product?.name || item.name || 'Product'}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Quantity: {item.quantity}
                  </p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                    ₹{item.price}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Refresh Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center mt-6"
        >
          <button
            onClick={fetchOrderDetails}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
          >
            <RefreshCw size={16} />
            Refresh Status
          </button>
        </motion.div>
      </div>
    </div>
  );
}
