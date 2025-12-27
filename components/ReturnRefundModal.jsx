'use client'

import { useState } from 'react'
import { X, Upload, AlertCircle, Check } from 'lucide-react'
import { IKImage, IKContext, IKUpload } from 'imagekitio-react'
import toast from 'react-hot-toast'

const ISSUE_OPTIONS = [
    { value: 'defective', label: 'Product is defective or not working' },
    { value: 'wrong-item', label: 'Wrong item received' },
    { value: 'not-as-described', label: 'Product not as described' },
    { value: 'damaged', label: 'Product arrived damaged' },
    { value: 'quality-issue', label: 'Quality issues with the product' },
    { value: 'other', label: 'Other (please describe)' }
]

export default function ReturnRefundModal({ 
    isOpen, 
    onClose, 
    order, 
    onSubmit,
    requestType = 'return' // 'return' or 'replace'
}) {
    const [formData, setFormData] = useState({
        issue: '',
        description: '',
        customerName: '',
        customerMobile: '',
        bankAccountNo: '',
        ifscCode: ''
    })
    const [images, setImages] = useState([])
    const [videos, setVideos] = useState([])
    const [uploading, setUploading] = useState(false)
    const [showOtherDescription, setShowOtherDescription] = useState(false)
    const [submitting, setSubmitting] = useState(false)

    if (!isOpen) return null

    const isCOD = order?.paymentMethod === 'COD'

    const handleIssueChange = (value) => {
        setFormData(prev => ({ ...prev, issue: value }))
        setShowOtherDescription(value === 'other')
    }

    const handleImageUpload = (res) => {
        if (images.length >= 4) {
            toast.error('Maximum 4 images allowed')
            return
        }
        setImages(prev => [...prev, res.url])
        toast.success('Image uploaded successfully')
        setUploading(false)
    }

    const handleVideoUpload = (res) => {
        if (videos.length >= 2) {
            toast.error('Maximum 2 videos allowed')
            return
        }
        setVideos(prev => [...prev, res.url])
        toast.success('Video uploaded successfully')
        setUploading(false)
    }

    const removeImage = (index) => {
        setImages(prev => prev.filter((_, i) => i !== index))
    }

    const removeVideo = (index) => {
        setVideos(prev => prev.filter((_, i) => i !== index))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        // Validation
        if (!formData.issue) {
            toast.error('Please select an issue')
            return
        }

        if (images.length < 2) {
            toast.error('Please upload at least 2 images')
            return
        }

        if (images.length > 4) {
            toast.error('Maximum 4 images allowed')
            return
        }

        if (formData.issue === 'other' && !formData.description.trim()) {
            toast.error('Please describe the issue')
            return
        }

        if (!formData.customerName.trim() || !formData.customerMobile.trim()) {
            toast.error('Please provide your name and mobile number')
            return
        }

        if (isCOD) {
            if (!formData.bankAccountNo.trim() || !formData.ifscCode.trim()) {
                toast.error('Please provide bank details for refund')
                return
            }
        }

        setSubmitting(true)

        try {
            await onSubmit({
                ...formData,
                images,
                videos,
                requestType
            })
            toast.success(`${requestType === 'return' ? 'Return' : 'Replace'} request submitted successfully!`)
            onClose()
        } catch (error) {
            toast.error(error.message || 'Failed to submit request')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-gradient-to-r from-pink-500 to-purple-600 text-white p-6 rounded-t-2xl flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold">
                            {requestType === 'return' ? 'Return' : 'Replace'} Request
                        </h2>
                        <p className="text-pink-100 text-sm mt-1">Order #{order?.id?.slice(-8).toUpperCase()}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="hover:bg-white/20 p-2 rounded-full transition"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Alert for COD */}
                    {isCOD && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex gap-3">
                            <AlertCircle className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
                            <div className="text-sm text-blue-800 dark:text-blue-200">
                                <p className="font-semibold">COD Order - Bank Details Required</p>
                                <p className="mt-1">Since this was a Cash on Delivery order, we'll need your bank details to process the refund.</p>
                            </div>
                        </div>
                    )}

                    {/* Alert for Online Payment */}
                    {!isCOD && (
                        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex gap-3">
                            <Check className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
                            <div className="text-sm text-green-800 dark:text-green-200">
                                <p className="font-semibold">Online Payment Detected</p>
                                <p className="mt-1">Your refund will be automatically processed to the original payment method ({order?.paymentMethod}).</p>
                            </div>
                        </div>
                    )}

                    {/* Issue Selection */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            What's the issue? <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={formData.issue}
                            onChange={(e) => handleIssueChange(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                            required
                        >
                            <option value="">Select an issue</option>
                            {ISSUE_OPTIONS.map(option => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Other Description */}
                    {showOtherDescription && (
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Please describe the issue <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                rows={4}
                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                placeholder="Provide detailed information about the issue..."
                                required
                            />
                        </div>
                    )}

                    {/* Customer Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Your Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.customerName}
                                onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                placeholder="Enter your full name"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Mobile Number <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="tel"
                                value={formData.customerMobile}
                                onChange={(e) => setFormData(prev => ({ ...prev, customerMobile: e.target.value }))}
                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                placeholder="Enter mobile number"
                                required
                            />
                        </div>
                    </div>

                    {/* Bank Details (COD only) */}
                    {isCOD && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                                Bank Details for Refund
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                        Account Number <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.bankAccountNo}
                                        onChange={(e) => setFormData(prev => ({ ...prev, bankAccountNo: e.target.value }))}
                                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                        placeholder="Enter account number"
                                        required={isCOD}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                        IFSC Code <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.ifscCode}
                                        onChange={(e) => setFormData(prev => ({ ...prev, ifscCode: e.target.value.toUpperCase() }))}
                                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 uppercase"
                                        placeholder="Enter IFSC code"
                                        required={isCOD}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Image Upload */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Upload Images (2-4 images) <span className="text-red-500">*</span>
                        </label>
                        <IKContext
                            publicKey={process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY}
                            urlEndpoint={process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT}
                            authenticationEndpoint="/api/imagekit-auth"
                        >
                            {images.length < 4 && (
                                <IKUpload
                                    fileName="return-image"
                                    onError={(err) => {
                                        toast.error('Image upload failed')
                                        setUploading(false)
                                    }}
                                    onSuccess={handleImageUpload}
                                    onUploadStart={() => setUploading(true)}
                                    accept="image/*"
                                    className="hidden"
                                    id="image-upload"
                                />
                            )}
                            <label
                                htmlFor="image-upload"
                                className={`flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed rounded-lg cursor-pointer transition ${
                                    images.length >= 4
                                        ? 'border-gray-300 bg-gray-100 cursor-not-allowed'
                                        : 'border-pink-300 hover:border-pink-500 bg-pink-50 dark:bg-pink-900/20'
                                }`}
                            >
                                <Upload size={20} className="text-pink-600" />
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {uploading ? 'Uploading...' : `Upload Image (${images.length}/4)`}
                                </span>
                            </label>
                        </IKContext>

                        {/* Image Preview */}
                        {images.length > 0 && (
                            <div className="grid grid-cols-4 gap-2 mt-3">
                                {images.map((url, index) => (
                                    <div key={index} className="relative group">
                                        <img
                                            src={url}
                                            alt={`Upload ${index + 1}`}
                                            className="w-full h-20 object-cover rounded-lg"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeImage(index)}
                                            className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Video Upload */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Upload Videos (Optional, max 2)
                        </label>
                        <IKContext
                            publicKey={process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY}
                            urlEndpoint={process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT}
                            authenticationEndpoint="/api/imagekit-auth"
                        >
                            {videos.length < 2 && (
                                <IKUpload
                                    fileName="return-video"
                                    onError={(err) => {
                                        toast.error('Video upload failed')
                                        setUploading(false)
                                    }}
                                    onSuccess={handleVideoUpload}
                                    onUploadStart={() => setUploading(true)}
                                    accept="video/*"
                                    className="hidden"
                                    id="video-upload"
                                />
                            )}
                            <label
                                htmlFor="video-upload"
                                className={`flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed rounded-lg cursor-pointer transition ${
                                    videos.length >= 2
                                        ? 'border-gray-300 bg-gray-100 cursor-not-allowed'
                                        : 'border-purple-300 hover:border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                                }`}
                            >
                                <Upload size={20} className="text-purple-600" />
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {uploading ? 'Uploading...' : `Upload Video (${videos.length}/2)`}
                                </span>
                            </label>
                        </IKContext>

                        {/* Video Preview */}
                        {videos.length > 0 && (
                            <div className="grid grid-cols-2 gap-2 mt-3">
                                {videos.map((url, index) => (
                                    <div key={index} className="relative group">
                                        <video
                                            src={url}
                                            className="w-full h-32 object-cover rounded-lg"
                                            controls
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeVideo(index)}
                                            className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Submit Buttons */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-700 rounded-lg font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                            disabled={submitting}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg font-semibold hover:from-pink-600 hover:to-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={submitting || uploading}
                        >
                            {submitting ? 'Submitting...' : `Submit ${requestType === 'return' ? 'Return' : 'Replace'} Request`}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
