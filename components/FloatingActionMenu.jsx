'use client'
import React, { useState } from 'react'
import { MessageCircle, ShoppingCart, Heart, Home, Menu, X } from 'lucide-react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import HelpDeskAnimation from './animations/HelpDeskAnimation'

const FloatingActionMenu = ({ onHelpDeskClick }) => {
    const [isOpen, setIsOpen] = useState(false)

    const actions = [
        { icon: Home, label: 'Home', href: '/', color: 'bg-blue-500' },
        { icon: ShoppingCart, label: 'Shop', href: '/shop', color: 'bg-green-500' },
        { icon: Heart, label: 'Wishlist', href: '/wishlist', color: 'bg-red-500' },
    ]

    return (
        <>
            {/* Floating Menu */}
            <motion.div
                className='fixed bottom-8 right-8 z-50'
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 10 }}
            >
                {/* Menu Items */}
                <AnimatePresence>
                    {isOpen && (
                        <>
                            {actions.map((action, index) => (
                                <motion.div
                                    key={action.label}
                                    initial={{ opacity: 0, scale: 0, y: 0 }}
                                    animate={{
                                        opacity: 1,
                                        scale: 1,
                                        y: -80 - index * 70,
                                    }}
                                    exit={{ opacity: 0, scale: 0, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className='absolute bottom-0 right-0'
                                >
                                    <Link href={action.href}>
                                        <motion.div
                                            whileHover={{ scale: 1.2 }}
                                            whileTap={{ scale: 0.95 }}
                                            className={`${action.color} text-white p-4 rounded-full shadow-lg cursor-pointer hover:shadow-xl transition-shadow`}
                                            onClick={() => setIsOpen(false)}
                                        >
                                            <action.icon size={24} />
                                        </motion.div>
                                    </Link>
                                </motion.div>
                            ))}
                        </>
                    )}
                </AnimatePresence>

                {/* Main Toggle Button - Help Desk Animation */}
                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                        if (isOpen) {
                            setIsOpen(false)
                        } else {
                            // Trigger chatbot instead of opening menu
                            if (onHelpDeskClick) {
                                onHelpDeskClick()
                            }
                        }
                    }}
                    className='bg-gradient-to-r from-blue-500 to-cyan-500 text-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all relative z-10 flex items-center justify-center'
                >
                    {isOpen ? (
                        <X size={28} />
                    ) : (
                        <HelpDeskAnimation width="56px" height="56px" />
                    )}
                </motion.button>
            </motion.div>

            {/* Background Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsOpen(false)}
                        className='fixed inset-0 bg-black/20 z-40 hidden sm:block'
                    />
                )}
            </AnimatePresence>
        </>
    )
}

export default FloatingActionMenu
