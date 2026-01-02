'use client'
import { useSession } from 'next-auth/react'
import { useEffect } from 'react'
import { initializeUserProfile } from '@/lib/userDataStorage'

// Function to sync profile data to database
const syncProfileToDatabase = async (email, image, name) => {
        try {
            console.log('Starting profile sync for:', email)
            
            const response = await fetch('/api/auth/sync-profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email,
                    image: image || null,
                    name: name || ''
                })
            })

            const data = await response.json()

            if (response.ok) {
                console.log('Profile synced to database successfully:', data.user)
                
                // Update localStorage with database image if available
                if (data.user && data.user.image) {
                    const user = JSON.parse(localStorage.getItem('user') || '{}')
                    user.image = data.user.image
                    localStorage.setItem('user', JSON.stringify(user))
                    window.dispatchEvent(new Event('storage'))
                    console.log('localStorage updated with image')
                }
            } else {
                console.error('Failed to sync profile:', {
                    status: response.status,
                    message: data?.message,
                    error: data?.error
                })
            }
        } catch (error) {
            console.error('Error syncing profile to database:', {
                message: error.message,
                stack: error.stack
            })
        }
    }

export default function AuthSync() {
    const { data: session, status } = useSession()

    useEffect(() => {
        if (status === 'authenticated' && session?.user) {
            const upsertUser = async () => {
                // Get existing user data from localStorage
                const existingUser = localStorage.getItem('user')
                let userData = existingUser ? JSON.parse(existingUser) : {}

                // Merge session data with existing data as a base
                let mergedUser = {
                    ...userData,
                    id: session.user.id || session.user.email,
                    name: session.user.name || userData.name || '',
                    email: session.user.email || userData.email || '',
                    image: session.user.image || userData.image || '',
                    provider: session.user.provider || 'google',
                    isProfileSetup: true
                }

                // Ensure we have the real DB user (and token) for Google logins
                if (session.user.provider === 'google' || session.user.googleId) {
                    const googleId = session.user.googleId || session.user.id
                    try {
                        const response = await fetch('/api/auth/google', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                googleId,
                                email: session.user.email,
                                name: session.user.name,
                                image: session.user.image
                            })
                        })

                        if (response.ok) {
                            const data = await response.json()
                            mergedUser = {
                                ...mergedUser,
                                ...data.user,
                                provider: 'google',
                                googleId
                            }

                            if (data.token) {
                                localStorage.setItem('token', data.token)
                            }
                        } else {
                            console.error('Failed to sync Google user to backend:', response.status)
                        }
                    } catch (error) {
                        console.error('Error syncing Google user to backend:', error)
                    }
                }

                // Save to localStorage
                localStorage.setItem('user', JSON.stringify(mergedUser))

                // ✅ Sync CrashCash balance from database to localStorage
                if (mergedUser.id) {
                    try {
                        const balResp = await fetch(`/api/crashcash/balance?userId=${mergedUser.id}`)
                        if (balResp.ok) {
                            const balData = await balResp.json()
                            const dbBalance = balData.balance || 0
                            
                            // Update localStorage with database balance
                            localStorage.setItem('crashCashBalance', dbBalance.toString())
                            console.log(`✅ CrashCash balance synced from database: ₹${dbBalance}`)
                            
                            // Trigger balance update event
                            window.dispatchEvent(new Event('crashcash-update'))
                        } else {
                            console.warn('⚠️ Failed to fetch CrashCash balance from server')
                        }
                    } catch (balError) {
                        console.error('❌ Error syncing CrashCash balance:', balError)
                    }
                }

                // Initialize user profile data storage
                if (mergedUser.email) {
                    initializeUserProfile(mergedUser.email, mergedUser)
                }

                // Sync profile with database (especially for Google OAuth images)
                if (session.user.image || session.user.name) {
                    syncProfileToDatabase(
                        session.user.email,
                        session.user.image,
                        session.user.name
                    )
                }

                // Dispatch events to notify other components
                window.dispatchEvent(new Event('storage'))
                window.dispatchEvent(new Event('profileUpdated'))

                console.log('Auth synced: User profile created/updated', mergedUser.email)
            }

            upsertUser()
        }
    }, [session, status])

    return null // This component doesn't render anything
}
