'use client'
import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import HelpDeskAnimation from './animations/HelpDeskAnimation'
import { TypingAnimation } from './TypingAnimation'

const ChatbotEnhanced = ({ externalIsOpen, onToggle }) => {
    const [internalIsOpen, setInternalIsOpen] = useState(false)
    
    // Use external state if provided, otherwise use internal state
    const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen
    const setIsOpen = onToggle || setInternalIsOpen
    const [messages, setMessages] = useState([
        {
            id: 1,
            text: "Hello! Welcome to CrashKart Customer Support. I'm here to help you with any queries about your orders, products, or services. How can I assist you today?",
            sender: 'bot',
            timestamp: new Date()
        }
    ])
    const [inputValue, setInputValue] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [currentPlaceholder, setCurrentPlaceholder] = useState(0)
    const messagesEndRef = useRef(null)

    const placeholders = [
        "Track my order...",
        "Return process...",
        "Shipping info...",
        "Payment issues...",
        "Need help?...",
        "Ask me anything..."
    ]

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentPlaceholder((prev) => (prev + 1) % placeholders.length)
        }, 3000)
        return () => clearInterval(interval)
    }, [])

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    const quickReplies = [
        { id: 1, text: "Track my order" },
        { id: 2, text: "Return process" },
        { id: 3, text: "Shipping info" },
        { id: 4, text: "Payment issues" }
    ]

    const handleSendMessage = async (messageText) => {
        const text = messageText || inputValue.trim()
        
        if (!text) return

        // Add user message
        const userMessage = {
            id: messages.length + 1,
            text: text,
            sender: 'user',
            timestamp: new Date()
        }

        setMessages(prev => [...prev, userMessage])
        setInputValue('')
        setIsLoading(true)

        try {
            // Call the chatbot API
            const response = await fetch('/api/chatbot', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: text
                })
            })

            const data = await response.json()

            if (data.success) {
                // Add bot response
                const botMessage = {
                    id: messages.length + 2,
                    text: data.response || "I'm here to help. Could you please provide more details?",
                    sender: 'bot',
                    timestamp: new Date()
                }
                setMessages(prev => [...prev, botMessage])
            } else {
                // Fallback response if API fails
                const botMessage = {
                    id: messages.length + 2,
                    text: data.response || "I apologize for the inconvenience. Our team will get back to you shortly. Please email us at crashkart.help@gmail.com or call our hotline for immediate assistance.",
                    sender: 'bot',
                    timestamp: new Date()
                }
                setMessages(prev => [...prev, botMessage])
            }
        } catch (error) {
            console.error('Chatbot error:', error)
            const botMessage = {
                id: messages.length + 2,
                text: "I'm temporarily unavailable. Please contact our support team at crashkart.help@gmail.com or call 1-800-CRASH-KART.",
                sender: 'bot',
                timestamp: new Date()
            }
            setMessages(prev => [...prev, botMessage])
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <>
            {/* Chatbot Button - Help Desk Animation Only */}
            <motion.button
                onClick={() => setIsOpen(!isOpen)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="fixed bottom-6 right-6 z-40 flex items-center justify-center cursor-pointer"
                style={{ background: 'transparent', border: 'none', padding: 0 }}
                aria-label="Open chat support"
            >
                {!isOpen ? (
                    <HelpDeskAnimation width="120px" height="120px" />
                ) : (
                    <X size={40} />
                )}
            </motion.button>

            {/* Chatbot Window - Enhanced */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="fixed bottom-24 right-6 w-96 max-w-[calc(100vw-32px)] bg-white rounded-2xl shadow-2xl flex flex-col z-40 max-h-[600px] h-[600px] overflow-hidden"
                    >
                        {/* Header - Enhanced */}
                        <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white p-4 rounded-t-2xl">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <motion.div
                                        animate={{ scale: [1, 1.2, 1] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                        className="w-8 h-8 bg-white rounded-full flex items-center justify-center"
                                    >
                                        <MessageCircle size={16} className="text-blue-600" />
                                    </motion.div>
                                    <div>
                                        <h3 className="font-semibold">INQUIARE by Fahad Khan</h3>
                                        <p className="text-xs text-blue-100">CrashKart Support • Typically replies instantly</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="hover:bg-blue-700/50 p-1 rounded transition"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-blue-50 to-white space-y-4">
                            {messages.map((message, index) => (
                                <motion.div
                                    key={message.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-xs px-4 py-2 rounded-lg ${
                                            message.sender === 'user'
                                                ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-br-none shadow-md'
                                                : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none shadow-sm'
                                        }`}
                                    >
                                        {message.sender === 'bot' ? (
                                            <TypingAnimation
                                                as="p"
                                                className="text-sm"
                                                typeSpeed={30}
                                                showCursor={false}
                                                startOnView={true}
                                            >
                                                {message.text}
                                            </TypingAnimation>
                                        ) : (
                                            <p className="text-sm">{message.text}</p>
                                        )}
                                        <p className={`text-xs mt-1 ${
                                            message.sender === 'user' ? 'text-blue-100' : 'text-slate-500'
                                        }`}>
                                            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </motion.div>
                            ))}
                            {isLoading && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="flex justify-start"
                                >
                                    <div className="bg-white text-slate-800 border border-slate-200 rounded-lg rounded-bl-none px-4 py-2 shadow-sm">
                                        <div className="flex gap-2">
                                            <motion.div
                                                animate={{ y: [0, -8, 0] }}
                                                transition={{ duration: 0.6, repeat: Infinity }}
                                                className="w-2 h-2 bg-blue-600 rounded-full"
                                            />
                                            <motion.div
                                                animate={{ y: [0, -8, 0] }}
                                                transition={{ duration: 0.6, repeat: Infinity, delay: 0.1 }}
                                                className="w-2 h-2 bg-blue-600 rounded-full"
                                            />
                                            <motion.div
                                                animate={{ y: [0, -8, 0] }}
                                                transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                                                className="w-2 h-2 bg-blue-600 rounded-full"
                                            />
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Quick Replies */}
                        <AnimatePresence>
                            {messages.length === 1 && !isLoading && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    className="border-t border-slate-200 p-3 bg-blue-50"
                                >
                                    <p className="text-xs text-slate-600 mb-2 font-medium">Quick Help:</p>
                                    <div className="grid grid-cols-2 gap-2">
                                        {quickReplies.map((reply, index) => (
                                            <motion.button
                                                key={reply.id}
                                                initial={{ opacity: 0, scale: 0.8 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ delay: index * 0.05 }}
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => handleSendMessage(reply.text)}
                                                className="text-xs bg-white border border-slate-300 hover:border-blue-500 hover:bg-blue-50 text-slate-700 px-3 py-2 rounded transition"
                                            >
                                                {reply.text}
                                            </motion.button>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Input Area - Enhanced with Vanish Effect */}
                        <div className="border-t border-slate-200 p-4 bg-white rounded-b-2xl">
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault()
                                    handleSendMessage()
                                }}
                                className="flex gap-2"
                            >
                                <div className="flex-1 relative">
                                    <input
                                        type="text"
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                        placeholder={placeholders[currentPlaceholder]}
                                        className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100 transition-all"
                                        disabled={isLoading}
                                    />
                                    {/* Placeholder animation indicator */}
                                    <motion.div
                                        animate={{ opacity: [0.3, 1, 0.3] }}
                                        transition={{ duration: 3, repeat: Infinity }}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400"
                                    >
                                        •
                                    </motion.div>
                                </div>
                                <motion.button
                                    type="submit"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    disabled={isLoading || !inputValue.trim()}
                                    className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 disabled:from-slate-400 disabled:to-slate-400 text-white p-2 rounded-lg transition"
                                >
                                    <Send size={18} />
                                </motion.button>
                            </form>
                            <p className="text-xs text-slate-500 mt-2">Powered by INQUIARE AI (BY FAHAD KHAN) • Customer Care Expert</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Overlay when chat is open */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsOpen(false)}
                        className="fixed inset-0 bg-black/20 z-30 hidden sm:block"
                    />
                )}
            </AnimatePresence>
        </>
    )
}

export default ChatbotEnhanced
