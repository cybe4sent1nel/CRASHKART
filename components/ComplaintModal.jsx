'use client'
import { useState } from 'react'
import { X, Upload, AlertCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'

export default function ComplaintModal({ orderId, userId, onClose, onSubmit }) {
    const [subject, setSubject] = useState('')
    const [description, setDescription] = useState('')
    const [category, setCategory] = useState('other')
    const [images, setImages] = useState([])
    const [uploading, setUploading] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleImageUpload = async (e) => {
        const files = Array.from(e.target.files)
        setUploading(true)
        setError('')

        try {
            const uploadedImages = []

            for (const file of files) {
                // Using ImageKit for image upload
                const formData = new FormData()
                formData.append('file', file)
                formData.append('fileName', `complaint_${Date.now()}_${file.name}`)

                const response = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Basic ${btoa(process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY + ':')}`
                    },
                    body: formData
                })

                if (response.ok) {
                    const data = await response.json()
                    uploadedImages.push(data.url)
                } else {
                    throw new Error('Failed to upload image')
                }
            }

            setImages([...images, ...uploadedImages])
        } catch (error) {
            console.error('Image upload error:', error)
            setError('Failed to upload images. Please try again.')
        } finally {
            setUploading(false)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            if (!subject.trim()) {
                setError('Please enter a subject')
                return
            }
            if (!description.trim()) {
                setError('Please enter a description')
                return
            }

            const response = await fetch('/api/complaints/create-complaint', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderId,
                    userId,
                    subject,
                    description,
                    category,
                    images,
                }),
            })

            const data = await response.json()

            if (data.success) {
                onSubmit(data.complaint)
                toast.success('Complaint submitted successfully! Our team will contact you soon.')
                onClose()
            } else {
                setError(data.error || 'Failed to submit complaint')
            }
        } catch (error) {
            console.error('Error submitting complaint:', error)
            setError('Failed to submit complaint. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <AnimatePresence>
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
                    className="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto"
                >
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-2xl font-bold text-slate-800 dark:text-white">Register Complaint</h3>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition"
                        >
                            <X size={24} className="text-slate-600 dark:text-slate-400" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Subject */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Subject *
                            </label>
                            <input
                                type="text"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                placeholder="Brief subject of the complaint"
                                className="w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        {/* Category */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Category *
                            </label>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="damaged">Damaged Product</option>
                                <option value="wrong-item">Wrong Item Received</option>
                                <option value="quality">Quality Issues</option>
                                <option value="delivery">Delivery Issues</option>
                                <option value="defective">Defective/Not Working</option>
                                <option value="not-as-described">Not as Described</option>
                                <option value="missing-items">Missing Items</option>
                                <option value="other">Other</option>
                            </select>
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Description *
                            </label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Detailed description of the issue..."
                                rows={5}
                                className="w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                            />
                        </div>

                        {/* Image Upload */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Upload Images (Optional)
                            </label>
                            <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-6 text-center hover:border-blue-500 dark:hover:border-blue-400 transition">
                                <Upload size={32} className="mx-auto text-slate-400 dark:text-slate-600 mb-2" />
                                <label className="block">
                                    <input
                                        type="file"
                                        multiple
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        disabled={uploading}
                                        className="hidden"
                                    />
                                    <span className="cursor-pointer text-blue-600 dark:text-blue-400 hover:underline font-medium">
                                        {uploading ? 'Uploading...' : 'Click to upload images'}
                                    </span>
                                </label>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">PNG, JPG up to 5MB</p>
                            </div>

                            {/* Uploaded Images Preview */}
                            {images.length > 0 && (
                                <div className="mt-4 grid grid-cols-3 gap-3">
                                    {images.map((img, idx) => (
                                        <div key={idx} className="relative">
                                            <img
                                                src={img}
                                                alt={`Complaint ${idx + 1}`}
                                                className="w-full h-24 object-cover rounded-lg"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setImages(images.filter((_, i) => i !== idx))}
                                                className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded hover:bg-red-600 transition"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="flex gap-2 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300">
                                <AlertCircle size={20} className="flex-shrink-0" />
                                <p>{error}</p>
                            </div>
                        )}

                        {/* Info Box */}
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                            <p className="text-sm text-blue-700 dark:text-blue-300">
                                <span className="font-semibold">Note:</span> Your complaint will be sent to our admin team and we will respond within 24 hours.
                            </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3">
                            <button
                                type="submit"
                                disabled={loading || uploading}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-3 rounded-lg font-medium transition"
                            >
                                {loading ? 'Submitting...' : 'Submit Complaint'}
                            </button>
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-white py-3 rounded-lg font-medium transition"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    )
}
