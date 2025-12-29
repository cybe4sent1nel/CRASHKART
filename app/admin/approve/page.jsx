'use client'
import { storesDummyData } from "@/assets/assets"
import StoreInfo from "@/components/admin/StoreInfo"
import Loading from "@/components/Loading"
import { useEffect, useState } from "react"
import toast from "react-hot-toast"
import { motion, AnimatePresence } from "framer-motion"
import { Eye, FileText } from "lucide-react"

export default function AdminApprove() {

    const [stores, setStores] = useState([])
    const [sellerQueries, setSellerQueries] = useState([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('stores') // 'stores' or 'sellers'
    const [selectedSeller, setSelectedSeller] = useState(null)
    const [rejectionReason, setRejectionReason] = useState('')
    const [updating, setUpdating] = useState(false)

    const fetchStores = async () => {
        setStores(storesDummyData)
    }

    const fetchSellerQueries = async () => {
        try {
            const response = await fetch('/api/seller-queries/get?status=pending&limit=50')
            const data = await response.json()
            if (data.success) {
                setSellerQueries(data.data)
            }
        } catch (error) {
            console.error('Error fetching seller queries:', error)
            toast.error('Failed to load seller applications')
        }
    }

    const handleApprove = async ({ storeId, status }) => {
        // Logic to approve a store
    }

    const handleApproveSeller = async (queryId) => {
        setUpdating(true)
        try {
            const response = await fetch('/api/seller-queries/update', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: queryId,
                    status: 'approved'
                })
            })

            if (response.ok) {
                toast.success('Seller application approved!')
                setSelectedSeller(null)
                fetchSellerQueries()
            } else {
                toast.error('Failed to approve application')
            }
        } catch (error) {
            console.error('Error:', error)
            toast.error('Failed to approve application')
        } finally {
            setUpdating(false)
        }
    }

    const handleRejectSeller = async (queryId) => {
        if (!rejectionReason.trim()) {
            toast.error('Please provide a rejection reason')
            return
        }

        setUpdating(true)
        try {
            const response = await fetch('/api/seller-queries/update', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: queryId,
                    status: 'rejected',
                    rejectionReason
                })
            })

            if (response.ok) {
                toast.success('Application rejected!')
                setSelectedSeller(null)
                setRejectionReason('')
                fetchSellerQueries()
            } else {
                toast.error('Failed to reject application')
            }
        } catch (error) {
            console.error('Error:', error)
            toast.error('Failed to reject application')
        } finally {
            setUpdating(false)
        }
    }

    useEffect(() => {
        fetchStores()
        fetchSellerQueries()
        setLoading(false)
    }, [])

    if (loading) return <Loading />

    return (
        <div className="text-slate-500 mb-28">
            {/* Tabs */}
            <div className="flex gap-4 mb-6 border-b border-slate-200">
                <button
                    onClick={() => setActiveTab('stores')}
                    className={`px-4 py-2 font-medium transition ${
                        activeTab === 'stores'
                            ? 'text-red-600 border-b-2 border-red-600'
                            : 'text-slate-600 hover:text-slate-800'
                    }`}
                >
                    Stores ({stores.length})
                </button>
                <button
                    onClick={() => setActiveTab('sellers')}
                    className={`px-4 py-2 font-medium transition ${
                        activeTab === 'sellers'
                            ? 'text-red-600 border-b-2 border-red-600'
                            : 'text-slate-600 hover:text-slate-800'
                    }`}
                >
                    Seller Applications ({sellerQueries.length})
                </button>
            </div>

            {/* Stores Tab */}
            {activeTab === 'stores' && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                >
                    <h1 className="text-2xl mb-4">Approve <span className="text-slate-800 font-medium">Stores</span></h1>

                    {stores.length ? (
                        <div className="flex flex-col gap-4">
                            {stores.map((store) => (
                                <div key={store.id} className="bg-white border rounded-lg shadow-sm p-6 flex max-md:flex-col gap-4 md:items-end max-w-4xl" >
                                    {/* Store Info */}
                                    <StoreInfo store={store} />

                                    {/* Actions */}
                                    <div className="flex gap-3 pt-2 flex-wrap">
                                        <button onClick={() => toast.promise(handleApprove({ storeId: store.id, status: 'approved' }), { loading: "approving" })} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm" >
                                            Approve
                                        </button>
                                        <button onClick={() => toast.promise(handleApprove({ storeId: store.id, status: 'rejected' }), { loading: 'rejecting' })} className="px-4 py-2 bg-slate-500 text-white rounded hover:bg-slate-600 text-sm" >
                                            Reject
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-80">
                            <h1 className="text-3xl text-slate-400 font-medium">No Store Application Pending</h1>
                        </div>
                    )}
                </motion.div>
            )}

            {/* Sellers Tab */}
            {activeTab === 'sellers' && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                >
                    <h1 className="text-2xl mb-4">Approve <span className="text-slate-800 font-medium">Seller Applications</span></h1>

                    {sellerQueries.length ? (
                        <div className="flex flex-col gap-4">
                            {sellerQueries.map((seller) => (
                                <motion.div
                                    key={seller.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-white border border-slate-200 rounded-lg shadow-sm p-6 flex max-md:flex-col gap-4 md:items-end max-w-4xl"
                                >
                                    {/* Seller Info */}
                                    <div className="flex-1">
                                        <div className="flex items-start gap-4 mb-3">
                                            <div className="flex-1">
                                                <h3 className="text-lg font-semibold text-slate-900">{seller.name}</h3>
                                                <p className="text-sm text-slate-600">{seller.email}</p>
                                                <p className="text-sm text-slate-600">{seller.phone}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs text-slate-500">Applied</p>
                                                <p className="text-sm font-medium text-slate-900">
                                                    {new Date(seller.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                            <div>
                                                <span className="text-slate-600">Category:</span>
                                                <p className="font-medium text-slate-900">{seller.category}</p>
                                            </div>
                                            <div>
                                                <span className="text-slate-600">Experience:</span>
                                                <p className="font-medium text-slate-900 capitalize">{seller.experience}</p>
                                            </div>
                                            <div>
                                                <span className="text-slate-600">Business Type:</span>
                                                <p className="font-medium text-slate-900 capitalize">{seller.businessType}</p>
                                            </div>
                                            <div>
                                                <span className="text-slate-600">Company:</span>
                                                <p className="font-medium text-slate-900">{seller.companyName || 'N/A'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-3 pt-2 flex-wrap">
                                        <button
                                            onClick={() => setSelectedSeller(seller)}
                                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm flex items-center gap-2"
                                        >
                                            <Eye size={16} />
                                            View
                                        </button>
                                        <button
                                            onClick={() => handleApproveSeller(seller.id)}
                                            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                                        >
                                            Approve
                                        </button>
                                        <button
                                            onClick={() => setSelectedSeller(seller)}
                                            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                                        >
                                            Reject
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-80">
                            <h1 className="text-3xl text-slate-400 font-medium">No Seller Application Pending</h1>
                        </div>
                    )}
                </motion.div>
            )}

            {/* Seller Details Modal */}
            <AnimatePresence>
                {selectedSeller && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                        >
                            <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex items-center justify-between">
                                <h2 className="text-2xl font-bold text-slate-900">Application Details</h2>
                                <button
                                    onClick={() => {
                                        setSelectedSeller(null)
                                        setRejectionReason('')
                                    }}
                                    className="text-slate-500 hover:text-slate-700 text-2xl"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="p-6 space-y-6">
                                {/* Applicant Info */}
                                <div>
                                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Applicant Information</h3>
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm text-slate-600">Name</p>
                                            <p className="text-slate-900 font-medium">{selectedSeller.name}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-slate-600">Email</p>
                                            <p className="text-slate-900 font-medium">{selectedSeller.email}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-slate-600">Phone</p>
                                            <p className="text-slate-900 font-medium">{selectedSeller.phone}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-slate-600">Company Name</p>
                                            <p className="text-slate-900 font-medium">{selectedSeller.companyName || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-slate-600">Business Type</p>
                                            <p className="text-slate-900 font-medium capitalize">{selectedSeller.businessType}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-slate-600">Category</p>
                                            <p className="text-slate-900 font-medium">{selectedSeller.category}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-slate-600">Experience</p>
                                            <p className="text-slate-900 font-medium capitalize">{selectedSeller.experience}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-slate-600">Submitted</p>
                                            <p className="text-slate-900 font-medium">{new Date(selectedSeller.createdAt).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Description */}
                                <div>
                                    <h3 className="text-lg font-semibold text-slate-900 mb-2">Business Description</h3>
                                    <p className="text-slate-700 whitespace-pre-wrap bg-slate-50 p-4 rounded-lg">{selectedSeller.description}</p>
                                </div>

                                {/* Documents */}
                                {selectedSeller.documents && selectedSeller.documents.length > 0 && (
                                    <div>
                                        <h3 className="text-lg font-semibold text-slate-900 mb-2">Supporting Documents ({selectedSeller.documents.length})</h3>
                                        <div className="space-y-2">
                                            {selectedSeller.documents.map((doc, idx) => (
                                                <a
                                                    key={idx}
                                                    href={doc}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-2 p-3 bg-slate-50 hover:bg-slate-100 rounded-lg text-red-600 hover:text-red-700 transition"
                                                >
                                                    <FileText size={18} />
                                                    <span className="truncate text-sm">{doc.split('/').pop()}</span>
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Rejection Reason (if rejecting) */}
                                {selectedSeller && (
                                    <div className="border-t border-slate-200 pt-6">
                                        <h3 className="text-lg font-semibold text-slate-900 mb-4">Decision</h3>
                                        <textarea
                                            value={rejectionReason}
                                            onChange={(e) => setRejectionReason(e.target.value)}
                                            rows={3}
                                            placeholder="If rejecting, provide a reason..."
                                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                                        />
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div className="flex gap-3 pt-6 border-t border-slate-200">
                                    <button
                                        onClick={() => handleApproveSeller(selectedSeller.id)}
                                        disabled={updating}
                                        className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-bold py-2 rounded-lg transition"
                                    >
                                        {updating ? 'Processing...' : 'Approve Application'}
                                    </button>
                                    <button
                                        onClick={() => handleRejectSeller(selectedSeller.id)}
                                        disabled={updating || !rejectionReason.trim()}
                                        className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold py-2 rounded-lg transition"
                                    >
                                        {updating ? 'Processing...' : 'Reject Application'}
                                    </button>
                                    <button
                                        onClick={() => {
                                            setSelectedSeller(null)
                                            setRejectionReason('')
                                        }}
                                        className="flex-1 bg-slate-300 hover:bg-slate-400 text-slate-900 font-bold py-2 rounded-lg transition"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}