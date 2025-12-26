'use client'
import { useState, useRef } from 'react'
import ChatbotEnhanced from './ChatbotEnhanced'
import FloatingActionMenu from './FloatingActionMenu'

const ChatSupport = () => {
    const [isChatOpen, setIsChatOpen] = useState(false)

    const handleHelpDeskClick = () => {
        setIsChatOpen(true)
    }

    return (
        <>
            {/* Chatbot */}
            <ChatbotEnhanced isOpen={isChatOpen} onToggle={setIsChatOpen} />
            
            {/* Floating Action Menu with Help Desk Animation */}
            <FloatingActionMenu onHelpDeskClick={handleHelpDeskClick} />
        </>
    )
}

export default ChatSupport
