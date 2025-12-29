'use client'
import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send } from 'lucide-react'
import Image from 'next/image'

const ChatbotSupport = ({ apiKey = process.env.NEXT_PUBLIC_CHATBOT_API_KEY }) => {
    const [isOpen, setIsOpen] = useState(false)
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
    const messagesEndRef = useRef(null)

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
                    message: text,
                    apiKey: apiKey || process.env.NEXT_PUBLIC_CHATBOT_API_KEY
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
            {/* Chatbot Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg transition-all duration-300 z-40 flex items-center justify-center"
                aria-label="Open chat support"
            >
                {isOpen ? (
                    <X size={20} />
                ) : (
                    <MessageCircle size={20} />
                )}
            </button>

            {/* Chatbot Window */}
            {isOpen && (
                <div className="fixed bottom-24 right-6 w-96 max-w-[calc(100vw-32px)] bg-white rounded-lg shadow-2xl flex flex-col z-40 max-h-[600px] h-[600px]">
                    {/* Header */}
                    <div className="bg-blue-600 text-white p-4 rounded-t-lg">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                                    <MessageCircle size={16} className="text-blue-600" />
                                </div>
                                <div>
                                    <h3 className="font-semibold">CrashKart Support</h3>
                                    <p className="text-xs text-blue-100">Typically replies instantly</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="hover:bg-blue-700 p-1 rounded transition"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                        <div className="space-y-4">
                            {messages.map(message => (
                                <div
                                    key={message.id}
                                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-xs px-4 py-2 rounded-lg ${
                                            message.sender === 'user'
                                                ? 'bg-blue-600 text-white rounded-br-none'
                                                : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'
                                        }`}
                                    >
                                        <p className="text-sm">{message.text}</p>
                                        <p className={`text-xs mt-1 ${
                                            message.sender === 'user' ? 'text-blue-100' : 'text-slate-500'
                                        }`}>
                                            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className="bg-white text-slate-800 border border-slate-200 rounded-lg rounded-bl-none px-4 py-2">
                                        <div className="flex gap-2">
                                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                    </div>

                    {/* Quick Replies */}
                    {messages.length === 1 && !isLoading && (
                        <div className="border-t border-slate-200 p-3 bg-gray-50">
                            <p className="text-xs text-slate-600 mb-2 font-medium">Quick Help:</p>
                            <div className="grid grid-cols-2 gap-2">
                                {quickReplies.map(reply => (
                                    <button
                                        key={reply.id}
                                        onClick={() => handleSendMessage(reply.text)}
                                        className="text-xs bg-white border border-slate-300 hover:border-blue-500 text-slate-700 px-3 py-2 rounded transition"
                                    >
                                        {reply.text}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Input Area */}
                    <div className="border-t border-slate-200 p-4 bg-white rounded-b-lg">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                placeholder="Type your message..."
                                className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                disabled={isLoading}
                            />
                            <button
                                onClick={() => handleSendMessage()}
                                disabled={isLoading || !inputValue.trim()}
                                className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white p-2 rounded-lg transition"
                            >
                                <Send size={18} />
                            </button>
                        </div>
                        <p className="text-xs text-slate-500 mt-2">Powered by INQUIARE AI (BY FAHAD KHAN) • Customer Care Expert</p>
                    </div>
                </div>
            )}
        </>
    )
}

export default ChatbotSupport
