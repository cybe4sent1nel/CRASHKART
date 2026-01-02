'use client'
import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import toast from 'react-hot-toast'

function GoogleCallbackContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [error, setError] = useState(null)

    useEffect(() => {
        const handleCallback = async () => {
            const code = searchParams.get('code')
            const error = searchParams.get('error')

            if (error) {
                toast.error('Google authentication failed')
                router.push('/login')
                return
            }

            if (!code) {
                toast.error('No authorization code received')
                router.push('/login')
                return
            }

            try {
                // Exchange code for tokens via server-side API (keeps client_secret secure)
                const tokenResponse = await fetch('/api/auth/google/callback', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ code })
                })

                if (!tokenResponse.ok) {
                    const error = await tokenResponse.json()
                    throw new Error(error.error || 'Failed to exchange code for tokens')
                }

                const { user: userInfo, accessToken } = await tokenResponse.json()

                // Send to your backend
                const response = await fetch('/api/auth/google', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        googleId: userInfo.id,
                        email: userInfo.email,
                        name: userInfo.name,
                        image: userInfo.picture
                    })
                })

                const data = await response.json()

                if (!response.ok) {
                    throw new Error(data.error || 'Authentication failed')
                }

                // Store user and token
                localStorage.setItem('user', JSON.stringify(data.user))
                localStorage.setItem('token', data.token)
                
                if (data.user.crashCashBalance !== undefined) {
                    localStorage.setItem('crashCashBalance', data.user.crashCashBalance.toString())
                }

                // Trigger storage event
                window.dispatchEvent(new Event('storage'))
                window.dispatchEvent(new Event('profileUpdated'))
                window.dispatchEvent(new Event('crashcash-update'))

                toast.success('Successfully signed in with Google!')

                // Redirect
                if (data.requiresProfileSetup) {
                    router.push('/profile-setup')
                } else {
                    router.push('/')
                }

            } catch (err) {
                console.error('Google callback error:', err)
                setError(err.message)
                toast.error(err.message || 'Failed to complete Google sign-in')
                setTimeout(() => router.push('/login'), 2000)
            }
        }

        handleCallback()
    }, [searchParams, router])

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-red-600 mb-4">Authentication Failed</h1>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <p className="text-sm text-gray-500">Redirecting to login...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-red-600 mx-auto mb-4"></div>
                <h2 className="text-xl font-semibold text-gray-800 mb-2">Completing Google Sign-In</h2>
                <p className="text-gray-600">Please wait...</p>
            </div>
        </div>
    )
}

export default function GoogleCallback() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-red-600 mx-auto mb-4"></div>
                    <h2 className="text-xl font-semibold text-gray-800 mb-2">Loading...</h2>
                </div>
            </div>
        }>
            <GoogleCallbackContent />
        </Suspense>
    )
}
