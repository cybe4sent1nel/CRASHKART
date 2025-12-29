'use client'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import NoddingOrange from './NoddingOrange'

const ChatbotEnhanced = () => {
    const router = useRouter()

    const handleClick = () => {
        router.push('/support')
    }

    return (
        <motion.button
            onClick={handleClick}
            className="fixed bottom-6 right-6 z-50 bg-transparent border-none p-0 cursor-pointer"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ 
                type: "spring", 
                stiffness: 260, 
                damping: 20,
                delay: 0.5 
            }}
            aria-label="Open support chat"
        >
            <div className="relative">
                <NoddingOrange width={150} height={150} />
                <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 rounded-full animate-pulse border-2 border-white"></span>
            </div>
        </motion.button>
    )
}

export default ChatbotEnhanced
