'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Spotlight } from "@/components/ui/spotlight"
import { Activity, Search, Clock, RefreshCw, ShoppingBag, Users, Package } from 'lucide-react'
import { toast } from 'react-hot-toast'
import Loading from '@/components/Loading'
import { motion } from 'framer-motion'

export default function AdminEventsPage() {
    const router = useRouter()
    const [authorized, setAuthorized] = useState(false)
    const [loading, setLoading] = useState(true)
    const [events, setEvents] = useState([])
    const [filterType, setFilterType] = useState('all') // all, order, user, product
    const [searchTerm, setSearchTerm] = useState('')
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)

    useEffect(() => {
        // Check authorization
        const isDemoMode = localStorage.getItem('isDemoMode') === 'true'
        const admin2FAVerified = sessionStorage.getItem('admin2FAVerified') === 'true' || localStorage.getItem('admin2FAVerified') === 'true'
        const isAdmin = localStorage.getItem('isAdmin') === 'true'
        
        const userEmail = localStorage.getItem('user') 
            ? JSON.parse(localStorage.getItem('user'))?.email 
            : localStorage.getItem('googleUser')
            ? JSON.parse(localStorage.getItem('googleUser'))?.email
            : null
        const isMainAdminLoggedIn = userEmail === 'crashkart.help@gmail.com'

        if (isDemoMode || (admin2FAVerified && isAdmin)) {
            setAuthorized(true)
        } else if (isMainAdminLoggedIn && !admin2FAVerified) {
            router.push('/admin/login')
        } else if (!userEmail) {
            router.push('/admin/login')
        } else {
            router.push('/admin/login')
        }
    }, [router])

    useEffect(() => {
        if (authorized) {
            fetchEvents()
        }
    }, [authorized, page, filterType, searchTerm])

    const fetchEvents = async () => {
        try {
            setLoading(true)
            let params = new URLSearchParams({
                page: page.toString(),
                limit: '50'
            })

            if (filterType !== 'all') params.append('eventType', filterType)
            if (searchTerm) params.append('search', searchTerm)

            const response = await fetch(`/api/admin/events?${params}`)
            
            if (!response.ok) throw new Error('Failed to fetch events')
            
            const data = await response.json()
            
            if (data.success) {
                setEvents(data.events)
                setTotalPages(data.pagination.totalPages)
            }
        } catch (error) {
            console.error('Error fetching events:', error)
            toast.error('Failed to load events')
        } finally {
            setLoading(false)
        }
    }

    const getEventIcon = (type) => {
        switch(type) {
            case 'order': return <ShoppingBag size={16} />
            case 'user': return <Users size={16} />
            case 'product': return <Package size={16} />
            default: return <Activity size={16} />
        }
    }

    const getEventColor = (type) => {
        switch(type) {
            case 'order': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
            case 'user': return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
            case 'product': return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
            default: return 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-400'
        }
    }

    if (!authorized) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-red-200 border-t-red-600 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-600">Verifying authorization...</p>
                </div>
            </div>
        )
    }

    if (loading) return <Loading />

    return (
        <div className="text-slate-500 dark:text-slate-400 relative min-h-screen">
            <Spotlight className="absolute top-0 left-0 w-full h-[600px] pointer-events-none" fill="rgba(59, 130, 246, 0.08)" />
            <div className="relative z-10">
                <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl dark:text-slate-200">Activity <span className="text-slate-800 dark:text-white font-medium">Log</span></h1>
                        <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Track all system events and changes in real-time</p>
                    </div>
                    <button 
                        onClick={() => {
                            setPage(1)
                            fetchEvents()
                        }}
                        className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-lg transition"
                    >
                        <RefreshCw size={18} />
                        Refresh
                    </button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4"
                    >
                        <div className="flex items-center gap-3">
                            <Activity size={24} className="text-blue-500" />
                            <div>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Total Events</p>
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white">{events.length}</h3>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4"
                    >
                        <div className="flex items-center gap-3">
                            <ShoppingBag size={24} className="text-orange-500" />
                            <div>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Orders</p>
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                                    {events.filter(e => e.type === 'order').length}
                                </h3>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4"
                    >
                        <div className="flex items-center gap-3">
                            <Users size={24} className="text-green-500" />
                            <div>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Users</p>
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                                    {events.filter(e => e.type === 'user').length}
                                </h3>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4"
                    >
                        <div className="flex items-center gap-3">
                            <Package size={24} className="text-purple-500" />
                            <div>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Products</p>
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                                    {events.filter(e => e.type === 'product').length}
                                </h3>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Filters */}
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 mb-6">
                    <div className="flex flex-col gap-4">
                        <div className="flex gap-3 flex-wrap items-center">
                            <div className="flex-1 min-w-64">
                                <div className="relative">
                                    <Search size={18} className="absolute left-3 top-3 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="Search events..."
                                        value={searchTerm}
                                        onChange={(e) => {
                                            setSearchTerm(e.target.value)
                                            setPage(1)
                                        }}
                                        className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-2">
                                {['all', 'order', 'user', 'product'].map(f => (
                                    <button
                                        key={f}
                                        onClick={() => {
                                            setFilterType(f)
                                            setPage(1)
                                        }}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                                            filterType === f
                                                ? 'bg-red-600 text-white'
                                                : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                                        }`}
                                    >
                                        {f.charAt(0).toUpperCase() + f.slice(1)}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Events Timeline */}
                <div className="space-y-3">
                    {events.length > 0 ? (
                        events.map((event, index) => (
                            <motion.div
                                key={event.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 hover:shadow-md transition"
                            >
                                <div className="flex items-start gap-4">
                                    {/* Event Icon */}
                                    <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${getEventColor(event.type)}`}>
                                        {getEventIcon(event.type)}
                                    </div>

                                    {/* Event Details */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <p className="font-semibold text-slate-800 dark:text-white text-sm">
                                                    {event.entity.name}
                                                </p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                                    {event.action.replace('_', ' ')}
                                                </p>
                                                {event.entity.customer && (
                                                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                                                        Customer: {event.entity.customer}
                                                    </p>
                                                )}
                                            </div>

                                            {/* Status Badge */}
                                            {event.entity.status && (
                                                <span className={`flex-shrink-0 px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${
                                                    event.entity.status === 'DELIVERED' || event.entity.status === 'PROCESSING'
                                                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                                        : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                                                }`}>
                                                    {event.entity.status}
                                                </span>
                                            )}
                                        </div>

                                        {/* Additional Details */}
                                        <div className="flex items-center gap-4 mt-2 text-xs text-slate-600 dark:text-slate-400 flex-wrap">
                                            {event.entity.total && (
                                                <span>Total: ₹{event.entity.total}</span>
                                            )}
                                            {event.entity.price && (
                                                <span>Price: ₹{event.entity.price}</span>
                                            )}
                                            {event.entity.paymentMethod && (
                                                <span>Payment: {event.entity.paymentMethod}</span>
                                            )}
                                            <span className="flex items-center gap-1">
                                                <Clock size={12} />
                                                {new Date(event.timestamp).toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    ) : (
                        <div className="text-center py-12 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
                            <Activity size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                            <p className="text-slate-500 dark:text-slate-400">No events found</p>
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-6">
                        <button
                            onClick={() => setPage(Math.max(1, page - 1))}
                            disabled={page === 1}
                            className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
                        >
                            Previous
                        </button>
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                            Page {page} of {totalPages}
                        </span>
                        <button
                            onClick={() => setPage(Math.min(totalPages, page + 1))}
                            disabled={page === totalPages}
                            className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
