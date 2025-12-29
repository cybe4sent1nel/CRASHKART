'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, Package, Tag, Gift, Megaphone, CheckCheck, Trash2, ArrowLeft, ShoppingBag, Heart, Coins, Settings, AlertTriangle, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import toast from 'react-hot-toast'
import EmptyGhostAnimation from '@/components/animations/EmptyGhostAnimation'

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
        bell: Bell,
        success: Check,
        error: AlertTriangle,
        warning: AlertTriangle,
        info: Bell
    }
    return icons[iconType] || Bell
}

export default function Notifications() {
    const router = useRouter()
    const [notifications, setNotifications] = useState([])
    const [filter, setFilter] = useState('all') // 'all', 'unread', 'read'
    const [loading, setLoading] = useState(true)

    // Get user ID from localStorage
    const getUserId = () => {
        if (typeof window !== 'undefined') {
            const user = JSON.parse(localStorage.getItem('user') || '{}')
            return user.id
        }
        return null
    }

    // Fetch notifications from API
    const fetchNotifications = async () => {
        const userId = getUserId()
        if (!userId) {
            setLoading(false)
            return
        }

        setLoading(true)
        try {
            const response = await fetch(`/api/notifications?userId=${userId}`)
            const data = await response.json()

            if (data.success) {
                setNotifications(data.notifications)
            }
        } catch (error) {
            console.error('Failed to fetch notifications:', error)
            toast.error('Failed to load notifications')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchNotifications()
    }, [])

    const unreadCount = notifications.filter(n => !n.isRead).length

    const filteredNotifications = notifications.filter(n => {
        if (filter === 'unread') return !n.isRead
        if (filter === 'read') return n.isRead
        return true
    })

    const markAsRead = async (id) => {
        try {
            const response = await fetch('/api/notifications', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ notificationId: id }),
            })

            if (response.ok) {
                fetchNotifications()
            }
        } catch (error) {
            console.error('Failed to mark as read:', error)
        }
    }

    const markAllAsRead = async () => {
        const userId = getUserId()
        if (!userId) return

        try {
            const response = await fetch('/api/notifications', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, markAllAsRead: true }),
            })

            if (response.ok) {
                // Update all notifications to read in state
                setNotifications(notifications.map(n => ({ ...n, isRead: true })))
                toast.success('All notifications marked as read')
            }
        } catch (error) {
            console.error('Failed to mark all as read:', error)
            toast.error('Failed to mark all as read')
        }
    }

    const deleteNotification = async (id) => {
        try {
            const response = await fetch(`/api/notifications?id=${id}`, {
                method: 'DELETE',
            })

            if (response.ok) {
                toast.success('Notification deleted')
                fetchNotifications()
            }
        } catch (error) {
            console.error('Failed to delete notification:', error)
            toast.error('Failed to delete notification')
        }
    }

    const clearAll = async () => {
        const userId = getUserId()
        if (!userId) return

        // Use toast confirm instead of browser confirm
        toast((t) => (
            <div className="flex flex-col gap-3">
                <p className="font-semibold">Delete all read notifications?</p>
                <div className="flex gap-2">
                    <button
                        onClick={async () => {
                            toast.dismiss(t.id)
                            try {
                                const response = await fetch(`/api/notifications?userId=${userId}&deleteAll=true`, {
                                    method: 'DELETE',
                                })
                                if (response.ok) {
                                    toast.success('All read notifications cleared')
                                    fetchNotifications()
                                }
                            } catch (error) {
                                console.error('Failed to clear notifications:', error)
                                toast.error('Failed to clear notifications')
                            }
                        }}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium"
                    >
                        Delete
                    </button>
                    <button
                        onClick={() => toast.dismiss(t.id)}
                        className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg text-sm font-medium"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        ), { duration: 5000 })
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
                                const IconComponent = getIcon(notification.type || 'info')
                                
                                // Get color based on type
                                const getColorClass = (type) => {
                                    const colors = {
                                        success: 'bg-green-100 dark:bg-green-900/30 text-green-500',
                                        error: 'bg-red-100 dark:bg-red-900/30 text-red-500',
                                        warning: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-500',
                                        info: 'bg-blue-100 dark:bg-blue-900/30 text-blue-500',
                                    }
                                    return colors[type] || colors.info
                                }
                                
                                return (
                                    <motion.div
                                        key={notification.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        transition={{ delay: index * 0.05 }}
                                        className={`bg-white dark:bg-slate-800 rounded-2xl shadow-md overflow-hidden group cursor-pointer transition-all hover:shadow-lg ${
                                            !notification.isRead ? 'border-l-4 border-green-500' : ''
                                        }`}
                                        onClick={() => handleNotificationClick(notification)}
                                    >
                                        <div className="p-4 flex gap-4">
                                            {/* Icon */}
                                            <div className={`p-3 rounded-xl ${getColorClass(notification.type)} flex-shrink-0`}>
                                                <IconComponent className="w-5 h-5" />
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div>
                                                        <h3 className={`font-semibold text-slate-800 dark:text-white ${!notification.isRead ? 'text-green-600 dark:text-green-400' : ''}`}>
                                                            {notification.title}
                                                        </h3>
                                                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">
                                                            {notification.message}
                                                        </p>
                                                    </div>
                                                    {!notification.isRead && (
                                                        <span className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0 mt-2"></span>
                                                    )}
                                                </div>
                                                <div className="flex items-center justify-between mt-3">
                                                    <span className="text-xs text-slate-400">
                                                        {new Date(notification.createdAt).toLocaleString()}
                                                    </span>
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
