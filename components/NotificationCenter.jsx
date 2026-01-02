'use client';

import { useState, useEffect } from 'react';
import { Bell, X, Check, Trash2, ExternalLink, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import LottieAnimation from './LottieAnimation'
import toast from 'react-hot-toast';

export default function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Get user from localStorage
  const getUserId = () => {
    if (typeof window !== 'undefined') {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      return user.id;
    }
    return null;
  };

  // Fetch notifications
  const fetchNotifications = async () => {
    const userId = getUserId();
    if (!userId) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/notifications?userId=${userId}&unreadOnly=true`);
      const data = await response.json();

      if (data.success) {
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Mark as read
  const markAsRead = async (notificationId) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId }),
      });

      if (response.ok) {
        fetchNotifications();
      }
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    const userId = getUserId();
    if (!userId) return;

    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, markAllAsRead: true }),
      });

      if (response.ok) {
        // Immediately clear notifications and reset count
        setNotifications([]);
        setUnreadCount(0);
        toast.success('All notifications marked as read');
      }
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      toast.error('Failed to mark all as read');
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId) => {
    try {
      const response = await fetch(`/api/notifications?id=${notificationId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Notification deleted');
        fetchNotifications();
      }
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  // Handle notification click
  const handleNotificationClick = (notification) => {
    markAsRead(notification.id);
    if (notification.link) {
      router.push(notification.link);
      setIsOpen(false);
    }
  };

  // Fetch on mount and set polling
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Poll every 30s

    // Listen for immediate events to refresh
    const handler = () => fetchNotifications()
    window.addEventListener('crashcash-added', handler)
    window.addEventListener('crashcash-update', handler)

    return () => {
      clearInterval(interval);
      window.removeEventListener('crashcash-added', handler)
      window.removeEventListener('crashcash-update', handler)
    }
  }, []);

  // Load empty-state animation when there are no notifications
  const [emptyAnimation, setEmptyAnimation] = useState(null)
  useEffect(() => {
    if (!loading && notifications.length === 0) {
      const path = '/animations/Empty%20Notifications.json'
      fetch(path)
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data) setEmptyAnimation(data)
        })
        .catch(err => console.warn('Failed to load empty notifications animation:', err))
    }
  }, [loading, notifications.length])

  // Get icon based on notification type
  const getIcon = (type) => {
    const iconClasses = "w-5 h-5";
    switch (type) {
      case 'success':
        return <Check className={`${iconClasses} text-green-500`} />;
      case 'error':
        return <X className={`${iconClasses} text-red-500`} />;
      case 'warning':
        return <AlertTriangle className={`${iconClasses} text-yellow-500`} />;
      default:
        return <Bell className={`${iconClasses} text-blue-500`} />;
    }
  };

  return (
    <div className="relative">
      {/* Bell Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-6 h-6 text-gray-700 dark:text-gray-300" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/20 z-40"
            />

            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="absolute right-0 mt-2 w-96 max-w-[calc(100vw-2rem)] bg-white dark:bg-gray-900 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 z-50 max-h-[600px] flex flex-col"
            >
              {/* Header */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                    Notifications
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {unreadCount} unread
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1"
                    >
                      <Check className="w-4 h-4" />
                      Mark all read
                    </button>
                  )}
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Notifications List */}
              <div className="flex-1 overflow-y-auto">
                {loading ? (
                  <div className="p-8 text-center text-gray-500">
                    Loading...
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="p-8 text-center">
                    {emptyAnimation ? (
                      <div className="mx-auto mb-3" style={{ width: 220, height: 220 }}>
                        <LottieAnimation animationData={emptyAnimation} width={220} height={220} loop={true} />
                      </div>
                    ) : (
                      <Bell className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                    )}
                    <p className="text-gray-500 dark:text-gray-400">
                      No notifications yet
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {notifications.map((notification) => (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer ${
                          !notification.isRead
                            ? 'bg-blue-50 dark:bg-blue-900/10 border-l-4 border-blue-500'
                            : ''
                        }`}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="text-2xl flex-shrink-0">
                            {getIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                                {notification.title}
                              </h4>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteNotification(notification.id);
                                }}
                                className="text-gray-400 hover:text-red-500 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                              {notification.message}
                            </p>
                            <div className="flex items-center justify-between mt-2">
                              <p className="text-xs text-gray-400">
                                {new Date(notification.createdAt).toLocaleString()}
                              </p>
                              {notification.link && (
                                <ExternalLink className="w-3 h-3 text-gray-400" />
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
