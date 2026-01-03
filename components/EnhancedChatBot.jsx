'use client'
import { useState, useRef, useEffect } from 'react'
import { Send, Upload, Image as ImageIcon, Video, Paperclip, AlertCircle, CheckCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import MediaPlayer from './MediaPlayer'

export default function EnhancedChatBot() {
    const [messages, setMessages] = useState([])
    const [inputText, setInputText] = useState('')
    const [mediaFile, setMediaFile] = useState(null)
    const [uploading, setUploading] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [selectedOrder, setSelectedOrder] = useState(null)
    const [orders, setOrders] = useState([])
    const [fileError, setFileError] = useState('')
    const messagesEndRef = useRef(null)

    useEffect(() => {
        // Fetch user orders
        fetchOrders()
    }, [])

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const fetchOrders = async () => {
        try {
            const response = await fetch('/api/orders/get-user-orders', {
                credentials: 'include'
            })
            const data = await response.json()
            if (data.success && data.orders) {
                setOrders(data.orders)
            }
        } catch (error) {
            console.error('Error fetching orders:', error)
        }
    }

    const validateFile = (file) => {
        setFileError('')

        // Check file size (10MB max)
        if (file.size > 10 * 1024 * 1024) {
            setFileError('File size exceeds 10MB limit')
            return false
        }

        // Check file type
        const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
        const allowedVideoTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo']

        if (file.type.startsWith('image/')) {
            if (!allowedImageTypes.includes(file.type)) {
                setFileError('Image format not supported. Use JPG, PNG, GIF, or WebP')
                return false
            }
        } else if (file.type.startsWith('video/')) {
            if (!allowedVideoTypes.includes(file.type)) {
                setFileError('Video format not supported. Use MP4, MOV, or AVI')
                return false
            }
        } else {
            setFileError('Only images and videos are supported')
            return false
        }

        // Check video duration for videos
        if (file.type.startsWith('video/')) {
            const video = document.createElement('video')
            video.onloadedmetadata = () => {
                if (video.duration > 120) {
                    setFileError('Video must be 2 minutes or less')
                    setMediaFile(null)
                }
            }
            video.src = URL.createObjectURL(file)
        }

        return true
    }

    const handleFileSelect = (e) => {
        const file = e.target.files?.[0]
        if (file && validateFile(file)) {
            setMediaFile(file)
        }
    }

    const uploadFile = async (file) => {
        try {
            const formData = new FormData()
            formData.append('file', file)
            formData.append('fileName', `chatbot_${Date.now()}_${file.name}`)

            const response = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${btoa(process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY + ':')}`
                },
                body: formData
            })

            if (response.ok) {
                const data = await response.json()
                return data.url
            } else {
                throw new Error('Upload failed')
            }
        } catch (error) {
            console.error('Upload error:', error)
            setError('Failed to upload media')
            return null
        }
    }

    const getVideoDuration = (file) => {
        return new Promise((resolve) => {
            const video = document.createElement('video')
            video.onloadedmetadata = () => {
                resolve(Math.floor(video.duration))
            }
            video.onerror = () => {
                resolve(0)
            }
            video.src = URL.createObjectURL(file)
        })
    }

    const handleSendMessage = async () => {
        if (!inputText.trim() && !mediaFile) {
            setError('Enter a message or select a file')
            return
        }

        setLoading(true)
        setError('')

        try {
            let mediaUrl = null
            let mediaType = null
            let mediaDuration = null

            // Upload media if selected
            if (mediaFile) {
                setUploading(true)
                mediaUrl = await uploadFile(mediaFile)
                if (!mediaUrl) {
                    setLoading(false)
                    return
                }

                mediaType = mediaFile.type
                if (mediaFile.type.startsWith('video/')) {
                    mediaDuration = await getVideoDuration(mediaFile)
                }
            }

            // Add user message to chat
            const userMessage = {
                id: Date.now(),
                text: inputText,
                mediaUrl,
                mediaType,
                mediaDuration,
                sender: 'user',
                timestamp: new Date()
            }

            setMessages(prev => [...prev, userMessage])

            // Save message to database
            const response = await fetch('/api/chatbot/send-message', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: inputText,
                    messageType: mediaUrl ? (mediaFile?.type.startsWith('video/') ? 'video' : 'image') : 'text',
                    mediaUrl,
                    mediaType,
                    mediaDuration,
                    orderId: selectedOrder
                })
            })

            const data = await response.json()

            if (data.success) {
                // Add bot response
                const botMessage = {
                    id: Date.now() + 1,
                    text: data.response || 'Your message has been received. Our support team will contact you soon.',
                    sender: 'bot',
                    timestamp: new Date()
                }
                setMessages(prev => [...prev, botMessage])

                // Reset form
                setInputText('')
                setMediaFile(null)
            } else {
                setError(data.error || 'Failed to send message')
            }
        } catch (error) {
            console.error('Error sending message:', error)
            setError('Failed to send message. Please try again.')
        } finally {
            setLoading(false)
            setUploading(false)
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden h-[600px] flex flex-col border border-slate-200 dark:border-slate-700"
        >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4">
                <h3 className="font-bold text-lg">Support Chat</h3>
                <p className="text-sm text-blue-100">Ask questions or report issues with images & videos</p>
            </div>

            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-slate-500 dark:text-slate-400 text-center">
                        <div>
                            <p className="mb-2">👋 Hello! How can we help you today?</p>
                            <p className="text-sm">You can send messages, images, or videos (max 2 min)</p>
                        </div>
                    </div>
                ) : (
                    <>
                        {messages.map((msg) => (
                            <motion.div
                                key={msg.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-xs lg:max-w-md xl:max-w-lg ${
                                        msg.sender === 'user'
                                            ? 'bg-blue-600 text-white rounded-3xl rounded-tr-none'
                                            : 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white rounded-3xl rounded-tl-none'
                                    } p-4 space-y-2`}
                                >
                                    {msg.text && <p className="text-sm">{msg.text}</p>}

                                    {/* Media Display */}
                                    {msg.mediaUrl && (
                                        <div className="mt-2">
                                            <MediaPlayer
                                                mediaUrl={msg.mediaUrl}
                                                mediaType={msg.mediaType}
                                                mediaDuration={msg.mediaDuration}
                                                title={msg.mediaType?.startsWith('video/') ? 'Attached Video' : 'Attached Image'}
                                            />
                                        </div>
                                    )}

                                    <p className={`text-xs ${msg.sender === 'user' ? 'text-blue-100' : 'text-slate-500 dark:text-slate-400'}`}>
                                        {msg.timestamp?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                        <div ref={messagesEndRef} />
                    </>
                )}
            </div>

            {/* Media Preview & Error */}
            {(mediaFile || fileError) && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="px-4 py-2 bg-slate-50 dark:bg-slate-700 border-t border-slate-200 dark:border-slate-600"
                >
                    {mediaFile && (
                        <div className="flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                            <div className="flex items-center gap-2">
                                {mediaFile.type.startsWith('video/') ? (
                                    <Video size={18} className="text-blue-600 dark:text-blue-400" />
                                ) : (
                                    <ImageIcon size={18} className="text-blue-600 dark:text-blue-400" />
                                )}
                                <span className="text-sm text-blue-700 dark:text-blue-300 truncate">
                                    {mediaFile.name}
                                </span>
                            </div>
                            <button
                                onClick={() => setMediaFile(null)}
                                className="text-red-600 hover:text-red-700"
                            >
                                ✕
                            </button>
                        </div>
                    )}
                    {fileError && (
                        <div className="flex items-center gap-2 p-2 bg-red-50 dark:bg-red-900/30 rounded-lg text-red-700 dark:text-red-300 text-sm">
                            <AlertCircle size={16} />
                            {fileError}
                        </div>
                    )}
                </motion.div>
            )}

            {/* Input Area */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-700 space-y-3">
                {/* Order Selection */}
                {orders.length > 0 && (
                    <div className="text-xs">
                        <label className="text-slate-600 dark:text-slate-400 font-medium">Related Order (Optional):</label>
                        <select
                            value={selectedOrder || ''}
                            onChange={(e) => setSelectedOrder(e.target.value)}
                            className="w-full mt-1 p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">No specific order</option>
                            {orders.map(order => (
                                <option key={order.id} value={order.id}>
                                    Order #{order.id.slice(-8)} - ₹{order.total}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div className="flex items-center gap-2 p-2 bg-red-50 dark:bg-red-900/30 rounded text-red-700 dark:text-red-300 text-sm">
                        <AlertCircle size={14} />
                        {error}
                    </div>
                )}

                {/* Message Input */}
                <div className="flex gap-2">
                    <textarea
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && e.ctrlKey) {
                                handleSendMessage()
                            }
                        }}
                        placeholder="Type a message... (Ctrl+Enter to send)"
                        rows={2}
                        className="flex-1 p-3 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
                    />

                    <div className="flex flex-col gap-2">
                        {/* Media Upload Button */}
                        <label className="relative">
                            <input
                                type="file"
                                accept="image/*,video/*"
                                onChange={handleFileSelect}
                                disabled={uploading || loading}
                                className="hidden"
                            />
                            <button
                                disabled={uploading || loading}
                                className="p-3 bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 disabled:opacity-50 text-slate-700 dark:text-white rounded-lg transition"
                                title="Upload image or video (max 2 min)"
                            >
                                <Upload size={18} />
                            </button>
                        </label>

                        {/* Send Button */}
                        <button
                            onClick={handleSendMessage}
                            disabled={loading || uploading}
                            className="p-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition"
                            title="Send message"
                        >
                            {loading || uploading ? (
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            ) : (
                                <Send size={18} />
                            )}
                        </button>
                    </div>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
                    📎 Images & videos (max 10MB, videos max 2 min)
                </p>
            </div>
        </motion.div>
    )
}
