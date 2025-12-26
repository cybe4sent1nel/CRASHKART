'use client'
import { useState } from 'react'
import { X, AlertCircle, Upload, Check } from 'lucide-react'
import { toast } from 'react-hot-toast'
import Image from 'next/image'

// Cancel Order Modal
export function CancelOrderModal({ order, onClose, onConfirm }) {
    const [reason, setReason] = useState('')
    const [loading, setLoading] = useState(false)

    const canCancel = ['order_placed', 'processing'].includes(order.status?.toLowerCase())

    const reasons = [
        'Change of mind',
        'Found better price elsewhere',
        'No longer needed',
        'Wrong order',
        'Other reason'
    ]

    const handleCancel = async () => {
        if (!reason) {
            toast.error('Please select a cancellation reason')
            return
        }

        setLoading(true)
        try {
            const response = await fetch(`/api/orders/${order.id}/cancel`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason })
            })

            if (response.ok) {
                toast.success('Order cancelled successfully')
                onConfirm()
                onClose()
            } else {
                toast.error('Failed to cancel order')
            }
        } catch (error) {
            toast.error('Error cancelling order')
        } finally {
            setLoading(false)
        }
    }

    if (!canCancel) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-md w-full">
                    <div className="flex items-center gap-3 text-orange-600 dark:text-orange-400 mb-4">
                        <AlertCircle size={24} />
                        <h3 className="text-lg font-semibold">Cannot Cancel Order</h3>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 mb-6">
                        This order has already shipped and cannot be cancelled. You can initiate a return instead.
                    </p>
                    <button
                        onClick={onClose}
                        className="w-full bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-white py-2 rounded-lg font-medium transition"
                    >
                        Close
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-md w-full">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Cancel Order</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                        <X size={20} />
                    </button>
                </div>

                <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">
                    Order ID: <span className="font-mono font-medium">{order.id.substring(0, 12)}</span>
                </p>

                <div className="mb-6">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Reason for cancellation
                    </label>
                    <select
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                        <option value="">Select a reason...</option>
                        {reasons.map((r) => (
                            <option key={r} value={r}>{r}</option>
                        ))}
                    </select>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-6">
                    <p className="text-xs text-blue-800 dark:text-blue-300">
                        <strong>Refund:</strong> Your payment will be refunded within 5-7 business days.
                    </p>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={handleCancel}
                        disabled={loading || !reason}
                        className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white py-2 rounded-lg font-medium transition"
                    >
                        {loading ? 'Cancelling...' : 'Confirm Cancel'}
                    </button>
                    <button
                        onClick={onClose}
                        className="flex-1 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-white py-2 rounded-lg font-medium transition"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    )
}

