'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Mail, MessageCircle, RotateCcw } from 'lucide-react'

export default function LoginVerifyOTP() {
    const router = useRouter()
    const [otp, setOtp] = useState('')
    const [error, setError] = useState('')
    const [identifier, setIdentifier] = useState('')
    const [otpType, setOtpType] = useState('')
    const [resendTimer, setResendTimer] = useState(60)
    const [canResend, setCanResend] = useState(false)
    const [verificationOTP, setVerificationOTP] = useState('')

    useEffect(() => {
        const email = localStorage.getItem('loginEmail')
        const phone = localStorage.getItem('loginPhone')
        const type = localStorage.getItem('otpType')
        const savedOTP = localStorage.getItem('verificationOTP')
        const loginMode = localStorage.getItem('loginMode')

        if (!loginMode) {
            router.push('/login')
            return
        }

        setIdentifier(email || phone)
        setOtpType(type)
        setVerificationOTP(savedOTP)
    }, [router])

    useEffect(() => {
        if (resendTimer > 0) {
            const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000)
            return () => clearTimeout(timer)
        } else {
            setCanResend(true)
        }
    }, [resendTimer])

    const handleOtpChange = (e) => {
        const value = e.target.value.replace(/\D/g, '').slice(0, 6)
        setOtp(value)
        setError('')
    }

    const handleVerify = (e) => {
        e.preventDefault()

        if (!otp || otp.length !== 6) {
            setError('Please enter a valid 6-digit OTP')
            return
        }

        if (otp !== verificationOTP) {
            setError('Invalid OTP. Please try again.')
            return
        }

        // OTP verified successfully
        const loginEmail = localStorage.getItem('loginEmail')
        const loginPhone = localStorage.getItem('loginPhone')

        const user = {
            name: 'User',
            email: loginEmail || loginPhone,
            phone: loginPhone,
            verified: true,
            loginMethod: otpType === 'email' ? 'emailOTP' : 'whatsappOTP',
            createdAt: new Date().toISOString()
        }

        localStorage.setItem('user', JSON.stringify(user))
         localStorage.removeItem('loginEmail')
         localStorage.removeItem('loginPhone')
         localStorage.removeItem('verificationOTP')
         localStorage.removeItem('otpType')
         localStorage.removeItem('loginMode')

         // Dispatch event to notify navbar
         window.dispatchEvent(new Event('storage'));
         window.dispatchEvent(new Event('profileUpdated'));

         toast.success('🎉 Successfully logged in!', { duration: 3000 })
         router.push('/')
    }

    const handleResend = () => {
        const newOTP = Math.floor(100000 + Math.random() * 900000).toString()
        localStorage.setItem('verificationOTP', newOTP)
        setResendTimer(60)
        setCanResend(false)
        setOtp('')
        setError('')
        setVerificationOTP(newOTP)

        if (otpType === 'email') {
            toast.success(`New OTP sent to ${identifier}: ${newOTP}`, { duration: 5000 })
        } else {
            toast.success(`New OTP sent to WhatsApp: +91${identifier}\nOTP: ${newOTP}`, { duration: 5000 })
        }
    }

    return (
        <div className="min-h-[80vh] flex items-center justify-center mx-6 my-10">
            <div className="w-full max-w-md">
                <div className="bg-white rounded-lg shadow-lg p-8">
                    <div className="text-center mb-8">
                        <div className="flex justify-center mb-4">
                            {otpType === 'email' ? (
                                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                                    <Mail size={32} className="text-red-600" />
                                </div>
                            ) : (
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                                    <MessageCircle size={32} className="text-green-600" />
                                </div>
                            )}
                        </div>
                        <h1 className="text-3xl font-bold text-slate-800 mb-2">Verify OTP</h1>
                        <p className="text-slate-600 mb-2">
                            {otpType === 'email'
                                ? `We've sent a 6-digit OTP to ${identifier}`
                                : `We've sent a 6-digit OTP via WhatsApp to +91${identifier}`}
                        </p>
                        <p className="text-sm text-slate-500">Enter the OTP below to sign in</p>
                    </div>

                    <form onSubmit={handleVerify} className="space-y-6">
                        {error && (
                            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                                {error}
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                6-Digit OTP
                            </label>
                            <input
                                type="text"
                                value={otp}
                                onChange={handleOtpChange}
                                maxLength="6"
                                className="w-full px-4 py-3 text-center text-2xl tracking-widest border-2 border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 font-semibold"
                                placeholder="000000"
                                inputMode="numeric"
                            />
                            <p className="text-xs text-slate-500 mt-2">
                                Demo OTP: {verificationOTP}
                            </p>
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-lg transition active:scale-95"
                        >
                            Verify OTP & Sign In
                        </button>
                    </form>

                    <div className="mt-6 pt-6 border-t border-slate-200">
                        <div className="text-center">
                            {!canResend ? (
                                <p className="text-slate-600 text-sm">
                                    Didn't receive OTP? Resend in{' '}
                                    <span className="font-semibold text-red-600">{resendTimer}s</span>
                                </p>
                            ) : (
                                <button
                                    onClick={handleResend}
                                    className="flex items-center justify-center gap-2 mx-auto text-red-600 hover:text-red-700 font-semibold"
                                >
                                    <RotateCcw size={16} />
                                    Resend OTP
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="mt-6 text-center">
                        <p className="text-slate-600 text-sm">
                            Wrong number?{' '}
                            <button
                                onClick={() => router.push('/login')}
                                className="text-red-600 hover:text-red-700 font-semibold"
                            >
                                Try another method
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
