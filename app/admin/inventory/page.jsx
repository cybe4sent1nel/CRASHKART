'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Spotlight } from "@/components/ui/spotlight"
import { Package, Search, RefreshCw, Edit2, AlertTriangle, CheckCircle, AlertCircle, Bell, X } from 'lucide-react'
import { toast } from 'react-hot-toast'
import Loading from '@/components/Loading'
import { motion } from 'framer-motion'

export default function InventoryPage() {
    const router = useRouter()
    const [authorized, setAuthorized] = useState(false)
    const [loading, setLoading] = useState(true)
    const [products, setProducts] = useState([])
    const [searchTerm, setSearchTerm] = useState('')
    const [filterStatus, setFilterStatus] = useState('all')
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [editingId, setEditingId] = useState(null)
    const [editQuantity, setEditQuantity] = useState('')
    const [editData, setEditData] = useState({})
    const [stats, setStats] = useState({ totalProducts: 0, inStock: 0, lowStock: 0, outOfStock: 0 })
    const [outOfStockNotifications, setOutOfStockNotifications] = useState([])
    const [showNotificationsModal, setShowNotificationsModal] = useState(false)
    const [selectedProduct, setSelectedProduct] = useState(null)
    const [editFullProduct, setEditFullProduct] = useState(null)
    const [showFullEditModal, setShowFullEditModal] = useState(false)

    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '₹'

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
            fetchInventory()
        }
    }, [authorized, page, searchTerm, filterStatus])

    const fetchInventory = async () => {
        try {
            setLoading(true)
            let params = new URLSearchParams({
                page: page.toString(),
                limit: '50'
            })

            if (searchTerm) params.append('search', searchTerm)
            if (filterStatus !== 'all') params.append('stockStatus', filterStatus)

            const response = await fetch(`/api/admin/inventory?${params}`)
            
            if (!response.ok) throw new Error('Failed to fetch inventory')
            
            const data = await response.json()
            
            if (data.success) {
                setProducts(data.products)
                setStats(data.stats)
                setTotalPages(data.pagination.totalPages)
            }
        } catch (error) {
            console.error('Error fetching inventory:', error)
            toast.error('Failed to load inventory')
        } finally {
            setLoading(false)
        }
    }

    const handleUpdateQuantity = async (productId, newQuantity) => {
        try {
            const response = await fetch('/api/admin/inventory', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    productId: productId,
                    quantity: parseInt(newQuantity),
                    action: 'set'
                })
            })

            if (!response.ok) throw new Error('Failed to update quantity')

            const result = await response.json()

            if (result.success) {
                toast.success(`${result.product.name}: Quantity updated to ${newQuantity}`)
                setEditingId(null)
                fetchInventory()
                
                // Trigger real-time update in frontend
                if (typeof window !== 'undefined') {
                    window.dispatchEvent(new Event('productDataRefresh'))
                }
            }
        } catch (error) {
            console.error('Error updating quantity:', error)
            toast.error('Failed to update quantity')
        }
    }

    const handleUpdateFullProduct = async () => {
        try {
            const response = await fetch('/api/admin/inventory', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    productId: editFullProduct.id,
                    name: editData.name || editFullProduct.name,
                    category: editData.category || editFullProduct.category,
                    price: parseInt(editData.price) || editFullProduct.price,
                    mrp: parseInt(editData.mrp) || editFullProduct.mrp,
                    quantity: parseInt(editData.quantity) || editFullProduct.quantity,
                    description: editData.description || editFullProduct.description,
                    action: 'updateFull'
                })
            })

            if (!response.ok) throw new Error('Failed to update product')

            const result = await response.json()

            if (result.success) {
                toast.success('Product updated successfully!')
                setShowFullEditModal(false)
                setEditFullProduct(null)
                setEditData({})
                fetchInventory()
                
                // Trigger real-time update in frontend
                if (typeof window !== 'undefined') {
                    window.dispatchEvent(new Event('productDataRefresh'))
                }
            }
        } catch (error) {
            console.error('Error updating product:', error)
            toast.error('Failed to update product')
        }
    }

    const fetchOutOfStockNotifications = async (productId) => {
        try {
            const response = await fetch(`/api/notify-me/out-of-stock?productId=${productId}`)
            const data = await response.json()
            if (data.success) {
                setOutOfStockNotifications(data.notifications)
            }
        } catch (error) {
            console.error('Error fetching notifications:', error)
            toast.error('Failed to load notifications')
        }
    }

    const openNotificationsModal = (product) => {
        setSelectedProduct(product)
        fetchOutOfStockNotifications(product.id)
        setShowNotificationsModal(true)
    }

    const getStatusIcon = (status) => {
        switch(status) {
            case 'inStock': return <CheckCircle size={18} className="text-green-500" />
            case 'lowStock': return <AlertCircle size={18} className="text-yellow-500" />
            case 'outOfStock': return <AlertTriangle size={18} className="text-red-500" />
            default: return <Package size={18} />
        }
    }

    const getStatusColor = (status) => {
        switch(status) {
            case 'inStock': return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
            case 'lowStock': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
            case 'outOfStock': return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
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
                        <h1 className="text-2xl dark:text-slate-200">Inventory <span className="text-slate-800 dark:text-white font-medium">Management</span></h1>
                        <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Track and manage product stock levels</p>
                    </div>
                    <button 
                        onClick={() => {
                            setPage(1)
                            fetchInventory()
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
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Total Products</p>
                                <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{stats.totalProducts}</h3>
                            </div>
                            <Package size={32} className="text-blue-500 opacity-30" />
                        </div>
                    </motion.div>

                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">In Stock</p>
                                <h3 className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.inStock}</h3>
                            </div>
                            <CheckCircle size={32} className="text-green-500 opacity-30" />
                        </div>
                    </motion.div>

                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Low Stock</p>
                                <h3 className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.lowStock}</h3>
                            </div>
                            <AlertCircle size={32} className="text-yellow-500 opacity-30" />
                        </div>
                    </motion.div>

                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Out of Stock</p>
                                <h3 className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.outOfStock}</h3>
                            </div>
                            <AlertTriangle size={32} className="text-red-500 opacity-30" />
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
                                        placeholder="Search products..."
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
                                {['all', 'inStock', 'lowStock', 'outOfStock'].map(status => (
                                    <button
                                        key={status}
                                        onClick={() => {
                                            setFilterStatus(status)
                                            setPage(1)
                                        }}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                                            filterStatus === status
                                                ? 'bg-red-600 text-white'
                                                : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                                        }`}
                                    >
                                        {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Inventory Table */}
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto max-h-[700px] overflow-y-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50 dark:bg-slate-900 sticky top-0">
                                <tr>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Product</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Category</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Price</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Quantity</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Status</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Notifications</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {products.length > 0 ? (
                                    products.map((product) => (
                                        <tr key={product.id} className="border-t border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="relative w-10 h-10 rounded bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 flex-shrink-0 overflow-hidden flex items-center justify-center">
                                                        {product.images && product.images[0] ? (
                                                            <img 
                                                                key={product.images[0]}
                                                                src={product.images[0]} 
                                                                alt={product.name}
                                                                className="w-full h-full object-cover"
                                                                onError={(e) => {
                                                                    e.target.style.display = 'none'
                                                                    e.target.parentElement.classList.add('bg-slate-300', 'dark:bg-slate-700')
                                                                }}
                                                                loading="lazy"
                                                            />
                                                        ) : (
                                                            <span className="text-xs text-slate-400">No img</span>
                                                        )}
                                                    </div>
                                                    <span className="font-medium text-slate-800 dark:text-white truncate">{product.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{product.category}</td>
                                            <td className="px-6 py-4 text-sm font-semibold text-slate-800 dark:text-white">{currency}{product.price}</td>
                                            <td className="px-6 py-4">
                                                {editingId === product.id ? (
                                                    <div className="flex gap-2">
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            value={editQuantity}
                                                            onChange={(e) => setEditQuantity(e.target.value)}
                                                            className="w-20 px-2 py-1 border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded outline-none focus:border-red-500"
                                                        />
                                                        <button
                                                            onClick={() => handleUpdateQuantity(product.id, editQuantity)}
                                                            className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-medium transition"
                                                        >
                                                            Save
                                                        </button>
                                                        <button
                                                            onClick={() => setEditingId(null)}
                                                            className="px-3 py-1 bg-slate-300 hover:bg-slate-400 dark:bg-slate-600 dark:hover:bg-slate-500 text-slate-800 dark:text-white rounded text-xs font-medium transition"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span className="text-sm font-semibold text-slate-800 dark:text-white">
                                                        {product.quantity || 0} units
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-sm">
                                                <div className="flex items-center gap-2">
                                                    {getStatusIcon(product.stockStatus)}
                                                    <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${getStatusColor(product.stockStatus)}`}>
                                                        {product.stockStatus === 'inStock' ? 'In Stock' : 
                                                         product.stockStatus === 'lowStock' ? 'Low Stock' : 
                                                         'Out of Stock'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm">
                                                {product.stockStatus === 'outOfStock' && (
                                                    <button
                                                        onClick={() => openNotificationsModal(product)}
                                                        className="flex items-center gap-2 px-3 py-1.5 bg-amber-100 dark:bg-amber-900/30 hover:bg-amber-200 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-400 rounded-lg text-xs font-medium transition"
                                                    >
                                                        <Bell size={14} />
                                                        View Requests
                                                    </button>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-sm">
                                                <button
                                                    onClick={() => {
                                                        setEditFullProduct(product)
                                                        setEditData({
                                                            name: product.name,
                                                            category: product.category,
                                                            price: product.price,
                                                            mrp: product.mrp,
                                                            quantity: product.quantity,
                                                            description: product.description
                                                        })
                                                        setShowFullEditModal(true)
                                                    }}
                                                    className="flex items-center gap-2 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-400 rounded-lg text-xs font-medium transition"
                                                >
                                                    <Edit2 size={14} />
                                                    Edit
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                                            No products found
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

                {/* Help Text */}
                <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                        💡 <strong>Tip:</strong> Low stock threshold is set at 5 units. Click "Edit" to manually update quantities.
                        When you update quantity to make a product in-stock again, all pending notifications will automatically be sent to users.
                    </p>
                </div>
            </div>

            {/* Full Product Edit Modal */}
            {showFullEditModal && editFullProduct && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-lg">
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
                            <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Edit Product</h3>
                            <button
                                onClick={() => {
                                    setShowFullEditModal(false)
                                    setEditFullProduct(null)
                                    setEditData({})
                                }}
                                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition"
                            >
                                <X size={20} className="text-slate-400" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            {/* Product Image */}
                            <div className="flex justify-center mb-4">
                                <div className="relative w-32 h-32 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 overflow-hidden flex items-center justify-center">
                                    {editFullProduct.images && editFullProduct.images[0] ? (
                                        <img 
                                            key={editFullProduct.images[0]}
                                            src={editFullProduct.images[0]} 
                                            alt={editFullProduct.name}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                e.target.style.display = 'none'
                                                e.target.parentElement.innerHTML = '<div className="text-slate-400 text-sm">No Image</div>'
                                            }}
                                        />
                                    ) : (
                                        <span className="text-slate-400 text-sm">No Image</span>
                                    )}
                                </div>
                            </div>

                            {/* Product Name */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Product Name</label>
                                <input
                                    type="text"
                                    value={editData.name || ''}
                                    onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                                    placeholder="Product name"
                                />
                            </div>

                            {/* Category */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Category</label>
                                <input
                                    type="text"
                                    value={editData.category || ''}
                                    onChange={(e) => setEditData({ ...editData, category: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                                    placeholder="Category"
                                />
                            </div>

                            {/* Price and MRP */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Price ({currency})</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={editData.price || ''}
                                        onChange={(e) => setEditData({ ...editData, price: e.target.value })}
                                        className="w-full px-4 py-2 border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                                        placeholder="Selling Price"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">MRP ({currency})</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={editData.mrp || ''}
                                        onChange={(e) => setEditData({ ...editData, mrp: e.target.value })}
                                        className="w-full px-4 py-2 border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                                        placeholder="MRP"
                                    />
                                </div>
                            </div>

                            {/* Quantity */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Quantity</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={editData.quantity || ''}
                                    onChange={(e) => setEditData({ ...editData, quantity: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                                    placeholder="Stock quantity"
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Description</label>
                                <textarea
                                    value={editData.description || ''}
                                    onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                                    rows="3"
                                    className="w-full px-4 py-2 border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                                    placeholder="Product description"
                                />
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="border-t border-slate-200 dark:border-slate-700 p-6 flex gap-3">
                            <button
                                onClick={() => {
                                    setShowFullEditModal(false)
                                    setEditFullProduct(null)
                                    setEditData({})
                                }}
                                className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleUpdateFullProduct}
                                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition font-medium"
                            >
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Out of Stock Notifications Modal */}
            {showNotificationsModal && selectedProduct && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col shadow-lg">
                         {/* Header */}
                         <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
                            <div className="flex items-center gap-3">
                                 <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center">
                                    <Bell size={20} className="text-amber-600" />
                                 </div>
                                 <div>
                                     <h3 className="text-lg font-semibold text-slate-800 dark:text-white">{selectedProduct.name}</h3>
                                     <p className="text-sm text-slate-600 dark:text-slate-400">Notification Requests</p>
                                 </div>
                            </div>
                            <button
                                 onClick={() => setShowNotificationsModal(false)}
                                 className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition"
                            >
                                 <X size={20} className="text-slate-400" />
                            </button>
                         </div>

                         {/* Content */}
                         <div className="flex-1 overflow-y-auto p-6">
                            {outOfStockNotifications.length > 0 ? (
                                 <div className="space-y-3">
                                     {outOfStockNotifications.map((notification) => (
                                         <div
                                             key={notification.id}
                                             className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition"
                                         >
                                             <div className="flex-1">
                                                 <p className="font-medium text-slate-800 dark:text-white">{notification.userEmail}</p>
                                                 <p className="text-sm text-slate-500 dark:text-slate-400">
                                                     Registered {new Date(notification.createdAt).toLocaleDateString()}
                                                 </p>
                                                 <div className="mt-2">
                                                     <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                                                         notification.status === 'pending'
                                                             ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                                                             : notification.status === 'notified'
                                                             ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                                             : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400'
                                                     }`}>
                                                         {notification.status === 'pending' ? 'Waiting for Stock' : 
                                                          notification.status === 'notified' ? 'Notified' : 
                                                          'Cancelled'}
                                                     </span>
                                                 </div>
                                             </div>
                                         </div>
                                     ))}
                                 </div>
                            ) : (
                                 <div className="flex items-center justify-center h-40">
                                     <p className="text-slate-500 dark:text-slate-400">No notification requests for this product</p>
                                 </div>
                            )}
                         </div>

                         {/* Footer */}
                         <div className="border-t border-slate-200 dark:border-slate-700 p-6 flex gap-3">
                            <button
                                 onClick={() => setShowNotificationsModal(false)}
                                 className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition font-medium"
                            >
                                 Close
                            </button>
                            <button
                                 onClick={() => {
                                    setShowNotificationsModal(false)
                                    setEditingId(selectedProduct.id)
                                    setEditQuantity((selectedProduct.quantity || 0).toString())
                                 }}
                                 className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition font-medium"
                            >
                                 Update Stock
                            </button>
                         </div>
                    </div>
                </div>
            )}
            </div>
            )
            }
