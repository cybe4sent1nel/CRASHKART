'use client'
import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { Send, ImagePlus, Video, Package, X, ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { IKContext, IKUpload, IKImage } from 'imagekitio-react'
import toast from 'react-hot-toast'
import Pattern from '@/components/Pattern'
import AuroraLoader from '@/components/AuroraLoader'
import CandyFlossPattern from '@/components/CandyFlossPattern'

const urlEndpoint = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT
const publicKey = process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY

export default function SupportPage() {
    const { data: session } = useSession()
    const router = useRouter()
    const [messages, setMessages] = useState([])
    const [inputValue, setInputValue] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [selectedOrder, setSelectedOrder] = useState(null)
    const [userOrders, setUserOrders] = useState([])
    const [loadingOrders, setLoadingOrders] = useState(true)
    const [showOrderSelector, setShowOrderSelector] = useState(true)
    const [uploadedFiles, setUploadedFiles] = useState([])
    const [userEmail, setUserEmail] = useState(null)
    const messagesEndRef = useRef(null)
    const ikUploadImageRef = useRef(null)
    const ikUploadVideoRef = useRef(null)

    useEffect(() => {
        // Check localStorage first, then session
        const userData = localStorage.getItem('user')
        let email = null
        
        if (userData) {
            try {
                const user = JSON.parse(userData)
                email = user.email
            } catch (e) {
                console.error('Error parsing user data:', e)
            }
        } else if (session?.user?.email) {
            email = session.user.email
        }

        if (!email) {
            router.push('/login')
            return
        }

        setUserEmail(email)
        fetchUserOrders(email)
        loadConversationHistory(email)
    }, [session, router])

    const fetchUserOrders = async (email) => {
        try {
            const res = await fetch('/api/orders/get-user-orders', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    email 
                },
                body: JSON.stringify({ email })
            })
            const data = await res.json()
            if (res.ok) {
                setUserOrders(data.orders || [])
            }
        } catch (error) {
            console.error('Error fetching orders:', error)
        } finally {
            setLoadingOrders(false)
        }
    }

    const loadConversationHistory = async (email) => {
        try {
            const res = await fetch('/api/support/history', {
                headers: { email }
            })
            const data = await res.json()
            if (res.ok && data.messages) {
                setMessages(data.messages)
            } else {
                // Initial greeting message
                setMessages([{
                    id: Date.now(),
                    text: "Hello! I'm Inquirae, your CrashKart support assistant. I'm here to help you with your orders, complaints, or any queries.\n\n📝 **For Complaints:**\n• Select your order above\n• Describe the issue clearly\n• Upload photos/videos using the 📷 and 🎥 buttons below (highly recommended)\n\n💡 Having visual proof helps us resolve your issue faster!\n\nPlease select an order or type your message to get started!",
                    sender: 'bot',
                    timestamp: new Date()
                }])
            }
        } catch (error) {
            console.error('Error loading history:', error)
        }
    }

    const saveConversationHistory = async (newMessages) => {
        if (!userEmail) return
        try {
            await fetch('/api/support/history', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    email: userEmail
                },
                body: JSON.stringify({ messages: newMessages })
            })
        } catch (error) {
            console.error('Error saving history:', error)
        }
    }

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    const resetChat = async () => {
        if (!userEmail) return
        
        try {
            // Clear messages in database
            await fetch('/api/support/history', {
                method: 'DELETE',
                headers: { email: userEmail }
            })
            
            // Reset local state
            setMessages([{
                id: Date.now(),
                text: "Hello! I'm Inquirae, your CrashKart support assistant. I'm here to help you with your orders, complaints, or any queries.\n\n📝 **For Complaints:**\n• Select your order above\n• Describe the issue clearly\n• Upload photos/videos using the 📷 and 🎥 buttons below (highly recommended)\n\n💡 Having visual proof helps us resolve your issue faster!\n\nPlease select an order or type your message to get started!",
                sender: 'bot',
                timestamp: new Date()
            }])
            setSelectedOrder(null)
            setUploadedFiles([])
            setInputValue('')
            
            toast.success('Chat conversation reset')
        } catch (error) {
            console.error('Error resetting chat:', error)
            toast.error('Failed to reset chat')
        }
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    const handleOrderSelect = (order) => {
        setSelectedOrder(order)
        setShowOrderSelector(false)
        
        const orderDetails = `Order ID: ${order.id}\nTotal: ₹${order.total}\nItems: ${order.items.length}\nStatus: ${order.status}`
        const newMessages = [
            ...messages,
            {
                id: Date.now(),
                text: `Selected Order: ${order.id}`,
                sender: 'user',
                timestamp: new Date(),
                orderData: order
            },
            {
                id: Date.now() + 1,
                text: `Great! I can see your order details:\n\n${orderDetails}\n\nHow can I help you with this order?`,
                sender: 'bot',
                timestamp: new Date()
            }
        ]
        setMessages(newMessages)
        saveConversationHistory(newMessages)
    }

    const handleImageUpload = (res) => {
        if (res.url) {
            console.log('📸 Image uploaded:', res)
            setUploadedFiles(prev => [...prev, { 
                type: 'image', 
                url: res.filePath || res.url, 
                fullUrl: res.url, 
                name: res.name 
            }])
            toast.success('Image uploaded successfully')
        }
    }

    const handleVideoUpload = (res) => {
        if (res.url) {
            console.log('🎥 Video uploaded:', res)
            setUploadedFiles(prev => [...prev, { 
                type: 'video', 
                url: res.filePath || res.url, 
                fullUrl: res.url, 
                name: res.name 
            }])
            toast.success('Video uploaded successfully')
        }
    }

    const handleUploadError = (err) => {
        console.error('Upload error:', err)
        toast.error('Failed to upload file')
    }

    const authenticator = async () => {
        try {
            const response = await fetch('/api/imagekit/auth')
            if (!response.ok) throw new Error('Auth failed')
            const data = await response.json()
            const { signature, expire, token } = data
            return { signature, expire, token }
        } catch (error) {
            throw new Error(`Authentication request failed: ${error.message}`)
        }
    }

    const removeFile = (index) => {
        setUploadedFiles(prev => prev.filter((_, i) => i !== index))
    }

    const handleSendMessage = async () => {
        if (!inputValue.trim() && uploadedFiles.length === 0) return

        const userMessage = {
            id: Date.now(),
            text: inputValue,
            sender: 'user',
            timestamp: new Date(),
            files: uploadedFiles,
            orderContext: selectedOrder
        }

        const updatedMessages = [...messages, userMessage]
        setMessages(updatedMessages)
        setInputValue('')
        setUploadedFiles([])
        setIsLoading(true)

        try {
            // Build context for AI
            const context = {
                orderDetails: selectedOrder ? {
                    orderId: selectedOrder.id,
                    total: selectedOrder.total,
                    items: selectedOrder.items,
                    status: selectedOrder.status,
                    date: selectedOrder.createdAt
                } : null,
                userMessage: inputValue,
                files: uploadedFiles,
                conversationHistory: messages.slice(-5) // Last 5 messages for context
            }

            const res = await fetch('/api/support/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    email: userEmail
                },
                body: JSON.stringify(context)
            })

            const data = await res.json()
            
            if (res.ok) {
                const botMessage = {
                    id: Date.now() + 1,
                    text: data.response,
                    sender: 'bot',
                    timestamp: new Date()
                }
                const finalMessages = [...updatedMessages, botMessage]
                setMessages(finalMessages)
                saveConversationHistory(finalMessages)
            } else {
                throw new Error(data.error || 'Failed to get response')
            }
        } catch (error) {
            console.error('Error:', error)
            toast.error('Failed to send message')
        } finally {
            setIsLoading(false)
        }
    }

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSendMessage()
        }
    }

    const formatTimestamp = (date) => {
        return new Date(date).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    if (!session) {
        return null
    }

    return (
        <div className="min-h-screen relative overflow-hidden">
            <Pattern />
            
            <div className="relative z-10 min-h-screen flex flex-col">
                {/* Header */}
                <div className="bg-white/90 backdrop-blur-md border-b border-emerald-200 shadow-sm">
                    <div className="container mx-auto px-6 py-3 flex items-center justify-between">
                        <button
                            onClick={() => router.back()}
                            className="flex items-center gap-2 text-slate-700 hover:text-emerald-600 transition"
                        >
                            <ArrowLeft size={20} />
                            <span>Back</span>
                        </button>
                        <h1 className="text-2xl font-bold text-slate-800">CrashKart Support</h1>
                        <button
                            onClick={resetChat}
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white rounded-lg transition shadow-sm text-sm font-medium"
                            title="Reset conversation"
                        >
                            <X size={16} />
                            <span>Reset Chat</span>
                        </button>
                    </div>
                </div>

                {/* Order Selector Modal */}
                {showOrderSelector && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                        <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden border border-pink-200">
                            <CandyFlossPattern />
                            <div className="relative z-10 bg-gradient-to-r from-pink-500 to-purple-500 p-6">
                                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                                    <Package size={28} />
                                    Select Your Order
                                </h2>
                                <p className="text-pink-50 mt-2">Choose an order to get support for, or skip to ask a general question</p>
                            </div>
                            
                            <div className="relative z-10 p-6 space-y-4 max-h-96 overflow-y-auto">
                                {loadingOrders ? (
                                    <div className="text-center py-8">
                                        <AuroraLoader />
                                        <p className="text-slate-600">Loading your orders...</p>
                                    </div>
                                ) : userOrders.length === 0 ? (
                                    <div className="text-center py-8">
                                        <p className="text-slate-600">No orders found</p>
                                        <button
                                            onClick={() => setShowOrderSelector(false)}
                                            className="mt-4 px-6 py-2 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white rounded-lg transition"
                                        >
                                            Continue without order
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        {userOrders.map(order => (
                                            <button
                                                key={order.id}
                                                onClick={() => handleOrderSelect(order)}
                                                className="relative w-full p-4 bg-white hover:bg-pink-50 rounded-xl border border-pink-200 hover:border-pink-400 transition text-left group overflow-hidden shadow-sm"
                                            >
                                                <CandyFlossPattern />
                                                <div className="relative z-10 flex items-center justify-between">
                                                    <div>
                                                        <p className="font-semibold text-slate-800 group-hover:text-pink-600 transition">
                                                            Order #{order.id}
                                                        </p>
                                                        <p className="text-sm text-slate-600">
                                                            {order.items.length} items • ₹{order.total}
                                                        </p>
                                                        <p className="text-xs text-slate-500 mt-1">
                                                            {new Date(order.createdAt).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                                            order.status === 'Delivered' ? 'bg-green-100 text-green-700' :
                                                            order.status === 'Shipped' ? 'bg-blue-100 text-blue-700' :
                                                            order.status === 'Processing' ? 'bg-yellow-100 text-yellow-700' :
                                                            'bg-slate-100 text-slate-700'
                                                        }`}>
                                                            {order.status}
                                                        </span>
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                        <button
                                            onClick={() => setShowOrderSelector(false)}
                                            className="w-full p-3 bg-white hover:bg-pink-50 rounded-lg border border-pink-200 text-slate-700 hover:text-pink-600 transition text-center shadow-sm"
                                        >
                                            Skip - Ask general question
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Chat Container */}
                <div className="flex-1 w-full px-6 py-4">
                    <div className="relative bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-pink-200 h-[calc(100vh-120px)] flex flex-col overflow-hidden">
                        <CandyFlossPattern />
                        {/* Selected Order Banner */}
                        {selectedOrder && (
                            <div className="relative z-10 bg-gradient-to-r from-pink-100 to-purple-100 border-b border-pink-200 p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Package size={20} className="text-pink-600" />
                                        <div>
                                            <p className="text-sm text-pink-700 font-semibold">Order #{selectedOrder.id}</p>
                                            <p className="text-xs text-slate-600">{selectedOrder.items.length} items • ₹{selectedOrder.total}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setShowOrderSelector(true)}
                                        className="text-xs text-purple-600 hover:text-purple-700 transition font-medium"
                                    >
                                        Change Order
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Messages */}
                        <div className="relative z-10 flex-1 overflow-y-auto p-6 pt-8 space-y-4">
                            {messages.map((message) => (
                                <div
                                    key={message.id}
                                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`relative overflow-hidden max-w-[80%] ${
                                        message.sender === 'user'
                                            ? 'bg-gradient-to-br from-pink-500 to-purple-500'
                                            : 'bg-white border border-pink-200'
                                    } rounded-2xl p-4 shadow-lg`}>
                                        {message.sender === 'bot' && <CandyFlossPattern />}
                                        <div className={`relative z-10 whitespace-pre-wrap ${
                                            message.sender === 'user' ? 'text-white' : 'text-slate-800'
                                        }`}>
                                            {message.text.split('\n').map((line, idx) => {
                                                // Check if line contains a URL
                                                const urlMatch = line.match(/(https?:\/\/[^\s]+)/g)
                                                if (urlMatch) {
                                                    const parts = line.split(/(https?:\/\/[^\s]+)/)
                                                    return (
                                                        <p key={idx}>
                                                            {parts.map((part, partIdx) => {
                                                                if (part.match(/^https?:\/\//)) {
                                                                    return (
                                                                        <a
                                                                            key={partIdx}
                                                                            href={part}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="text-green-600 hover:text-green-700 underline font-medium"
                                                                        >
                                                                            {part}
                                                                        </a>
                                                                    )
                                                                }
                                                                return part
                                                            })}
                                                        </p>
                                                    )
                                                }
                                                return <p key={idx}>{line}</p>
                                            })}
                                        </div>
                                        
                                        {/* Display uploaded files */}
                                        {message.files && message.files.length > 0 && (
                                            <div className="relative z-10 mt-3 space-y-2">
                                                {message.files.map((file, idx) => (
                                                    <div key={idx} className="bg-black/10 rounded-lg p-2">
                                                        {file.type === 'image' ? (
                                                            <img
                                                                src={file.fullUrl || `${urlEndpoint}${file.url}`}
                                                                alt={file.name}
                                                                className="rounded-lg w-full max-w-[200px] h-auto"
                                                                onError={(e) => {
                                                                    console.error('Failed to load image:', file)
                                                                    e.target.style.display = 'none'
                                                                }}
                                                            />
                                                        ) : (
                                                            <div className="flex items-center gap-2">
                                                                <Video size={16} className="text-purple-600" />
                                                                <span className="text-sm text-purple-600">{file.name}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        
                                        <p className={`relative z-10 text-xs mt-2 ${
                                            message.sender === 'user' ? 'text-white/70' : 'text-slate-500'
                                        }`}>{formatTimestamp(message.timestamp)}</p>
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className="relative overflow-hidden bg-white border border-pink-200 rounded-2xl p-4">
                                        <CandyFlossPattern />
                                        <div className="relative z-10">
                                            <AuroraLoader />
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Uploaded Files Preview */}
                        {uploadedFiles.length > 0 && (
                            <div className="relative z-10 border-t border-pink-200 p-4 bg-gradient-to-r from-pink-50 to-purple-50">
                                <p className="text-xs font-semibold text-pink-700 mb-2 flex items-center gap-2">
                                    <ImagePlus size={16} />
                                    {uploadedFiles.length} file(s) ready to send
                                </p>
                                <div className="flex gap-2 overflow-x-auto">
                                    {uploadedFiles.map((file, idx) => (
                                        <div key={idx} className="relative bg-white border-2 border-pink-300 rounded-lg p-2 flex-shrink-0 shadow-sm">
                                            {file.type === 'image' ? (
                                                <img
                                                    src={file.fullUrl || `${urlEndpoint}${file.url}`}
                                                    alt={file.name}
                                                    className="rounded w-20 h-20 object-cover"
                                                    onError={(e) => {
                                                        console.error('Failed to load image preview:', file)
                                                        e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="80" height="80"%3E%3Crect fill="%23f3f4f6" width="80" height="80"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" fill="%239ca3af" font-size="12"%3EImage%3C/text%3E%3C/svg%3E'
                                                    }}
                                                />
                                            ) : (
                                                <div className="w-20 h-20 flex items-center justify-center bg-purple-50">
                                                    <Video size={32} className="text-purple-500" />
                                                </div>
                                            )}
                                            <button
                                                onClick={() => removeFile(idx)}
                                                className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-md transition"
                                                title="Remove file"
                                            >
                                                <X size={14} />
                                            </button>
                                            <p className="text-xs text-slate-600 mt-1 text-center truncate w-20" title={file.name}>
                                                {file.name}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Input Area */}
                        <div className="relative z-10 border-t border-pink-200 p-4 bg-white">
                            <IKContext
                                publicKey={publicKey}
                                urlEndpoint={urlEndpoint}
                                authenticator={authenticator}
                            >
                                <div className="flex items-end gap-2">
                                    <div className="flex gap-2">
                                        {/* Image Upload */}
                                        <IKUpload
                                            fileName="support-image.jpg"
                                            folder="/support"
                                            onError={handleUploadError}
                                            onSuccess={handleImageUpload}
                                            ref={ikUploadImageRef}
                                            style={{ display: 'none' }}
                                            accept="image/*"
                                        />
                                        <button
                                            onClick={() => ikUploadImageRef.current?.click()}
                                            className="p-3 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white rounded-xl transition shadow-sm group relative"
                                            title="Upload Image (Recommended for product issues)"
                                        >
                                            <ImagePlus size={20} />
                                            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1 bg-slate-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition whitespace-nowrap pointer-events-none">
                                                📷 Upload photos
                                            </span>
                                        </button>

                                        {/* Video Upload */}
                                        <IKUpload
                                            fileName="support-video.mp4"
                                            folder="/support"
                                            onError={handleUploadError}
                                            onSuccess={handleVideoUpload}
                                            ref={ikUploadVideoRef}
                                            style={{ display: 'none' }}
                                            accept="video/*"
                                        />
                                        <button
                                            onClick={() => ikUploadVideoRef.current?.click()}
                                            className="p-3 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white rounded-xl transition shadow-sm group relative"
                                            title="Upload Video (Show the issue in action)"
                                        >
                                            <Video size={20} />
                                            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1 bg-slate-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition whitespace-nowrap pointer-events-none">
                                                🎥 Upload videos
                                            </span>
                                        </button>
                                    </div>

                                    <textarea
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                        onKeyPress={handleKeyPress}
                                        placeholder="Type your message... (Shift+Enter for new line)"
                                        className="flex-1 bg-pink-50 text-slate-800 border border-pink-200 rounded-xl px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-pink-400 placeholder-slate-400"
                                        rows="2"
                                    />

                                    <button
                                        onClick={handleSendMessage}
                                        disabled={isLoading || (!inputValue.trim() && uploadedFiles.length === 0)}
                                        className="p-3 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 disabled:from-slate-300 disabled:to-slate-400 text-white rounded-xl transition disabled:cursor-not-allowed shadow-sm"
                                    >
                                        <Send size={20} />
                                    </button>
                                </div>
                            </IKContext>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
