'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Star, Trash2, CheckCircle, XCircle, Eye, MessageCircle } from 'lucide-react'
import { toast } from 'react-hot-toast'

const FEEDBACK_TYPES = {
  product: 'Product Reviews',
  app: 'App Reviews',
  complaint: 'Complaints'
}

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'highest-rated', label: 'Highest Rated' },
  { value: 'lowest-rated', label: 'Lowest Rated' },
  { value: 'pending', label: 'Pending Review' }
]

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  approved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
}

export default function FeedbackPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('app')
  const [feedbacks, setFeedbacks] = useState([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState('newest')
  const [selectedFeedback, setSelectedFeedback] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    fetchFeedbacks()
  }, [activeTab, sortBy])

  const fetchFeedbacks = async () => {
    try {
      setLoading(true)
      const response = await fetch(
        `/api/admin/feedback?type=${activeTab}&sortBy=${sortBy}`,
        { 
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' } 
        }
      )
      const data = await response.json()
      
      if (response.ok) {
        setFeedbacks(data.feedbacks || [])
      } else {
        toast.error(data.message || 'Failed to fetch feedbacks')
      }
    } catch (error) {
      console.error('Error fetching feedbacks:', error)
      toast.error('Failed to fetch feedbacks')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (feedbackId, newStatus) => {
    try {
      setUpdating(true)
      const response = await fetch(`/api/admin/feedback/${feedbackId}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      const data = await response.json()
      if (response.ok) {
        toast.success(`Feedback ${newStatus} successfully`)
        setFeedbacks(prev => prev.map(f => 
          f.id === feedbackId ? { ...f, status: newStatus } : f
        ))
        setShowModal(false)
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      console.error('Error updating feedback:', error)
      toast.error('Failed to update feedback')
    } finally {
      setUpdating(false)
    }
  }

  const handleDelete = async (feedbackId) => {
    const { showConfirm } = await import('@/lib/alertUtils');
    const confirmed = await showConfirm(
      'Delete Feedback?',
      'Are you sure you want to delete this feedback? This action cannot be undone.'
    );
    
    if (!confirmed) return

    try {
      const response = await fetch(`/api/admin/feedback/${feedbackId}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (response.ok) {
        toast.success('Feedback deleted')
        setFeedbacks(prev => prev.filter(f => f.id !== feedbackId))
      } else {
        toast.error('Failed to delete feedback')
      }
    } catch (error) {
      console.error('Error deleting feedback:', error)
      toast.error('Failed to delete feedback')
    }
  }

  const getRatingColor = (rating) => {
    if (rating >= 4) return 'text-green-500'
    if (rating >= 3) return 'text-yellow-500'
    return 'text-red-500'
  }

  return (
    <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Customer Feedback
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Manage and review customer feedback on products and the app
          </p>
        </div>

        {/* Tabs and Controls */}
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          {/* Tabs */}
          <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700">
            {Object.entries(FEEDBACK_TYPES).map(([key, label]) => (
              <button
                key={key}
                onClick={() => {
                  setActiveTab(key)
                  setSelectedFeedback(null)
                }}
                className={`px-4 py-2 font-medium border-b-2 transition ${
                  activeTab === key
                    ? 'border-red-600 text-red-600'
                    : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-red-600"
          >
            {SORT_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Feedbacks List */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-12">
              <p className="text-slate-600 dark:text-slate-400">Loading feedbacks...</p>
            </div>
          ) : feedbacks.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <MessageCircle size={48} className="mx-auto text-slate-400 mb-4" />
              <p className="text-slate-600 dark:text-slate-400">No feedbacks found</p>
            </div>
          ) : (
            feedbacks.map(feedback => (
              <div
                key={feedback.id}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-6 hover:shadow-lg transition cursor-pointer"
                onClick={() => {
                  setSelectedFeedback(feedback)
                  setShowModal(true)
                }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Title and Rating (or Subject for complaints) */}
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-slate-900 dark:text-white truncate">
                        {feedback.subject || feedback.title || 'No Title'}
                      </h3>
                      {feedback.rating && (
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              size={16}
                              className={i < feedback.rating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300 dark:text-slate-600'}
                            />
                          ))}
                        </div>
                      )}
                      {feedback.priority && (
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          feedback.priority === 'urgent' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                          feedback.priority === 'high' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' :
                          'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                        }`}>
                          {feedback.priority.toUpperCase()}
                        </span>
                      )}
                    </div>

                    {/* User Info */}
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                      {feedback.userName ? feedback.userName : 'Anonymous'} {feedback.userEmail && `• ${feedback.userEmail}`}
                    </p>

                    {/* Message/Description Preview */}
                    <p className="text-slate-700 dark:text-slate-300 line-clamp-2 text-sm">
                      {feedback.description || feedback.message}
                    </p>

                    {/* Additional Info */}
                    {feedback.productName && (
                      <p className="text-xs text-slate-500 dark:text-slate-500 mt-2">
                        📦 Product: {feedback.productName}
                      </p>
                    )}
                    {feedback.orderNumber && (
                      <p className="text-xs text-slate-500 dark:text-slate-500 mt-2">
                        🛒 Order: {feedback.orderNumber}
                      </p>
                    )}
                    {feedback.category && (
                      <p className="text-xs text-slate-500 dark:text-slate-500 mt-2">
                        🏷️ Category: {feedback.category}
                      </p>
                    )}
                  </div>

                  {/* Status and Actions */}
                  <div className="flex flex-col items-end gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[feedback.status]}`}>
                      {feedback.status.charAt(0).toUpperCase() + feedback.status.slice(1)}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedFeedback(feedback)
                          setShowModal(true)
                        }}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition"
                        title="View details"
                      >
                        <Eye size={18} className="text-slate-600 dark:text-slate-400" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete(feedback.id)
                        }}
                        className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                        title="Delete"
                      >
                        <Trash2 size={18} className="text-red-600" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Date */}
                <p className="text-xs text-slate-500 dark:text-slate-500 mt-4">
                  {new Date(feedback.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Modal */}
      {showModal && selectedFeedback && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setShowModal(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="sticky top-0 flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Feedback Details
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                >
                  ✕
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Title/Subject and Rating */}
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
                    {selectedFeedback.subject || selectedFeedback.title || 'No Title'}
                  </h3>
                  {selectedFeedback.rating && (
                    <div className="flex items-center gap-2">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={20}
                          className={i < selectedFeedback.rating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300 dark:text-slate-600'}
                        />
                      ))}
                      <span className="ml-2 text-lg font-semibold text-slate-700 dark:text-slate-300">
                        {selectedFeedback.rating}/5
                      </span>
                    </div>
                  )}
                  {selectedFeedback.priority && (
                    <div className="mt-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        selectedFeedback.priority === 'urgent' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                        selectedFeedback.priority === 'high' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' :
                        'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                      }`}>
                        Priority: {selectedFeedback.priority.toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>

                {/* User Info */}
                <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg">
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                    <strong>User:</strong> {selectedFeedback.userName || 'Anonymous'}
                  </p>
                  {selectedFeedback.userEmail && (
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                      <strong>Email:</strong> {selectedFeedback.userEmail}
                    </p>
                  )}
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    <strong>Type:</strong> {FEEDBACK_TYPES[selectedFeedback.feedbackType] || selectedFeedback.feedbackType}
                  </p>
                  {selectedFeedback.productName && (
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                      <strong>Product:</strong> {selectedFeedback.productName}
                    </p>
                  )}
                  {selectedFeedback.orderNumber && (
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                      <strong>Order:</strong> {selectedFeedback.orderNumber}
                    </p>
                  )}
                  {selectedFeedback.category && (
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                      <strong>Category:</strong> {selectedFeedback.category}
                    </p>
                  )}
                </div>

                {/* Message/Description */}
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-2">
                    {selectedFeedback.feedbackType === 'complaint' ? 'Complaint Description' : 'Feedback Message'}
                  </h4>
                  <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                    {selectedFeedback.description || selectedFeedback.message}
                  </p>
                </div>

                {/* Complaint Images */}
                {selectedFeedback.images && selectedFeedback.images.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-white mb-2">
                      {selectedFeedback.feedbackType === 'complaint' ? 'Attached Images' : 'Review Images'}
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      {selectedFeedback.images.map((img, idx) => (
                        <img 
                          key={idx} 
                          src={img} 
                          alt={`${selectedFeedback.feedbackType === 'complaint' ? 'Complaint' : 'Review'} image ${idx + 1}`}
                          className="w-full h-32 object-cover rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer hover:opacity-90 transition"
                          onClick={() => window.open(img, '_blank')}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Videos (for reviews) */}
                {selectedFeedback.videos && selectedFeedback.videos.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-white mb-2">
                      Review Videos
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      {selectedFeedback.videos.map((vid, idx) => (
                        <video 
                          key={idx} 
                          src={vid} 
                          className="w-full h-32 object-cover rounded-lg border border-slate-200 dark:border-slate-700"
                          controls
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Resolution (for complaints) */}
                {selectedFeedback.resolution && (
                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                    <h4 className="font-semibold text-green-900 dark:text-green-200 mb-2">
                      Resolution
                    </h4>
                    <p className="text-green-800 dark:text-green-300 whitespace-pre-wrap">
                      {selectedFeedback.resolution}
                    </p>
                  </div>
                )}

                {/* Status and Actions */}
                <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                    <strong>Current Status:</strong>{' '}
                    <span className={`px-2 py-1 rounded text-xs font-medium ${STATUS_COLORS[selectedFeedback.status]}`}>
                      {selectedFeedback.status.charAt(0).toUpperCase() + selectedFeedback.status.slice(1)}
                    </span>
                  </p>

                  <div className="flex gap-3">
                    {selectedFeedback.status !== 'approved' && (
                      <button
                        onClick={() => handleStatusChange(selectedFeedback.id, 'approved')}
                        disabled={updating}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg transition font-medium"
                      >
                        <CheckCircle size={18} />
                        Approve
                      </button>
                    )}
                    {selectedFeedback.status !== 'rejected' && (
                      <button
                        onClick={() => handleStatusChange(selectedFeedback.id, 'rejected')}
                        disabled={updating}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg transition font-medium"
                      >
                        <XCircle size={18} />
                        Reject
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(selectedFeedback.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-slate-300 hover:bg-slate-400 dark:bg-slate-600 dark:hover:bg-slate-700 text-slate-900 dark:text-white rounded-lg transition font-medium"
                    >
                      <Trash2 size={18} />
                      Delete
                    </button>
                  </div>
                </div>

                {/* Timestamp */}
                <p className="text-xs text-slate-500 dark:text-slate-500">
                  Submitted: {new Date(selectedFeedback.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
