'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, Package, Tag, Gift, Megaphone, CheckCheck, Trash2, ArrowLeft, ShoppingBag, Heart, Coins, Settings } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import toast from 'react-hot-toast'
import EmptyGhostAnimation from '@/components/animations/EmptyGhostAnimation'

// Sample notifications data - in a real app, this would come from an API/database
const sampleNotifications = [
    {
        id: 1,
        type: 'order',
        title: 'Order Shipped!',
        message: 'Your order #ORD123ABC has been shipped and is on its way.',
        time: '2 hours ago',
        read: false,
        iconType: 'package',
        color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-500',
        link: '/my-orders'
    },
    {
        id: 2,
        type: 'promo',
        title: 'Flash Sale Live! 🔥',
        message: 'Get up to 50% off on electronics. Limited time only!',
        time: '5 hours ago',
        read: false,
        iconType: 'tag',
        color: 'bg-red-100 dark:bg-red-900/30 text-red-500',
        link: '/shop'
    },
    {
        id: 3,
        type: 'reward',
        title: 'CrashCash Earned! 🎉',
        message: 'You earned 50 CrashCash from your recent purchase.',
        time: '1 day ago',
        read: false,
        iconType: 'coins',
        color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-500',
        link: '/crash-cash'
    },
    {
        id: 4,
        type: 'wishlist',
        title: 'Price Drop Alert! 📉',
        message: 'An item in your wishlist is now 30% off!',
        time: '2 days ago',
        read: true,
        iconType: 'heart',
        color: 'bg-pink-100 dark:bg-pink-900/30 text-pink-500',
        link: '/wishlist'
    },
    {
        id: 5,
        type: 'promo',
        title: 'New Arrivals',
        message: 'Check out the latest products added to our store.',
        time: '3 days ago',
        read: true,
        iconType: 'shopping',
        color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-500',
        link: '/shop'
    },
    {
        id: 6,
        type: 'reward',
        title: 'Welcome Bonus!',
        message: 'Congratulations! You received 100 CrashCash as a welcome bonus.',
        time: '1 week ago',
        read: true,
        iconType: 'gift',
        color: 'bg-green-100 dark:bg-green-900/30 text-green-500',
        link: '/crash-cash'
    }
]

// Icon mapping function
const getIcon = (iconType) => {
    const icons = {
        package: Package,
        tag: Tag,
        coins: Coins,
        heart: Heart,
        shopping: ShoppingBag,
        gift: Gift,
        megaphone: Megaphone,
        bell: Bell
    }
    return icons[iconType] || Bell
}

