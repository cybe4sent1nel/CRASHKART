'use client'
import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { AlertCircle } from 'lucide-react'

function AuthErrorContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  const errorMessages = {
    'access_denied': 'Access denied by Google. Please try again or contact support.',
    'oauth_signin_failed': 'Failed to sign in with Google. Please try again.',
    'oauthsignin': 'Failed to sign in with Google. Please try again.',
    'oauthcallback': 'OAuth callback failed. Please try again.',
    'oauthaccountnotlinked': 'Email already exists with a different provider.',
    'emailcreateaccount': 'Could not create account. Please try again.',
    'callback': 'Callback error during sign in. Please try again.',
    'provider': 'Provider error. Please try again.',
    'signout': 'Error signing out. Please try again.',
    'default': 'An authentication error occurred. Please try again.'
  }

  const message = errorMessages[error?.toLowerCase()] || errorMessages.default

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[rgb(241,241,130)] via-[rgb(255,250,150)] to-white p-4">
      <div className="w-full max-w-md bg-white rounded-3xl border-2 border-[rgb(0,2,65)] p-8 shadow-xl">
        <div className="flex justify-center mb-6">
          <div className="bg-red-100 p-4 rounded-full">
            <AlertCircle size={32} className="text-red-600" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-[rgb(0,2,65)] text-center mb-2">
          Authentication Error
        </h1>

        {error && (
          <p className="text-xs text-center text-gray-500 mb-4 font-mono">
            Error: {error}
          </p>
        )}

        <p className="text-center text-[rgba(0,2,65,0.8)] mb-6">
          {message}
        </p>

        <div className="flex flex-col gap-3">
          <Link
            href="/login"
            className="w-full p-3 rounded-2xl border-2 border-[rgb(0,2,65)] bg-[rgb(241,241,130)] text-[rgb(0,2,65)] text-base font-bold cursor-pointer transition-all text-center hover:bg-[rgb(235,255,59)] hover:shadow-lg"
          >
            Back to Login
          </Link>

          <Link
            href="/"
            className="w-full p-3 rounded-2xl border-2 border-[rgba(0,2,65,0.3)] bg-transparent text-[rgb(0,2,65)] text-base font-bold cursor-pointer transition-all text-center hover:bg-[rgba(0,2,65,0.05)]"
          >
            Go to Home
          </Link>
        </div>

        <p className="text-xs text-center text-[rgba(0,2,65,0.5)] mt-6">
          If the problem persists, please contact support.
        </p>
      </div>
    </div>
  )
}

export default function AuthError() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <AuthErrorContent />
    </Suspense>
  )
}
