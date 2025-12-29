'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ComplaintTrackingPage() {
    const params = useParams()
    const router = useRouter()
    const [complaint, setComplaint] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchComplaint()
    }, [params.id])

    const fetchComplaint = async () => {
        try {
            const res = await fetch(`/api/complaints/${params.id}`)
            const data = await res.json()
            if (res.ok) {
                setComplaint(data.complaint)
            } else {
                toast.error('Complaint not found')
            }
        } catch (error) {
            console.error('Error fetching complaint:', error)
            toast.error('Failed to load complaint')
        } finally {
            setLoading(false)
        }
    }

    const getStatusIcon = (status) => {
        switch(status) {
            case 'open': return <Clock className="text-blue-500" />
            case 'in-progress': return <AlertCircle className="text-yellow-500" />
            case 'resolved': return <CheckCircle className="text-green-500" />
            case 'closed': return <CheckCircle className="text-slate-500" />
            default: return <Clock className="text-slate-500" />
        }
    }

    const getStatusColor = (status) => {
        switch(status) {
            case 'open': return 'bg-blue-100 text-blue-700 border-blue-200'
            case 'in-progress': return 'bg-yellow-100 text-yellow-700 border-yellow-200'
            case 'resolved': return 'bg-green-100 text-green-700 border-green-200'
            case 'closed': return 'bg-slate-100 text-slate-700 border-slate-200'
            default: return 'bg-slate-100 text-slate-700 border-slate-200'
        }
    }

    const getPriorityColor = (priority) => {
        switch(priority) {
            case 'urgent': return 'bg-red-100 text-red-700'
            case 'high': return 'bg-orange-100 text-orange-700'
            case 'normal': return 'bg-blue-100 text-blue-700'
            case 'low': return 'bg-slate-100 text-slate-700'
            default: return 'bg-slate-100 text-slate-700'
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
            </div>
        )
    }

    if (!complaint) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <XCircle size={64} className="text-red-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-slate-800">Complaint Not Found</h2>
                    <button onClick={() => router.back()} className="mt-4 px-6 py-2 bg-pink-500 text-white rounded-lg">
                        Go Back
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 py-8 px-4">
            <div className="max-w-3xl mx-auto">
                <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-700 hover:text-pink-600 mb-6">
                    <ArrowLeft size={20} />
                    <span>Back</span>
                </button>

                <div className="bg-white rounded-2xl shadow-xl p-8 border border-pink-200">
                    <div className="flex items-start justify-between mb-6">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-800">Complaint Tracking</h1>
                            <p className="text-slate-600 mt-1">ID: {complaint.id.slice(-8).toUpperCase()}</p>
                        </div>
                        {getStatusIcon(complaint.status)}
                    </div>

                    <div className="space-y-6">
                        <div className="flex gap-4">
                            <span className={`px-4 py-2 rounded-full text-sm font-semibold border ${getStatusColor(complaint.status)}`}>
                                {complaint.status.toUpperCase()}
                            </span>
                            <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getPriorityColor(complaint.priority)}`}>
                                {complaint.priority.toUpperCase()} Priority
                            </span>
                        </div>

                        <div>
                            <h3 className="text-sm font-semibold text-slate-600 mb-2">Subject</h3>
                            <p className="text-lg text-slate-800">{complaint.subject}</p>
                        </div>

                        <div>
                            <h3 className="text-sm font-semibold text-slate-600 mb-2">Description</h3>
                            <p className="text-slate-700 whitespace-pre-wrap">{complaint.description}</p>
                        </div>

                        <div>
                            <h3 className="text-sm font-semibold text-slate-600 mb-2">Category</h3>
                            <p className="text-slate-700 capitalize">{complaint.category}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <h3 className="text-sm font-semibold text-slate-600 mb-2">Created</h3>
                                <p className="text-slate-700">{new Date(complaint.createdAt).toLocaleString()}</p>
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-slate-600 mb-2">Last Updated</h3>
                                <p className="text-slate-700">{new Date(complaint.updatedAt).toLocaleString()}</p>
                            </div>
                        </div>

                        {complaint.resolution && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                <h3 className="text-sm font-semibold text-green-800 mb-2">Resolution</h3>
                                <p className="text-green-700">{complaint.resolution}</p>
                            </div>
                        )}

                        <div className="bg-gradient-to-r from-pink-100 to-purple-100 rounded-lg p-4">
                            <p className="text-sm text-slate-700">
                                💡 Our support team is working on your complaint. You'll receive email updates at each stage.
                                For urgent matters, contact <a href="mailto:crashkart.help@gmail.com" className="text-pink-600 font-semibold">crashkart.help@gmail.com</a>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