// Return Order Modal
export function ReturnOrderModal({ order, item, onClose, onConfirm }) {
    const [issue, setIssue] = useState('')
    const [description, setDescription] = useState('')
    const [images, setImages] = useState([])
    const [imagePreview, setImagePreview] = useState([])
    const [loading, setLoading] = useState(false)
    const [bankDetails, setBankDetails] = useState({
        accountNo: '',
        ifscCode: ''
    })

    const issues = [
        'Defective/Damaged',
        'Wrong item received',
        'Not as described',
        'Missing parts',
        'Quality issue',
        'Other'
    ]

    const isCODPayment = order.paymentMethod === 'COD'

    const handleImageUpload = (e) => {
        const files = Array.from(e.target.files || [])
        if (files.length + images.length > 5) {
            toast.error('Maximum 5 images allowed')
            return
        }

        files.forEach(file => {
            const reader = new FileReader()
            reader.onloadend = () => {
                setImages(prev => [...prev, reader.result])
                setImagePreview(prev => [...prev, reader.result])
            }
            reader.readAsDataURL(file)
        })
    }

    const removeImage = (index) => {
        setImages(prev => prev.filter((_, i) => i !== index))
        setImagePreview(prev => prev.filter((_, i) => i !== index))
    }

    const handleReturn = async () => {
        if (!issue || !description) {
            toast.error('Please fill all required fields')
            return
        }

        if (isCODPayment && (!bankDetails.accountNo || !bankDetails.ifscCode)) {
            toast.error('Please provide bank details for COD refund')
            return
        }

        setLoading(true)
        try {
            const formData = new FormData()
            formData.append('orderId', order.id)
            formData.append('productId', item.id)
            formData.append('issue', issue)
            formData.append('description', description)
            formData.append('paymentMethod', order.paymentMethod)
            
            if (isCODPayment) {
                formData.append('bankAccountNo', bankDetails.accountNo)
                formData.append('ifscCode', bankDetails.ifscCode)
            }

            images.forEach((img, i) => {
                formData.append(`images`, img)
            })

            const response = await fetch('/api/returns/create', {
                method: 'POST',
                body: formData
            })

            if (response.ok) {
                toast.success('Return request submitted successfully')
                onConfirm()
                onClose()
            } else {
                toast.error('Failed to submit return request')
            }
        } catch (error) {
            console.error('Error:', error)
            toast.error('Error submitting return request')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-md w-full my-8">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Return Item</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                        <X size={20} />
                    </button>
                </div>

                <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">
                    {item.name} (Qty: {item.qty})
                </p>

                <div className="space-y-4 mb-4">
                    {/* Issue Selection */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            What's the issue? *
                        </label>
                        <select
                            value={issue}
                            onChange={(e) => setIssue(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                        >
                            <option value="">Select an issue...</option>
                            {issues.map((i) => (
                                <option key={i} value={i}>{i}</option>
                            ))}
                        </select>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Describe the issue *
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Please describe what's wrong with the item..."
                            rows={3}
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                        />
                    </div>

                    {/* Image Upload */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Upload images (Max 5)
                        </label>
                        <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-4 text-center">
                            <input
                                type="file"
                                multiple
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="hidden"
                                id="image-upload"
                            />
                            <label htmlFor="image-upload" className="cursor-pointer">
                                <Upload size={20} className="inline text-slate-600 dark:text-slate-400 mb-2" />
                                <p className="text-xs text-slate-600 dark:text-slate-400">Click to upload</p>
                            </label>
                        </div>
                        {imagePreview.length > 0 && (
                            <div className="grid grid-cols-3 gap-2 mt-3">
                                {imagePreview.map((img, i) => (
                                    <div key={i} className="relative">
                                        <img src={img} alt={`Preview ${i}`} className="w-full h-20 object-cover rounded" />
                                        <button
                                            onClick={() => removeImage(i)}
                                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Bank Details for COD */}
                    {isCODPayment && (
                        <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                            <p className="text-xs text-yellow-800 dark:text-yellow-300 mb-3 font-medium">
                                COD Refund - Please provide your bank details:
                            </p>
                            <input
                                type="text"
                                placeholder="Account Number"
                                value={bankDetails.accountNo}
                                onChange={(e) => setBankDetails({ ...bankDetails, accountNo: e.target.value })}
                                className="w-full px-2 py-1.5 border border-yellow-300 dark:border-yellow-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm rounded mb-2 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                            />
                            <input
                                type="text"
                                placeholder="IFSC Code"
                                value={bankDetails.ifscCode}
                                onChange={(e) => setBankDetails({ ...bankDetails, ifscCode: e.target.value })}
                                className="w-full px-2 py-1.5 border border-yellow-300 dark:border-yellow-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm rounded focus:outline-none focus:ring-2 focus:ring-yellow-500"
                            />
                        </div>
                    )}
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={handleReturn}
                        disabled={loading || !issue || !description}
                        className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white py-2 rounded-lg font-medium transition flex items-center justify-center gap-2"
                    >
                        {loading ? 'Submitting...' : (
                            <>
                                <Check size={16} />
                                Submit Return
                            </>
                        )}
                    </button>
                    <button
                        onClick={onClose}
                        className="flex-1 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-white py-2 rounded-lg font-medium transition"
                    >
                        Cancel
                    </button>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">
                    Returns accepted within 7 days of delivery.
                </p>
            </div>
        </div>
    )
}
