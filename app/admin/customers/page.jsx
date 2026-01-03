'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Spotlight } from "@/components/ui/spotlight"
import { Users, Search, Mail, ShoppingBag, Star, RefreshCw, MessageSquare, MapPin } from 'lucide-react'
import { toast } from 'react-hot-toast'
import Loading from '@/components/Loading'
import { motion } from 'framer-motion'

export default function CustomersPage() {
    const router = useRouter()
    const [authorized, setAuthorized] = useState(false)
    const [loading, setLoading] = useState(true)
    const [customers, setCustomers] = useState([])
    const [searchTerm, setSearchTerm] = useState('')
    const [sortBy, setSortBy] = useState('createdAt')
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [filter, setFilter] = useState('all') // all, active, inactive
    const [selectedCustomers, setSelectedCustomers] = useState(new Set())
    const [selectedCustomerDetail, setSelectedCustomerDetail] = useState(null)

    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '₹'

    // Generate gradient color for avatar based on name
    const getGradientColor = (name) => {
        const colors = [
            'from-blue-400 to-blue-600',
            'from-purple-400 to-purple-600',
            'from-pink-400 to-pink-600',
            'from-red-400 to-red-600',
            'from-orange-400 to-orange-600',
            'from-green-400 to-green-600',
            'from-teal-400 to-teal-600',
            'from-cyan-400 to-cyan-600'
        ]
        const index = (name?.charCodeAt(0) || 0) % colors.length
        return colors[index]
    }

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
            fetchCustomers()
        }
    }, [authorized, page, searchTerm, sortBy, filter])

    const fetchCustomers = async () => {
        try {
            setLoading(true)
            let params = new URLSearchParams({
                page: page.toString(),
                limit: '20',
                sortBy,
                sortOrder: 'desc'
            })

            if (searchTerm) params.append('search', searchTerm)
            if (filter === 'active') params.append('hasOrders', 'true')
            if (filter === 'inactive') params.append('hasOrders', 'false')

            const response = await fetch(`/api/admin/customers?${params}`, {
                credentials: 'include'
            })
            
            console.log('Fetch response status:', response.status, response.statusText)
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                console.error('API error:', errorData)
                throw new Error(`Failed to fetch customers: ${response.status} ${response.statusText}`)
            }
            
            const data = await response.json()
            
            if (data.success) {
                setCustomers(data.customers)
                setTotalPages(data.pagination.totalPages)
                setSelectedCustomers(new Set())
            }
        } catch (error) {
            console.error('Error fetching customers:', error)
            toast.error('Failed to load customers')
        } finally {
            setLoading(false)
        }
    }

    const toggleCustomerSelection = (customerId) => {
        const newSelected = new Set(selectedCustomers)
        if (newSelected.has(customerId)) {
            newSelected.delete(customerId)
        } else {
            newSelected.add(customerId)
        }
        setSelectedCustomers(newSelected)
    }

    const toggleSelectAll = () => {
        if (selectedCustomers.size === customers.length) {
            setSelectedCustomers(new Set())
        } else {
            setSelectedCustomers(new Set(customers.map(c => c.id)))
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

    const activeCustomers = customers.filter(c => c.totalOrders > 0).length
    const totalSpent = customers.reduce((sum, c) => sum + (c.totalSpent || 0), 0)

    return (
        <div className="text-slate-500 dark:text-slate-400 relative min-h-screen">
            <Spotlight className="absolute top-0 left-0 w-full h-[600px] pointer-events-none" fill="rgba(59, 130, 246, 0.08)" />
            <div className="relative z-10">
                <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl dark:text-slate-200">Customer <span className="text-slate-800 dark:text-white font-medium">Management</span></h1>
                        <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">View and manage all customers</p>
                    </div>
                    <button 
                        onClick={() => {
                            setPage(1)
                            fetchCustomers()
                        }}
                        className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-lg transition"
                    >
                        <RefreshCw size={18} />
                        Refresh
                    </button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-slate-500 dark:text-slate-400 text-sm">Total Customers</p>
                                <h3 className="text-3xl font-bold text-slate-800 dark:text-white mt-2">{customers.length}</h3>
                            </div>
                            <Users size={40} className="text-blue-500 opacity-30" />
                        </div>
                    </motion.div>

                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-slate-500 dark:text-slate-400 text-sm">Active Customers</p>
                                <h3 className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">{activeCustomers}</h3>
                            </div>
                            <ShoppingBag size={40} className="text-green-500 opacity-30" />
                        </div>
                    </motion.div>

                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-slate-500 dark:text-slate-400 text-sm">Total Spent</p>
                                <h3 className="text-3xl font-bold text-slate-800 dark:text-white mt-2">{currency}{totalSpent.toFixed(2)}</h3>
                            </div>
                            <Mail size={40} className="text-purple-500 opacity-30" />
                        </div>
                    </motion.div>
                </div>

                {/* Filters and Search */}
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 mb-6">
                    <div className="flex flex-col gap-4">
                        <div className="flex gap-3 flex-wrap items-center">
                            <div className="flex-1 min-w-64">
                                <div className="relative">
                                    <Search size={18} className="absolute left-3 top-3 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="Search by name, email, or phone..."
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
                                {['all', 'active', 'inactive'].map(f => (
                                    <button
                                        key={f}
                                        onClick={() => {
                                            setFilter(f)
                                            setPage(1)
                                        }}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                                            filter === f
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

                {/* Customers Table */}
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto max-h-[700px] overflow-y-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50 dark:bg-slate-900 sticky top-0">
                                <tr>
                                    <th className="px-6 py-4 text-left">
                                        <input
                                            type="checkbox"
                                            checked={selectedCustomers.size === customers.length && customers.length > 0}
                                            onChange={toggleSelectAll}
                                            className="w-4 h-4 rounded border-slate-300 text-red-600 focus:ring-red-500 cursor-pointer"
                                        />
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Name</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Email</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Phone</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Address</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Orders</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Total Spent</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Joined</th>
                                </tr>
                            </thead>
                            <tbody>
                                {customers.length > 0 ? (
                                    customers.map((customer) => (
                                        <tr key={customer.id} className="border-t border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition cursor-pointer" onClick={() => setSelectedCustomerDetail(customer)}>
                                            <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedCustomers.has(customer.id)}
                                                    onChange={() => toggleCustomerSelection(customer.id)}
                                                    className="w-4 h-4 rounded border-slate-300 text-red-600 focus:ring-red-500 cursor-pointer"
                                                />
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${getGradientColor(customer.name)} flex items-center justify-center text-xs font-semibold text-white`}>
                                                        {customer.name?.charAt(0) || 'U'}
                                                    </div>
                                                    <span className="font-medium text-slate-800 dark:text-white">{customer.name || 'N/A'}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{customer.email || 'N/A'}</td>
                                            <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{customer.phone || 'N/A'}</td>
                                            <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400 truncate max-w-xs">{customer.address || 'N/A'}</td>
                                            <td className="px-6 py-4 text-sm">
                                                <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                                                    customer.totalOrders > 0 
                                                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                                        : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-400'
                                                }`}>
                                                    {customer.totalOrders}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm font-semibold text-slate-800 dark:text-white">
                                                {currency}{(customer.totalSpent || 0).toFixed(2)}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                                                {new Date(customer.createdAt).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="8" className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                                            No customers found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
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
                        <div className="flex gap-1">
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                                <button
                                    key={p}
                                    onClick={() => setPage(p)}
                                    className={`w-10 h-10 rounded-lg font-medium transition ${
                                        page === p
                                            ? 'bg-red-600 text-white'
                                            : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700'
                                    }`}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={() => setPage(Math.min(totalPages, page + 1))}
                            disabled={page === totalPages}
                            className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
                        >
                            Next
                        </button>
                    </div>
                )}

                {/* Customer Details Modal */}
                {selectedCustomerDetail && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                        >
                            <div className="sticky top-0 bg-gradient-to-r from-red-600 to-red-700 p-6 text-white flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${getGradientColor(selectedCustomerDetail.name)} flex items-center justify-center text-lg font-bold`}>
                                        {selectedCustomerDetail.name?.charAt(0) || 'U'}
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold">{selectedCustomerDetail.name || 'Customer'}</h2>
                                        <p className="text-red-100">Customer ID: {selectedCustomerDetail.id}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedCustomerDetail(null)}
                                    className="text-2xl hover:text-red-100 transition"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="p-6 space-y-6">
                                {/* Contact Information */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                                        <Mail size={20} className="text-red-600" />
                                        Contact Information
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg">
                                            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Email</p>
                                            <p className="text-slate-800 dark:text-white font-medium mt-1">{selectedCustomerDetail.email || 'N/A'}</p>
                                        </div>
                                        <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg">
                                            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Phone</p>
                                            <p className="text-slate-800 dark:text-white font-medium mt-1">{selectedCustomerDetail.phone || 'N/A'}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Address Information */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                                        <MapPin size={20} className="text-red-600" />
                                        Address
                                    </h3>
                                    <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg">
                                        <p className="text-slate-800 dark:text-white font-medium">{selectedCustomerDetail.address || 'N/A'}</p>
                                    </div>
                                </div>

                                {/* Order Statistics */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                                        <ShoppingBag size={20} className="text-red-600" />
                                        Order Information
                                    </h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg">
                                            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Total Orders</p>
                                            <p className="text-2xl font-bold text-red-600 mt-1">{selectedCustomerDetail.totalOrders || 0}</p>
                                        </div>
                                        <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg">
                                            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Total Spent</p>
                                            <p className="text-2xl font-bold text-green-600 mt-1">{currency}{(selectedCustomerDetail.totalSpent || 0).toFixed(2)}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Account Information */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                                        <Users size={20} className="text-red-600" />
                                        Account Information
                                    </h3>
                                    <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg">
                                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Joined On</p>
                                        <p className="text-slate-800 dark:text-white font-medium mt-1">{new Date(selectedCustomerDetail.createdAt).toLocaleString()}</p>
                                    </div>
                                </div>

                                {/* Privacy Notice */}
                                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-lg text-sm text-blue-700 dark:text-blue-400">
                                    <p><strong>Note:</strong> Profile pictures and personal uploads are not displayed in admin view for privacy protection.</p>
                                </div>
                            </div>

                            <div className="sticky bottom-0 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 p-4 flex justify-end gap-3">
                                <button
                                    onClick={() => setSelectedCustomerDetail(null)}
                                    className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition font-medium"
                                >
                                    Close
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </div>
        </div>
    )
}
