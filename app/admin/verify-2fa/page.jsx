'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Mail, Lock, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react'
import { toast } from 'react-hot-toast'

export default function Verify2FA() {
    const router = useRouter()
    const [step, setStep] = useState('requesting') // requesting, verifying
    const [email, setEmail] = useState('')
    const [code, setCode] = useState('')
    const [loading, setLoading] = useState(false)
    const [timer, setTimer] = useState(0)
    const [codeError, setCodeError] = useState('')

    useEffect(() => {
        // Get email from session storage or localStorage
        const sessionEmail = sessionStorage.getItem('adminEmail')
        const localEmail = localStorage.getItem('adminEmail')
        const adminEmail = sessionEmail || localEmail

        if (!adminEmail) {
            router.push('/admin/login')
            return
        }

        setEmail(adminEmail)
        // Auto-request code on mount
        if (step === 'requesting') {
            requestAuthCode(adminEmail)
        }
    }, [])

    // Timer countdown
    useEffect(() => {
        if (timer > 0) {
            const interval = setTimeout(() => setTimer(timer - 1), 1000)
            return () => clearTimeout(interval)
        }
    }, [timer])

    const requestAuthCode = async (emailAddress) => {
        try {
            setLoading(true)
            const response = await fetch('/api/admin/send-2fa-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: emailAddress || email })
            })

            const data = await response.json()

            if (response.ok) {
                setStep('verifying')
                setTimer(300) // 5 minutes
                toast.success('Verification code sent to your email!')
            } else {
                toast.error(data.message || 'Failed to send code')
            }
        } catch (error) {
            console.error('Error requesting code:', error)
            toast.error('Error sending verification code')
        } finally {
            setLoading(false)
        }
    }

    const handleVerifyCode = async (e) => {
        e.preventDefault()
        setCodeError('')
        setLoading(true)

        if (!code || code.length < 6) {
            setCodeError('Please enter a valid 6-digit code')
            setLoading(false)
            return
        }

        try {
            const response = await fetch('/api/admin/verify-2fa-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, code })
            })

            const data = await response.json()

            if (response.ok) {
                // Store 2FA verification
                sessionStorage.setItem('admin2FAVerified', 'true')
                localStorage.setItem('admin2FAVerified', 'true')
                localStorage.setItem('adminEmail', email)
                
                toast.success('2FA verified successfully!')
                setTimeout(() => {
                    router.push('/admin')
                }, 500)
            } else {
                setCodeError(data.message || 'Invalid verification code')
                toast.error(data.message || 'Verification failed')
            }
        } catch (error) {
            console.error('Error verifying code:', error)
            setCodeError('An error occurred. Please try again.')
            toast.error('Verification error')
        } finally {
            setLoading(false)
        }
    }

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center px-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <img src="/logo.bmp" alt="CrashKart" className="w-16 h-16 mx-auto mb-4" />
                    <h1 className="text-3xl font-bold mb-2">
                        <span className="text-red-600">crash</span>kart
                    </h1>
                    <p className="text-slate-600">Two-Factor Authentication</p>
                </div>

                {/* Main Card */}
                <div className="bg-white rounded-lg shadow-lg border border-slate-200 p-8">
                    <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mx-auto mb-4">
                        <Lock size={24} className="text-red-600" />
                    </div>

                    <h2 className="text-2xl font-bold text-slate-800 text-center mb-2">Admin 2FA Verification</h2>
                    <p className="text-slate-600 text-center text-sm mb-6">
                        We've sent a verification code to <span className="font-semibold">{email}</span>
                    </p>

                    {step === 'requesting' ? (
                        <div className="flex justify-center py-12">
                            <div className="text-center">
                                <div className="w-12 h-12 border-4 border-red-200 border-t-red-600 rounded-full animate-spin mx-auto mb-4"></div>
                                <p className="text-slate-600">Sending verification code...</p>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleVerifyCode} className="space-y-4">
                            {/* Code Input */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Verification Code
                                </label>
                                <input
                                    type="text"
                                    value={code}
                                    onChange={(e) => {
                                        const val = e.target.value.replace(/\D/g, '').slice(0, 6)
                                        setCode(val)
                                        setCodeError('')
                                    }}
                                    placeholder="000000"
                                    className={`w-full px-4 py-3 text-center text-2xl font-bold tracking-widest border-2 rounded-lg outline-none transition ${
                                        codeError
                                            ? 'border-red-500 focus:ring-2 focus:ring-red-200'
                                            : 'border-slate-300 focus:border-red-600 focus:ring-2 focus:ring-red-100'
                                    }`}
                                    maxLength="6"
                                    inputMode="numeric"
                                    required
                                />
                                {codeError && (
                                    <div className="flex items-center gap-2 mt-2 text-red-600 text-sm">
                                        <AlertCircle size={16} />
                                        {codeError}
                                    </div>
                                )}
                            </div>

                            {/* Timer */}
                            <div className="text-center text-sm text-slate-600">
                                Code expires in: <span className="font-bold text-red-600">{formatTime(timer)}</span>
                            </div>

                            {/* Verify Button */}
                            <button
                                type="submit"
                                disabled={loading || code.length !== 6}
                                className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        Verifying...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 size={18} />
                                        Verify & Continue
                                    </>
                                )}
                            </button>

                            {/* Resend Code */}
                            <div className="text-center">
                                <p className="text-sm text-slate-600 mb-2">Didn't receive the code?</p>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setCode('')
                                        setStep('requesting')
                                        requestAuthCode(email)
                                    }}
                                    disabled={loading || timer > 240} // Can resend after 1 minute
                                    className="text-red-600 hover:text-red-700 font-semibold text-sm flex items-center justify-center gap-2 mx-auto disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <RefreshCw size={16} />
                                    Resend Code {timer > 240 && `(${formatTime(timer - 240)})`}
                                </button>
                            </div>
                        </form>
                    )}
                </div>

                {/* Security Info */}
                <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-xs text-blue-800">
                        <strong>🔒 Security:</strong> Never share your verification code with anyone. It's for your admin account security only.
                    </p>
                </div>

                {/* Back to Login */}
                <button
                    onClick={() => router.push('/admin/login')}
                    className="w-full mt-4 text-slate-600 hover:text-slate-800 font-medium text-sm py-2 transition"
                >
                    ← Back to Admin Login
                </button>
            </div>
        </div>
    )
}
