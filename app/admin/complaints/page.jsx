'use client'
import { useState, useEffect } from 'react'
import { AlertCircle, CheckCircle, Clock, X, Eye, MessageSquare } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function ComplaintsAdminPage() {
    const [complaints, setComplaints] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedComplaint, setSelectedComplaint] = useState(null)
    const [filter, setFilter] = useState('all')
    const [updateModal, setUpdateModal] = useState(null)
    const [updateData, setUpdateData] = useState({
        status: '',
        priority: '',
        resolution: ''
    })

    useEffect(() => {
        fetchComplaints()
    }, [])

    const fetchComplaints = async () => {
        try {
            console.log('🔍 Admin fetching all complaints')
            const response = await fetch('/api/complaints/get-complaints')
            const data = await response.json()
            console.log('📋 Admin complaints received:', data.complaints?.length || 0, 'items')
            if (data.success) {
                setComplaints(data.complaints)
            } else {
                console.error('❌ Failed to fetch admin complaints')
            }
        } catch (error) {
            console.error('❌ Error fetching complaints:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleUpdateComplaint = async () => {
        if (!updateModal) return

        try {
            const response = await fetch('/api/complaints/update-complaint', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    complaintId: updateModal.id,
                    status: updateData.status || updateModal.status,
                    priority: updateData.priority || updateModal.priority,
                    resolution: updateData.resolution || updateModal.resolution
                })
            })

            const data = await response.json()
            if (data.success) {
                setComplaints(complaints.map(c => c.id === updateModal.id ? data.complaint : c))
                setUpdateModal(null)
                setUpdateData({ status: '', priority: '', resolution: '' })
                alert('Complaint updated successfully!')
            }
        } catch (error) {
            console.error('Error updating complaint:', error)
            alert('Failed to update complaint')
        }
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
                return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20'
            case 'high':
                return 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20'
            case 'normal':
                return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
            case 'low':
                return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20'
            default:
                return 'text-slate-600 dark:text-slate-400'
        }
    }

    const getStatusIcon = (status) => {
        switch (status) {
            case 'open':
                return <AlertCircle size={18} />
            case 'in-progress':
                return <Clock size={18} />
            case 'resolved':
                return <CheckCircle size={18} />
            default:
                return <AlertCircle size={18} />
        }
    }

    const filteredComplaints = filter === 'all' 
        ? complaints 
        : complaints.filter(c => c.status === filter)

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-8"
        >
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-4xl font-bold text-slate-800 dark:text-white mb-2">Complaints & Queries</h1>
                <p className="text-slate-600 dark:text-slate-400">Manage customer complaints and support requests</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                    <p className="text-slate-600 dark:text-slate-400 text-sm mb-2">Total Complaints</p>
                    <p className="text-3xl font-bold text-slate-800 dark:text-white">{complaints.length}</p>
                </div>
                <div className="bg-red-50 dark:bg-red-900/30 rounded-xl p-6 border border-red-200 dark:border-red-800">
                    <p className="text-red-700 dark:text-red-300 text-sm mb-2">Open</p>
                    <p className="text-3xl font-bold text-red-800 dark:text-red-200">{complaints.filter(c => c.status === 'open').length}</p>
                </div>
                <div className="bg-yellow-50 dark:bg-yellow-900/30 rounded-xl p-6 border border-yellow-200 dark:border-yellow-800">
                    <p className="text-yellow-700 dark:text-yellow-300 text-sm mb-2">In Progress</p>
                    <p className="text-3xl font-bold text-yellow-800 dark:text-yellow-200">{complaints.filter(c => c.status === 'in-progress').length}</p>
                </div>
                <div className="bg-green-50 dark:bg-green-900/30 rounded-xl p-6 border border-green-200 dark:border-green-800">
                    <p className="text-green-700 dark:text-green-300 text-sm mb-2">Resolved</p>
                    <p className="text-3xl font-bold text-green-800 dark:text-green-200">{complaints.filter(c => c.status === 'resolved').length}</p>
                </div>
            </div>

            {/* Filters */}
            <div className="mb-6 flex gap-3 overflow-x-auto pb-2">
                {['all', 'open', 'in-progress', 'waiting-customer', 'resolved'].map(status => (
                    <button
                        key={status}
                        onClick={() => setFilter(status)}
                        className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition ${
                            filter === status
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white hover:bg-slate-300 dark:hover:bg-slate-600'
                        }`}
                    >
                        {status.replace('-', ' ').toUpperCase()}
                    </button>
                ))}
            </div>

            {/* Complaints Table */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                {filteredComplaints.length === 0 ? (
                    <div className="p-12 text-center">
                        <AlertCircle size={48} className="mx-auto text-slate-400 dark:text-slate-600 mb-4" />
                        <p className="text-slate-600 dark:text-slate-400">No complaints found</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700">
                                    <th className="text-left px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">Subject</th>
                                    <th className="text-left px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">Category</th>
                                    <th className="text-left px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">Status</th>
                                    <th className="text-left px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">Priority</th>
                                    <th className="text-left px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">Date</th>
                                    <th className="text-left px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredComplaints.map((complaint, idx) => (
                                    <motion.tr
                                        key={complaint.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition"
                                    >
                                        <td className="px-6 py-4">
                                            <p className="font-medium text-slate-800 dark:text-white">{complaint.subject}</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                                {complaint.orderId ? `Order: ${complaint.orderId.slice(-8)}` : 'General Query (No Order)'}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                                            {complaint.category}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(complaint.status)}`}>
                                                {getStatusIcon(complaint.status)}
                                                {complaint.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(complaint.priority)}`}>
                                                {complaint.priority}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                                            {new Date(complaint.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => setSelectedComplaint(complaint)}
                                                className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition text-sm font-medium"
                                            >
                                                <Eye size={14} />
                                                View
                                            </button>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Detail Modal */}
            <AnimatePresence>
                {selectedComplaint && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-3xl w-full shadow-2xl max-h-[90vh] overflow-y-auto"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{selectedComplaint.subject}</h2>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                                        ID: {selectedComplaint.id}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setSelectedComplaint(null)}
                                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div>
                                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Status</p>
                                    <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mt-1 ${getStatusColor(selectedComplaint.status)}`}>
                                        {getStatusIcon(selectedComplaint.status)}
                                        {selectedComplaint.status}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Priority</p>
                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium mt-1 ${getPriorityColor(selectedComplaint.priority)}`}>
                                        {selectedComplaint.priority}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Category</p>
                                    <p className="text-slate-800 dark:text-white mt-1">{selectedComplaint.category}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Created</p>
                                    <p className="text-slate-800 dark:text-white mt-1">{new Date(selectedComplaint.createdAt).toLocaleString()}</p>
                                </div>
                            </div>

                            <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                                <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">Description</p>
                                <p className="text-slate-800 dark:text-white">{selectedComplaint.description}</p>
                            </div>

                            {selectedComplaint.images && selectedComplaint.images.length > 0 && (
                                <div className="mb-6">
                                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-3">
                                        Attached Images ({selectedComplaint.images.length})
                                    </p>
                                    <div className="grid grid-cols-3 gap-3">
                                        {selectedComplaint.images.map((img, idx) => (
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

                            {selectedComplaint.resolution && (
                                <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/30 rounded-lg border border-green-200 dark:border-green-800">
                                    <p className="text-sm font-medium text-green-700 dark:text-green-300 mb-2">Resolution</p>
                                    <p className="text-green-800 dark:text-green-200">{selectedComplaint.resolution}</p>
                                </div>
                            )}

                            <button
                                onClick={() => {
                                    setUpdateModal(selectedComplaint)
                                    setUpdateData({
                                        status: selectedComplaint.status,
                                        priority: selectedComplaint.priority,
                                        resolution: selectedComplaint.resolution || ''
                                    })
                                }}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium transition"
                            >
                                Update Status
                            </button>
                        </motion.div>
                    </motion.div>
                )}

                {/* Update Modal */}
                {updateModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-md w-full shadow-2xl"
                        >
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4">Update Complaint</h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Status
                                    </label>
                                    <select
                                        value={updateData.status}
                                        onChange={(e) => setUpdateData({ ...updateData, status: e.target.value })}
                                        className="w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="open">Open</option>
                                        <option value="in-progress">In Progress</option>
                                        <option value="waiting-customer">Waiting for Customer</option>
                                        <option value="resolved">Resolved</option>
                                        <option value="closed">Closed</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Priority
                                    </label>
                                    <select
                                        value={updateData.priority}
                                        onChange={(e) => setUpdateData({ ...updateData, priority: e.target.value })}
                                        className="w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="low">Low</option>
                                        <option value="normal">Normal</option>
                                        <option value="high">High</option>
                                        <option value="urgent">Urgent</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Resolution
                                    </label>
                                    <textarea
                                        value={updateData.resolution}
                                        onChange={(e) => setUpdateData({ ...updateData, resolution: e.target.value })}
                                        placeholder="Enter resolution details..."
                                        rows={4}
                                        className="w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                    />
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={handleUpdateComplaint}
                                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium transition"
                                    >
                                        Update
                                    </button>
                                    <button
                                        onClick={() => setUpdateModal(null)}
                                        className="flex-1 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-white py-2 rounded-lg font-medium transition"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    )
}