export default function Notifications() {
    const router = useRouter()
    const [notifications, setNotifications] = useState([])
    const [filter, setFilter] = useState('all') // 'all', 'unread', 'read'
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Load notifications from localStorage or use sample data
        const savedNotifications = localStorage.getItem('notifications')
        if (savedNotifications) {
            setNotifications(JSON.parse(savedNotifications))
        } else {
            setNotifications(sampleNotifications)
            localStorage.setItem('notifications', JSON.stringify(sampleNotifications))
        }
        setLoading(false)
    }, [])

    const unreadCount = notifications.filter(n => !n.read).length

    const filteredNotifications = notifications.filter(n => {
        if (filter === 'unread') return !n.read
        if (filter === 'read') return n.read
        return true
    })

    const markAsRead = (id) => {
        const updated = notifications.map(n => 
            n.id === id ? { ...n, read: true } : n
        )
        setNotifications(updated)
        localStorage.setItem('notifications', JSON.stringify(updated))
    }

    const markAllAsRead = () => {
        const updated = notifications.map(n => ({ ...n, read: true }))
        setNotifications(updated)
        localStorage.setItem('notifications', JSON.stringify(updated))
        toast.success('All notifications marked as read')
    }

    const deleteNotification = (id) => {
        const updated = notifications.filter(n => n.id !== id)
        setNotifications(updated)
        localStorage.setItem('notifications', JSON.stringify(updated))
        toast.success('Notification deleted')
    }

    const clearAll = () => {
        setNotifications([])
        localStorage.setItem('notifications', JSON.stringify([]))
        toast.success('All notifications cleared')
    }

    const handleNotificationClick = (notification) => {
        markAsRead(notification.id)
        if (notification.link) {
            router.push(notification.link)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-8">
            <div className="max-w-3xl mx-auto px-4 sm:px-6">
                {/* Header */}
                <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between mb-6"
                >
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => router.back()}
                            className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition"
                        >
                            <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                        </button>
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                                <Bell className="w-6 h-6 text-green-500" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Notifications</h1>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
                                </p>
                            </div>
                        </div>
                    </div>
                    <Link 
                        href="/profile" 
                        className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition"
                        title="Notification Settings"
                    >
                        <Settings className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                    </Link>
                </motion.div>

                {/* Filter Tabs & Actions */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-4 mb-6"
                >
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        {/* Filter Tabs */}
                        <div className="flex gap-2">
                            {['all', 'unread', 'read'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setFilter(tab)}
                                    className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                                        filter === tab
                                            ? 'bg-green-500 text-white'
                                            : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                                    }`}
                                >
                                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                    {tab === 'unread' && unreadCount > 0 && (
                                        <span className="ml-2 px-1.5 py-0.5 bg-white/20 rounded-full text-xs">
                                            {unreadCount}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllAsRead}
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl text-sm font-medium hover:bg-blue-200 dark:hover:bg-blue-900/50 transition"
                                >
                                    <CheckCheck className="w-4 h-4" />
                                    Mark all read
                                </button>
                            )}
                            {notifications.length > 0 && (
                                <button
                                    onClick={clearAll}
                                    className="flex items-center gap-2 px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl text-sm font-medium hover:bg-red-200 dark:hover:bg-red-900/50 transition"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Clear all
                                </button>
                            )}
                        </div>
                    </div>
                </motion.div>

                {/* Notifications List */}
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="space-y-3"
                >
                    <AnimatePresence>
                        {filteredNotifications.length > 0 ? (
                            filteredNotifications.map((notification, index) => {
                                const IconComponent = getIcon(notification.iconType)
                                return (
                                    <motion.div
                                        key={notification.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        transition={{ delay: index * 0.05 }}
                                        className={`bg-white dark:bg-slate-800 rounded-2xl shadow-md overflow-hidden group cursor-pointer transition-all hover:shadow-lg ${
                                            !notification.read ? 'border-l-4 border-green-500' : ''
                                        }`}
                                        onClick={() => handleNotificationClick(notification)}
                                    >
                                        <div className="p-4 flex gap-4">
                                            {/* Icon */}
                                            <div className={`p-3 rounded-xl ${notification.color} flex-shrink-0`}>
                                                <IconComponent className="w-5 h-5" />
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div>
                                                        <h3 className={`font-semibold text-slate-800 dark:text-white ${!notification.read ? 'text-green-600 dark:text-green-400' : ''}`}>
                                                            {notification.title}
                                                        </h3>
                                                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">
                                                            {notification.message}
                                                        </p>
                                                    </div>
                                                    {!notification.read && (
                                                        <span className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0 mt-2"></span>
                                                    )}
                                                </div>
                                                <div className="flex items-center justify-between mt-3">
                                                    <span className="text-xs text-slate-400">{notification.time}</span>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            deleteNotification(notification.id)
                                                        }}
                                                        className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg text-red-500 transition"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )
                            })
                        ) : (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-center py-12"
                            >
                                <EmptyGhostAnimation width="200px" height="200px" />
                                <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full mb-4 mt-4">
                                    <Bell className="w-8 h-8 text-slate-400" />
                                </div>
                                <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
                                    {filter === 'unread' ? 'No unread notifications' : 
                                     filter === 'read' ? 'No read notifications' : 
                                     'No notifications yet'}
                                </h2>
                                <p className="text-slate-500 dark:text-slate-400 mb-6">
                                    {filter === 'all' 
                                        ? "We'll notify you when something important happens."
                                        : "Try switching to a different filter."}
                                </p>
                                <Link
                                    href="/shop"
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl transition font-medium"
                                >
                                    <ShoppingBag className="w-5 h-5" />
                                    Start Shopping
                                </Link>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </div>
        </div>
    )
}
