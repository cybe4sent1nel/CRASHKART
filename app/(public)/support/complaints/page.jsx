'use client'
import { useState, useEffect } from 'react'
import { AlertCircle, Plus, MessageSquare, Clock, CheckCircle2, ChevronDown, X, Upload } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'

export default function ComplaintsPage() {
    const [complaints, setComplaints] = useState([])
    const [showForm, setShowForm] = useState(false)
    const [expandedComplaint, setExpandedComplaint] = useState(null)
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        subject: '',
        category: '',
        description: '',
        orderId: '',
        images: []
    })

    const categories = [
        'Return/Refund Issue',
        'Damaged Item',
        'Wrong Item Received',
        'Delivery Issue',
        'Quality Complaint',
        'Product Not as Described',
        'Other'
    ]

    const statusColors = {
        open: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
        'in-progress': 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
        'waiting-customer': 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
        resolved: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
        closed: 'bg-slate-100 dark:bg-slate-900/30 text-slate-700 dark:text-slate-400'
    }

    useEffect(() => {
        loadComplaints()
    }, [])

    const loadComplaints = async () => {
        try {
            const response = await fetch('/api/complaints')
            if (response.ok) {
                const data = await response.json()
                setComplaints(data)
            }
        } catch (error) {
            console.error('Error loading complaints:', error)
        }
    }

    const handleImageUpload = (e) => {
        const files = Array.from(e.target.files || [])
        if (files.length + formData.images.length > 5) {
            toast.error('Maximum 5 images allowed')
            return
        }

        files.forEach(file => {
            const reader = new FileReader()
            reader.onloadend = () => {
                setFormData(prev => ({
                    ...prev,
                    images: [...prev.images, {
                        file: file,
                        preview: reader.result
                    }]
                }))
            }
            reader.readAsDataURL(file)
        })
    }

    const removeImage = (index) => {
        setFormData(prev => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index)
        }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!formData.subject || !formData.category || !formData.description) {
            toast.error('Please fill all required fields')
            return
        }

        setLoading(true)

        try {
            const formDataToSend = new FormData()
            formDataToSend.append('subject', formData.subject)
            formDataToSend.append('category', formData.category)
            formDataToSend.append('description', formData.description)
            if (formData.orderId) formDataToSend.append('orderId', formData.orderId)

            formData.images.forEach((img, i) => {
                formDataToSend.append(`images`, img.file)
            })

            const response = await fetch('/api/complaints/create', {
                method: 'POST',
                body: formDataToSend
            })

            if (response.ok) {
                const newComplaint = await response.json()
                setComplaints(prev => [newComplaint, ...prev])
                setFormData({ subject: '', category: '', description: '', orderId: '', images: [] })
                setShowForm(false)
                toast.success('Complaint registered successfully!')
            } else {
                toast.error('Failed to register complaint')
            }
        } catch (error) {
            console.error('Error:', error)
            toast.error('Error submitting complaint')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-8">
            <div className="max-w-4xl mx-auto px-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
                            <AlertCircle className="text-red-600" size={32} />
                            My Complaints
                        </h1>
                        <p className="text-slate-600 dark:text-slate-400 mt-1">Register and track your complaints</p>
                    </div>
                    <button
                        onClick={() => setShowForm(!showForm)}
                        className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition"
                    >
                        <Plus size={20} />
                        New Complaint
                    </button>
                </div>

                {/* New Complaint Form */}
                <AnimatePresence>
                    {showForm && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 mb-8 border border-slate-200 dark:border-slate-700"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-semibold text-slate-800 dark:text-white">Register New Complaint</h2>
                                <button
                                    onClick={() => setShowForm(false)}
                                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                            Subject *
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.subject}
                                            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                            placeholder="Brief subject of complaint"
                                            className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                            Category *
                                        </label>
                                        <select
                                            value={formData.category}
                                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                            className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                                        >
                                            <option value="">Select category...</option>
                                            {categories.map((cat) => (
                                                <option key={cat} value={cat}>{cat}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Order ID (Optional)
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.orderId}
                                        onChange={(e) => setFormData({ ...formData, orderId: e.target.value })}
                                        placeholder="Link to specific order"
                                        className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Description *
                                    </label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Describe your complaint in detail..."
                                        rows={4}
                                        className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Upload Images (Max 5)
                                    </label>
                                    <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-4 text-center hover:border-red-500 transition">
                                        <input
                                            type="file"
                                            multiple
                                            accept="image/*"
                                            onChange={handleImageUpload}
                                            className="hidden"
                                            id="complaint-images"
                                        />
                                        <label htmlFor="complaint-images" className="cursor-pointer">
                                            <Upload size={24} className="inline text-slate-600 dark:text-slate-400 mb-2" />
                                            <p className="text-sm text-slate-600 dark:text-slate-400">Click to upload images</p>
                                        </label>
                                    </div>
                                    {formData.images.length > 0 && (
                                        <div className="grid grid-cols-3 gap-2 mt-3">
                                            {formData.images.map((img, i) => (
                                                <div key={i} className="relative">
                                                    <img src={img.preview} alt={`Preview ${i}`} className="w-full h-20 object-cover rounded" />
                                                    <button
                                                        type="button"
                                                        onClick={() => removeImage(i)}
                                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white py-2 rounded-lg font-medium transition"
                                    >
                                        {loading ? 'Submitting...' : 'Submit Complaint'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowForm(false)}
                                        className="flex-1 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-white py-2 rounded-lg font-medium transition"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Complaints List */}
                <div className="space-y-4">
                    {complaints.length === 0 ? (
                        <div className="bg-white dark:bg-slate-800 rounded-lg p-12 text-center border border-slate-200 dark:border-slate-700">
                            <AlertCircle size={48} className="text-slate-400 dark:text-slate-600 mx-auto mb-4 opacity-50" />
                            <p className="text-slate-600 dark:text-slate-400 text-lg">No complaints registered yet</p>
                            <button
                                onClick={() => setShowForm(true)}
                                className="text-red-600 hover:text-red-700 font-medium mt-4"
                            >
                                Register your first complaint
                            </button>
                        </div>
                    ) : (
                        complaints.map((complaint) => (
                            <motion.div
                                key={complaint.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden"
                            >
                                <button
                                    onClick={() => setExpandedComplaint(expandedComplaint === complaint.id ? null : complaint.id)}
                                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition"
                                >
                                    <div className="text-left flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="font-semibold text-slate-800 dark:text-white">{complaint.subject}</h3>
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[complaint.status] || statusColors.open}`}>
                                                {complaint.status.replace('-', ' ').toUpperCase()}
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-600 dark:text-slate-400">
                                            {complaint.category} • {new Date(complaint.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <ChevronDown
                                        size={20}
                                        className={`text-slate-400 transition ${expandedComplaint === complaint.id ? 'rotate-180' : ''}`}
                                    />
                                </button>

                                <AnimatePresence>
                                    {expandedComplaint === complaint.id && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="border-t border-slate-200 dark:border-slate-700 px-6 py-4 bg-slate-50 dark:bg-slate-700/30"
                                        >
                                            <div className="space-y-4">
                                                <div>
                                                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</p>
                                                    <p className="text-slate-600 dark:text-slate-400">{complaint.description}</p>
                                                </div>

                                                {complaint.images?.length > 0 && (
                                                    <div>
                                                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Images</p>
                                                        <div className="grid grid-cols-3 gap-2">
                                                            {complaint.images.map((img, i) => (
                                                                <img key={i} src={img} alt={`Complaint ${i}`} className="w-full h-24 object-cover rounded" />
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {complaint.resolution && (
                                                    <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded p-3">
                                                        <p className="text-sm font-medium text-green-800 dark:text-green-300 mb-1">Resolution</p>
                                                        <p className="text-sm text-green-700 dark:text-green-400">{complaint.resolution}</p>
                                                    </div>
                                                )}

                                                {complaint.status === 'waiting-customer' && (
                                                    <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded p-3">
                                                        <p className="text-sm text-yellow-800 dark:text-yellow-300">
                                                            <Clock size={14} className="inline mr-2" />
                                                            Waiting for your response
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}
