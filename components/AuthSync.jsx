'use client'
import { useSession } from 'next-auth/react'
import { useEffect } from 'react'
import { initializeUserProfile } from '@/lib/userDataStorage'

export default function AuthSync() {
    const { data: session, status } = useSession()

    useEffect(() => {
        if (status === 'authenticated' && session?.user) {
            // Get existing user data from localStorage
            const existingUser = localStorage.getItem('user')
            let userData = existingUser ? JSON.parse(existingUser) : {}
            
            // Merge session data with existing data
            const updatedUser = {
                ...userData,
                id: session.user.id || session.user.email,
                name: session.user.name || userData.name || '',
                email: session.user.email || userData.email || '',
                image: session.user.image || userData.image || '',
                provider: session.user.provider || 'google',
                isProfileSetup: true
            }
            
            // Save to localStorage
            localStorage.setItem('user', JSON.stringify(updatedUser))
            
            // Initialize user profile data storage
            if (updatedUser.email) {
                initializeUserProfile(updatedUser.email, updatedUser)
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
            
            console.log('Auth synced: User profile created/updated', updatedUser.email)
        }
    }, [session, status])

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

    return null // This component doesn't render anything
}
