'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { User, Mail, Phone, MapPin, Edit2, LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import ProfileImage from '@/components/ProfileImage'

export default function UserSidebar() {
    const router = useRouter()
    const [userData, setUserData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [userEmail, setUserEmail] = useState('')

    useEffect(() => {
        // Get user email from localStorage
        const email = typeof window !== 'undefined' ? localStorage.getItem('userEmail') : null
        if (email) {
            setUserEmail(email)
            fetchUserData(email)
        } else {
            setLoading(false)
        }
    }, [])

    const fetchUserData = async (email) => {
        try {
            const response = await fetch(`/api/user/profile?email=${encodeURIComponent(email)}`)
            if (response.ok) {
                const data = await response.json()
                setUserData(data)
            }
        } catch (error) {
            console.error('Error fetching user data:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="w-full max-w-sm bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-16 w-16 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
                    <div className="space-y-2">
                        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded"></div>
                        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-5/6"></div>
                    </div>
                </div>
            </div>
        )
    }

    if (!userData && !userEmail) return null

    const defaultAddress = userData?.Address?.[0]
    const userName = userData?.name || 'User'
    const userPhone = userData?.phone || ''

    return (
        <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-full max-w-sm bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden"
        >
            {/* Header */}
            <div className="bg-gradient-to-r from-red-500 to-orange-500 p-6 text-white">
                <div className="flex items-center gap-4">
                    <ProfileImage
                        src={userData?.image}
                        alt={userName}
                        name={userName}
                        className="w-16 h-16 rounded-full border-3 border-white"
                    />
                    <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold truncate">{userName}</h3>
                        <p className="text-xs text-white/80 truncate">{userEmail}</p>
                    </div>
                </div>
            </div>

            {/* Contact Info */}
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">Contact Information</h4>
                
                <div className="space-y-3">
                    {/* Email */}
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex-shrink-0">
                            <Mail className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-xs text-slate-500 dark:text-slate-400">Email</p>
                            <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate" title={userEmail}>
                                {userEmail || 'Not provided'}
                            </p>
                        </div>
                    </div>

                    {/* Phone */}
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg flex-shrink-0">
                            <Phone className="w-4 h-4 text-green-600 dark:text-green-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-xs text-slate-500 dark:text-slate-400">Phone</p>
                            <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate" title={userPhone}>
                                {userPhone || 'Not provided'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Default Address */}
            {defaultAddress && (
                <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                    <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">Default Address</h4>
                    
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex-shrink-0 mt-0.5">
                            <MapPin className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{defaultAddress.name}</p>
                            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">
                                {defaultAddress.street}
                            </p>
                            <p className="text-xs text-slate-600 dark:text-slate-400">
                                {defaultAddress.city}, {defaultAddress.state} {defaultAddress.zip}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-500 mt-1 flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {defaultAddress.phone}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Actions */}
            <div className="p-6 space-y-2">
                <Link
                    href="/profile"
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition"
                >
                    <Edit2 className="w-4 h-4" />
                    Edit Profile
                </Link>
            </div>
        </motion.div>
    )
}
