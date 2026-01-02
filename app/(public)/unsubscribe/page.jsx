'use client'
import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { CheckCircle, AlertCircle, Mail, Bell, Zap } from 'lucide-react'
import toast from 'react-hot-toast'

function UnsubscribePageContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const token = searchParams.get('token')
    
    const [loading, setLoading] = useState(false)
    const [mode, setMode] = useState('manage') // manage or unsubscribe
    const [preferences, setPreferences] = useState({
        weekly_deals: true,
        personalized_offers: true,
        flash_sales: true,
        newsletter: true,
        birthday_offers: true
    })
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState('')

    const handleTogglePreference = (key) => {
        setPreferences(prev => ({
            ...prev,
            [key]: !prev[key]
        }))
    }

    const handleSavePreferences = async () => {
        setLoading(true)
        setError('')

        try {
            const response = await fetch('/api/email/manage-preferences', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    token,
                    preferences
                })
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Failed to save preferences')
            }

            setSuccess(true)
            toast.success('Preferences saved successfully!')
            setTimeout(() => router.push('/'), 2000)
        } catch (err) {
            setError(err.message)
            toast.error(err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleUnsubscribe = async () => {
        toast((t) => (
            <div className="flex flex-col gap-3">
                <p className="font-semibold">Unsubscribe from all emails?</p>
                <div className="flex gap-2">
                    <button
                        onClick={async () => {
                            toast.dismiss(t.id)
                            setLoading(true)
                            setError('')

                            try {
                                const response = await fetch('/api/email/unsubscribe', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ token })
                                })

                                const data = await response.json()

                                if (!response.ok) {
                                    throw new Error(data.error || 'Failed to unsubscribe')
                                }

                                setSuccess(true)
                                toast.success('You have been unsubscribed')
                                setTimeout(() => router.push('/'), 2000)
                            } catch (err) {
                                setError(err.message)
                                toast.error(err.message)
                            } finally {
                                setLoading(false)
                            }
                        }}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium"
                    >
                        Unsubscribe
                    </button>
                    <button
                        onClick={() => toast.dismiss(t.id)}
                        className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg text-sm font-medium"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        ), { duration: 5000 })
    }

    if (success) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4">
                <div className="text-center max-w-md">
                    <CheckCircle size={64} className="text-green-500 mx-auto mb-4" />
                    <h1 className="text-3xl font-bold text-white mb-2">Done!</h1>
                    <p className="text-slate-300 mb-6">Your preferences have been updated. Redirecting...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12 px-4">
            <div className="max-w-2xl mx-auto">
                <div className="bg-slate-800 rounded-lg p-8 border border-slate-700">
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-8">
                        <Mail size={32} className="text-red-500" />
                        <h1 className="text-4xl font-bold text-white">Email Preferences</h1>
                    </div>

                    {error && (
                        <div className="bg-red-900 bg-opacity-20 border border-red-700 text-red-400 px-4 py-3 rounded-lg mb-6 flex gap-2">
                            <AlertCircle size={20} />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Mode Selection */}
                    <div className="flex gap-4 mb-8">
                        <button
                            onClick={() => setMode('manage')}
                            className={`flex-1 py-3 px-4 rounded-lg font-semibold transition ${
                                mode === 'manage'
                                    ? 'bg-red-600 text-white'
                                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                            }`}
                        >
                            <Bell size={18} className="inline mr-2" />
                            Manage Preferences
                        </button>
                        <button
                            onClick={() => setMode('unsubscribe')}
                            className={`flex-1 py-3 px-4 rounded-lg font-semibold transition ${
                                mode === 'unsubscribe'
                                    ? 'bg-red-600 text-white'
                                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                            }`}
                        >
                            <Mail size={18} className="inline mr-2" />
                            Unsubscribe All
                        </button>
                    </div>

                    {/* Manage Preferences Tab */}
                    {mode === 'manage' && (
                        <div>
                            <p className="text-slate-300 mb-6">Choose which emails you'd like to receive:</p>

                            <div className="space-y-4 mb-8">
                                {[
                                    { key: 'weekly_deals', label: '🔥 Weekly Deals', desc: 'Get the best deals every week' },
                                    { key: 'personalized_offers', label: '🎁 Personalized Offers', desc: 'Custom offers based on your interests' },
                                    { key: 'flash_sales', label: '⚡ Flash Sales', desc: 'Limited-time flash sale alerts' },
                                    { key: 'newsletter', label: '📰 Newsletter', desc: 'Weekly news and updates' },
                                    { key: 'birthday_offers', label: '🎂 Birthday Offers', desc: 'Special discount on your birthday' }
                                ].map(({ key, label, desc }) => (
                                    <div
                                        key={key}
                                        onClick={() => handleTogglePreference(key)}
                                        className="flex items-center gap-4 p-4 bg-slate-700 rounded-lg cursor-pointer hover:bg-slate-600 transition"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={preferences[key]}
                                            onChange={() => handleTogglePreference(key)}
                                            className="w-5 h-5 text-red-600 rounded cursor-pointer"
                                        />
                                        <div>
                                            <h3 className="text-white font-semibold">{label}</h3>
                                            <p className="text-slate-400 text-sm">{desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={handleSavePreferences}
                                disabled={loading}
                                className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-bold py-3 px-4 rounded-lg transition"
                            >
                                {loading ? 'Saving...' : 'Save Preferences'}
                            </button>
                        </div>
                    )}

                    {/* Unsubscribe Tab */}
                    {mode === 'unsubscribe' && (
                        <div>
                            <div className="bg-red-900 bg-opacity-20 border border-red-700 rounded-lg p-6 mb-6">
                                <h3 className="text-red-400 font-bold mb-2">We'll miss you!</h3>
                                <p className="text-slate-300 text-sm">
                                    Unsubscribing will stop all marketing emails. You'll still receive important transactional emails like order confirmations.
                                </p>
                            </div>

                            <button
                                onClick={handleUnsubscribe}
                                disabled={loading}
                                className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-bold py-3 px-4 rounded-lg transition mb-4"
                            >
                                {loading ? 'Processing...' : 'Unsubscribe from All Emails'}
                            </button>

                            <button
                                onClick={() => setMode('manage')}
                                className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 px-4 rounded-lg transition"
                            >
                                ← Back to Preferences
                            </button>
                        </div>
                    )}

                    {/* Footer */}
                    <div className="mt-8 pt-8 border-t border-slate-700 text-center">
                        <p className="text-slate-400 text-sm mb-4">
                            Need help? <Link href="/contact" className="text-red-500 hover:text-red-400">Contact us</Link>
                        </p>
                        <Link href="/" className="text-slate-500 hover:text-slate-400 text-sm">← Back to home</Link>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default function UnsubscribePage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center"><p className="text-white">Loading...</p></div>}>
            <UnsubscribePageContent />
        </Suspense>
    )
}
