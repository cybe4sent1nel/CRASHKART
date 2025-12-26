'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Upload, X, AlertCircle, CheckCircle } from 'lucide-react'

const CATEGORIES = [
  'Smartphones & Mobile Devices',
  'Laptops & Computers',
  'Tablets & E-Readers',
  'Smartwatches & Wearables',
  'Audio & Headphones',
  'Cameras & Photography',
  'Gaming Consoles & Accessories',
  'Smart Home Devices',
  'Networking & Connectivity',
  'Computer Peripherals',
  'Gadgets & Accessories',
  'Electronics',
  'Fashion & Apparel',
  'Home & Furniture',
  'Beauty & Personal Care',
  'Sports & Outdoors',
  'Books & Media',
  'Toys & Gaming',
  'Food & Groceries',
  'Other'
]

export default function SellerQueryForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    companyName: '',
    businessType: 'individual',
    category: '',
    experience: 'beginner',
    description: '',
    storeLogo: null,
    documents: []
  })

  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState(null)
  const [errors, setErrors] = useState({})

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type and size
    const validTypes = ['.jpg', '.jpeg', '.png', '.webp', '.svg']
    const maxSize = 5 * 1024 * 1024 // 5MB

    const ext = '.' + file.name.split('.').pop().toLowerCase()
    if (!validTypes.includes(ext)) {
      setMessage({ type: 'error', text: 'Invalid logo format. Only JPG, PNG, WEBP, SVG allowed.' })
      return
    }
    if (file.size > maxSize) {
      setMessage({ type: 'error', text: 'Logo file too large. Max 5MB.' })
      return
    }

    setUploading(true)

    try {
      const formDataToSend = new FormData()
      formDataToSend.append('file', file)
      formDataToSend.append('fileName', `store-logo-${Date.now()}`)
      formDataToSend.append('folder', '/seller-logos')

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formDataToSend
      })

      if (!response.ok) throw new Error('Upload failed')
      
      const data = await response.json()
      setFormData(prev => ({
        ...prev,
        storeLogo: data.url
      }))

      setMessage({ type: 'success', text: 'Store logo uploaded successfully' })
      setTimeout(() => setMessage(null), 3000)
    } catch (error) {
      console.error('Logo upload error:', error)
      setMessage({ type: 'error', text: 'Failed to upload logo. Please try again.' })
    } finally {
      setUploading(false)
    }
  }

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files || [])
    
    if (files.length === 0) return

    // Validate file types and sizes
    const validTypes = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png']
    const maxSize = 10 * 1024 * 1024 // 10MB

    const validFiles = files.filter(file => {
      const ext = '.' + file.name.split('.').pop().toLowerCase()
      if (!validTypes.includes(ext)) {
        setMessage({ type: 'error', text: `Invalid file type: ${file.name}. Only PDF, DOC, DOCX, JPG, PNG allowed.` })
        return false
      }
      if (file.size > maxSize) {
        setMessage({ type: 'error', text: `File too large: ${file.name}. Max 10MB per file.` })
        return false
      }
      return true
    })

    if (validFiles.length === 0) return

    setUploading(true)

    try {
      // Upload to ImageKit
      const uploadPromises = validFiles.map(async (file) => {
        const formDataToSend = new FormData()
        formDataToSend.append('file', file)
        formDataToSend.append('fileName', file.name)
        formDataToSend.append('folder', '/seller-documents')

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formDataToSend
        })

        if (!response.ok) throw new Error(`Upload failed for ${file.name}`)
        
        const data = await response.json()
        return data.url
      })

      const uploadedUrls = await Promise.all(uploadPromises)
      
      setFormData(prev => ({
        ...prev,
        documents: [...prev.documents, ...uploadedUrls]
      }))

      setMessage({ type: 'success', text: `${uploadedUrls.length} file(s) uploaded successfully` })
      setTimeout(() => setMessage(null), 3000)
    } catch (error) {
      console.error('Upload error:', error)
      setMessage({ type: 'error', text: 'Failed to upload files. Please try again.' })
    } finally {
      setUploading(false)
    }
  }

  const removeDocument = (index) => {
    setFormData(prev => ({
      ...prev,
      documents: prev.documents.filter((_, i) => i !== index)
    }))
  }

  const removeLogo = () => {
    setFormData(prev => ({
      ...prev,
      storeLogo: null
    }))
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.name.trim()) newErrors.name = 'Name is required'
    if (!formData.email.trim()) newErrors.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email'
    if (!formData.phone.trim()) newErrors.phone = 'Phone is required'
    if (!formData.businessType) newErrors.businessType = 'Business type is required'
    if (!formData.category) newErrors.category = 'Product category is required'
    if (!formData.experience) newErrors.experience = 'Experience level is required'
    if (!formData.description.trim()) newErrors.description = 'Description is required'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      setMessage({ type: 'error', text: 'Please fill all required fields' })
      return
    }

    setSubmitting(true)

    try {
      const response = await fetch('/api/seller-queries/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit application')
      }

      setMessage({ type: 'success', text: 'Application submitted successfully! Check your email for confirmation.' })
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        companyName: '',
        businessType: 'individual',
        category: '',
        experience: 'beginner',
        description: '',
        storeLogo: null,
        documents: []
      })

      setTimeout(() => setMessage(null), 5000)
    } catch (error) {
      console.error('Submission error:', error)
      setMessage({ type: 'error', text: error.message || 'Failed to submit application' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-2xl mx-auto bg-white dark:bg-slate-800 rounded-xl shadow-lg p-8"
    >
      <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">Become a CrashKart Seller</h2>
      <p className="text-slate-600 dark:text-slate-400 mb-8">Fill out this form to apply as a seller on our platform</p>

      {message && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mb-6 p-4 rounded-lg flex items-start gap-3 ${
            message.type === 'success'
              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700'
              : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" size={20} />
          ) : (
            <AlertCircle className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" size={20} />
          )}
          <p className={message.type === 'success' ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}>
            {message.text}
          </p>
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
            Full Name *
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            className={`w-full px-4 py-2 border rounded-lg dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 ${
              errors.name ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'
            }`}
            placeholder="Your full name"
          />
          {errors.name && <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.name}</p>}
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
            Email *
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            className={`w-full px-4 py-2 border rounded-lg dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 ${
              errors.email ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'
            }`}
            placeholder="your@email.com"
          />
          {errors.email && <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.email}</p>}
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
            Phone Number *
          </label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            className={`w-full px-4 py-2 border rounded-lg dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 ${
              errors.phone ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'
            }`}
            placeholder="+91 XXXXX XXXXX"
          />
          {errors.phone && <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.phone}</p>}
        </div>

        {/* Company Name */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
            Company Name (Optional)
          </label>
          <input
            type="text"
            name="companyName"
            value={formData.companyName}
            onChange={handleInputChange}
            className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            placeholder="Your company name (if applicable)"
          />
        </div>

        {/* Business Type */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
            Business Type *
          </label>
          <select
            name="businessType"
            value={formData.businessType}
            onChange={handleInputChange}
            className={`w-full px-4 py-2 border rounded-lg dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 ${
              errors.businessType ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'
            }`}
          >
            <option value="">Select business type</option>
            <option value="individual">Individual</option>
            <option value="business">Business</option>
            <option value="partnership">Partnership</option>
          </select>
          {errors.businessType && <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.businessType}</p>}
        </div>

        {/* Product Category */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
            Product Category *
          </label>
          <select
            name="category"
            value={formData.category}
            onChange={handleInputChange}
            className={`w-full px-4 py-2 border rounded-lg dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 ${
              errors.category ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'
            }`}
          >
            <option value="">Select category</option>
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          {errors.category && <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.category}</p>}
        </div>

        {/* Experience Level */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
            Experience Level *
          </label>
          <div className="space-y-2">
            {[
              { value: 'beginner', label: 'Beginner (New to e-commerce)' },
              { value: 'intermediate', label: 'Intermediate (Some experience)' },
              { value: 'experienced', label: 'Experienced (Established seller)' }
            ].map(option => (
              <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="experience"
                  value={option.value}
                  checked={formData.experience === option.value}
                  onChange={handleInputChange}
                  className="w-4 h-4"
                />
                <span className="text-slate-700 dark:text-slate-300">{option.label}</span>
              </label>
            ))}
          </div>
          {errors.experience && <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.experience}</p>}
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
            Business Description *
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={5}
            className={`w-full px-4 py-2 border rounded-lg dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 resize-none ${
              errors.description ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'
            }`}
            placeholder="Tell us about your business, what you want to sell, and why you'd be a great seller on CrashKart..."
          />
          {errors.description && <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.description}</p>}
        </div>

        {/* Store Logo Upload */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
            Store Logo (Optional)
          </label>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
            Upload your store logo (JPG, PNG, WEBP, SVG). This will be displayed on your store card and product pages. Max 5MB.
          </p>

          {!formData.storeLogo ? (
            <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-6 text-center cursor-pointer hover:border-red-500 transition">
              <input
                type="file"
                onChange={handleLogoUpload}
                disabled={uploading}
                className="hidden"
                id="logo-upload"
                accept=".jpg,.jpeg,.png,.webp,.svg"
              />
              <label htmlFor="logo-upload" className="cursor-pointer">
                <div className="flex flex-col items-center gap-2">
                  <Upload size={32} className="text-slate-400" />
                  <p className="font-medium text-slate-700 dark:text-slate-300">
                    {uploading ? 'Uploading...' : 'Click to upload store logo'}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    JPG, PNG, WEBP, SVG (Max 5MB)
                  </p>
                </div>
              </label>
            </div>
          ) : (
            <div className="relative bg-slate-100 dark:bg-slate-700 rounded-lg p-4">
              <div className="flex items-center gap-4">
                <img
                  src={formData.storeLogo}
                  alt="Store Logo Preview"
                  className="w-20 h-20 object-contain rounded"
                />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Logo uploaded successfully
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    {formData.storeLogo.split('/').pop()}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={removeLogo}
                  className="text-red-600 hover:text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded transition"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Document Upload */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
            Supporting Documents (Optional)
          </label>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
            Upload business registration, tax docs, or any other relevant documents. Max 10MB per file.
          </p>

          <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-6 text-center cursor-pointer hover:border-red-500 transition">
            <input
              type="file"
              multiple
              onChange={handleFileChange}
              disabled={uploading}
              className="hidden"
              id="file-upload"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <div className="flex flex-col items-center gap-2">
                <Upload size={32} className="text-slate-400" />
                <p className="font-medium text-slate-700 dark:text-slate-300">
                  {uploading ? 'Uploading...' : 'Click to upload or drag files'}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  PDF, DOC, DOCX, JPG, PNG (Max 10MB each)
                </p>
              </div>
            </label>
          </div>

          {/* Uploaded Documents List */}
          {formData.documents.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Uploaded Documents ({formData.documents.length})
              </p>
              {formData.documents.map((doc, idx) => (
                <div key={idx} className="flex items-center justify-between bg-slate-100 dark:bg-slate-700 p-3 rounded-lg">
                  <a
                    href={doc}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-red-600 dark:text-red-400 hover:underline truncate"
                  >
                    {doc.split('/').pop()}
                  </a>
                  <button
                    type="button"
                    onClick={() => removeDocument(idx)}
                    className="text-red-600 hover:text-red-700 dark:text-red-400"
                  >
                    <X size={18} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={submitting || uploading}
          className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold py-3 rounded-lg transition"
        >
          {submitting ? 'Submitting...' : 'Submit Application'}
        </button>
      </form>

      <p className="text-xs text-slate-600 dark:text-slate-400 mt-6 text-center">
        By submitting this form, you agree to our seller terms and conditions. We'll review your application and contact you within 5-7 business days.
      </p>
    </motion.div>
  )
}
