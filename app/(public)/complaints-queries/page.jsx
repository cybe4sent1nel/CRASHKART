'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown, AlertCircle, CheckCircle, Clock } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import ComplaintModal from '@/components/ComplaintModal'
import RefundReplacementPolicy from '@/components/RefundReplacementPolicy'

export default function ComplaintsQueriesPage() {
    const router = useRouter()
    const [orders, setOrders] = useState([])
    const [complaints, setComplaints] = useState([])
    const [selectedOrderId, setSelectedOrderId] = useState(null)
    const [showComplaintModal, setShowComplaintModal] = useState(false)
    const [userId, setUserId] = useState(null)
    const [activeTab, setActiveTab] = useState('complaints')

    useEffect(() => {
        const userData = localStorage.getItem('user')
        if (!userData) {
            router.push('/login')
            return
        }

        try {
            const user = JSON.parse(userData)
            setUserId(user.id)

            // Fetch user orders
            fetchOrders(user.email)
            // Fetch user complaints
            fetchComplaints(user.id)
        } catch (error) {
            console.error('Error loading user data:', error)
            router.push('/login')
        }
    }, [router])

    const fetchOrders = async (email) => {
        try {
            const headers = { 'Content-Type': 'application/json' }
            const token = localStorage.getItem('token')
            if (token) headers['Authorization'] = `Bearer ${token}`

            const response = await fetch('/api/orders/get-user-orders', {
                method: 'GET',
                headers,
                credentials: 'include'
            })

            if (response.ok) {
                const data = await response.json()
                if (data.success && data.orders) {
                    setOrders(data.orders)
                }
            }
        } catch (error) {
            console.error('Error fetching orders:', error)
        }
    }

    const fetchComplaints = async (userId) => {
        try {
            console.log('🔍 Fetching complaints for userId:', userId)
            const response = await fetch(`/api/complaints/get-complaints?userId=${userId}`)
            if (response.ok) {
                const data = await response.json()
                console.log('📋 Complaints received:', data.complaints?.length || 0, 'items')
                if (data.success) {
                    setComplaints(data.complaints)
                }
            } else {
                console.error('❌ Failed to fetch complaints:', response.status)
            }
        } catch (error) {
            console.error('❌ Error fetching complaints:', error)
        }
    }

    const handleComplaintSubmit = (newComplaint) => {
        setComplaints([newComplaint, ...complaints])
        setShowComplaintModal(false)
        setSelectedOrderId(null)
    }

    const getStatusColor = (status) => {
        switch (status) {
            case 'open':
                return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
            case 'in-progress':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
            case 'waiting-customer':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
            case 'resolved':
                return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
            default:
                return 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300'
        }
    }

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'urgent':
                return 'text-red-600 dark:text-red-400'
            case 'high':
                return 'text-orange-600 dark:text-orange-400'
            case 'normal':
                return 'text-blue-600 dark:text-blue-400'
            case 'low':
                return 'text-green-600 dark:text-green-400'
            default:
                return 'text-slate-600 dark:text-slate-400'
        }
    }

    const getStatusIcon = (status) => {
        switch (status) {
            case 'open':
                return <AlertCircle size={16} />
            case 'in-progress':
                return <Clock size={16} />
            case 'resolved':
                return <CheckCircle size={16} />
            default:
                return <Clock size={16} />
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-w-6xl mx-auto px-4 py-8"
        >
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-4xl font-bold text-slate-800 dark:text-white mb-2">
                    Complaints & Queries
                </h1>
                <p className="text-slate-600 dark:text-slate-400">
                    Manage your complaints and review our refund & replacement policy
                </p>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 mb-8 border-b border-slate-200 dark:border-slate-700">
                <button
                    onClick={() => setActiveTab('complaints')}
                    className={`px-6 py-3 font-medium transition border-b-2 ${
                        activeTab === 'complaints'
                            ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                            : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-300'
                    }`}
                >
                    My Complaints ({complaints.length})
                </button>
                <button
                    onClick={() => setActiveTab('policy')}
                    className={`px-6 py-3 font-medium transition border-b-2 ${
                        activeTab === 'policy'
                            ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                            : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-300'
                    }`}
                >
                    Refund & Replacement Policy
                </button>
            </div>

            {/* Complaints Tab */}
            <AnimatePresence mode="wait">
                {activeTab === 'complaints' && (
                    <motion.div
                        key="complaints"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        {/* Register New Complaint */}
                        <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-xl p-6 mb-8">
                            <h2 className="text-lg font-bold text-blue-900 dark:text-blue-100 mb-4">
                                Register a New Complaint
                            </h2>
                            <p className="text-blue-800 dark:text-blue-300 mb-4">
                                Select an order to file a complaint or query about a product or delivery issue.
                            </p>

                            <div className="space-y-3">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Select Order *
                                </label>
                                <div className="relative">
                                    <select
                                        value={selectedOrderId || ''}
                                        onChange={(e) => setSelectedOrderId(e.target.value)}
                                        className="w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">-- Select an order --</option>
                                        {orders.map((order) => (
                                            <option key={order.id} value={order.id}>
                                                Order #{order.id.slice(-8)} - ₹{order.total} ({order.status})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <button
                                    onClick={() => {
                                        if (!selectedOrderId) {
                                            alert('Please select an order first')
                                            return
                                        }
                                        setShowComplaintModal(true)
                                    }}
                                    disabled={!selectedOrderId}
                                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-3 rounded-lg font-medium transition"
                                >
                                    File Complaint
                                </button>
                            </div>
                        </div>

                        {/* Existing Complaints */}
                        <div>
                            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">
                                Your Complaints
                            </h2>

                            {complaints.length === 0 ? (
                                <div className="bg-white dark:bg-slate-800 rounded-xl p-8 text-center border border-slate-200 dark:border-slate-700">
                                    <AlertCircle size={48} className="mx-auto text-slate-400 dark:text-slate-600 mb-4" />
                                    <p className="text-slate-600 dark:text-slate-400 mb-4">
                                        No complaints filed yet
                                    </p>
                                    <p className="text-sm text-slate-500 dark:text-slate-500">
                                        If you have any issues with your orders, select an order above and file a complaint.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {complaints.map((complaint) => (
                                        <motion.div
                                            key={complaint.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-lg transition"
                                        >
                                            <div className="p-6">
                                                <div className="flex items-start justify-between gap-4 flex-wrap">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-3 mb-2">
                                                            <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                                                                {complaint.subject}
                                                            </h3>
                                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(complaint.status)}`}>
                                                                {complaint.status}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                                                            Category: {complaint.category}
                                                            {complaint.orderId && ` • Order: ${complaint.orderId.slice(-8)}`}
                                                            {!complaint.orderId && ' • General Query'}
                                                        </p>
                                                        <p className="text-slate-700 dark:text-slate-300 mb-4">
                                                            {complaint.description}
                                                        </p>
                                                        {complaint.images && complaint.images.length > 0 && (
                                                            <div className="mt-4">
                                                                <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">
                                                                    Attached Images ({complaint.images.length})
                                                                </p>
                                                                <div className="grid grid-cols-4 gap-2">
                                                                    {complaint.images.map((img, idx) => (
                                                                        <a
                                                                            key={idx}
                                                                            href={img}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="aspect-square bg-slate-100 dark:bg-slate-700 rounded-lg overflow-hidden hover:opacity-80 transition"
                                                                        >
                                                                            <img
                                                                                src={img}
                                                                                alt={`Complaint attachment ${idx + 1}`}
                                                                                className="w-full h-full object-cover"
                                                                            />
                                                                        </a>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="text-right flex-shrink-0">
                                                        <div className={`flex items-center gap-1 font-medium mb-2 ${getPriorityColor(complaint.priority)}`}>
                                                            {getStatusIcon(complaint.status)}
                                                            {complaint.priority}
                                                        </div>
                                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                                            {new Date(complaint.createdAt).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                </div>

                                                {complaint.resolution && (
                                                    <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                                                        <h4 className="font-medium text-slate-800 dark:text-white mb-2">Resolution</h4>
                                                        <p className="text-slate-700 dark:text-slate-300 text-sm">
                                                            {complaint.resolution}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}

                {/* Reviews Tab */}
                {activeTab === 'reviews' && (
                    <motion.div
                        key="reviews"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <div>
                            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">
                                Your Product Reviews
                            </h2>

                            {reviews.length === 0 ? (
                                <div className="bg-white dark:bg-slate-800 rounded-xl p-8 text-center border border-slate-200 dark:border-slate-700">
                                    <AlertCircle size={48} className="mx-auto text-slate-400 dark:text-slate-600 mb-4" />
                                    <p className="text-slate-600 dark:text-slate-400 mb-4">
                                        No reviews yet
                                    </p>
                                    <p className="text-sm text-slate-500 dark:text-slate-500">
                                        After receiving your orders, you can leave reviews for the products.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {reviews.map((review) => (
                                        <motion.div
                                            key={review.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-lg transition p-6"
                                        >
                                            <div className="flex items-start gap-4">
                                                {review.product?.images?.[0] && (
                                                    <img
                                                        src={review.product.images[0]}
                                                        alt={review.product.name}
                                                        className="w-20 h-20 object-cover rounded-lg"
                                                    />
                                                )}
                                                <div className="flex-1">
                                                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">
                                                        {review.product?.name || 'Product'}
                                                    </h3>
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <div className="flex gap-1">
                                                            {[1, 2, 3, 4, 5].map((star) => (
                                                                <span
                                                                    key={star}
                                                                    className={`text-lg ${
                                                                        star <= review.rating
                                                                            ? 'text-yellow-500'
                                                                            : 'text-slate-300 dark:text-slate-600'
                                                                    }`}
                                                                >
                                                                    ★
                                                                </span>
                                                            ))}
                                                        </div>
                                                        <span className="text-sm text-slate-600 dark:text-slate-400">
                                                            {review.rating}/5
                                                        </span>
                                                    </div>
                                                    <p className="text-slate-700 dark:text-slate-300 mb-3">
                                                        {review.review}
                                                    </p>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                                        Reviewed on {new Date(review.createdAt).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}

                {/* Policy Tab */}
                {activeTab === 'policy' && (
                    <motion.div
                        key="policy"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <RefundReplacementPolicy />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Complaint Modal */}
            {showComplaintModal && userId && (
                <ComplaintModal
                    orderId={selectedOrderId}
                    userId={userId}
                    onClose={() => setShowComplaintModal(false)}
                    onSubmit={handleComplaintSubmit}
                />
            )}
        </motion.div>
    )
}
