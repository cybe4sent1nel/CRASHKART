'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Mail, Phone, Chrome, Loader, RotateCcw } from 'lucide-react'
import toast from 'react-hot-toast'
import Swal from 'sweetalert2'
import { signIn } from 'next-auth/react'
import NeonCheckbox from '@/components/NeonCheckbox'

export default function Login() {
  const router = useRouter()
  const [step, setStep] = useState('choose') // choose, email, mobile, password, otp
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const otpRefs = useRef([])
  const [userId, setUserId] = useState(null)
  const [method, setMethod] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [resendTimer, setResendTimer] = useState(0)
  const [canResend, setCanResend] = useState(false)

  // Countdown for resend OTP
  useEffect(() => {
    if (step !== 'otp') return
    if (resendTimer <= 0) {
      setCanResend(true)
      return
    }
    const t = setTimeout(() => setResendTimer((prev) => prev - 1), 1000)
    return () => clearTimeout(t)
  }, [resendTimer, step])

  const handleChooseEmail = () => {
    setStep('email')
    setIdentifier('')
    setPassword('')
    setError('')
    setMethod('email')
  }

  const handleChooseMobile = () => {
    toast.error('🚧 WhatsApp login is under development. Please use Email login instead.', {
      duration: 4000,
      icon: '⚠️'
    })
    // Don't change method, keep user on email flow
  }

  const handleEmailLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (!identifier) {
        throw new Error('Please enter your email')
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier)) {
        throw new Error('Please enter a valid email address')
      }

      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: identifier,
          method: 'email'
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send OTP')
      }

      setUserId(data.userId)
      setStep('otp')
      setOtp(['', '', '', '', '', ''])
      setResendTimer(120)
      setCanResend(false)

      if (data.demoOtp) {
        Swal.fire({
          title: 'Demo Mode OTP',
          html: `<p style="color: #666;">Your OTP for testing:</p><h2 style="color: #ef4444; letter-spacing: 3px; font-size: 2em; margin: 15px 0;">${data.demoOtp}</h2>`,
          icon: 'info',
          confirmButtonColor: '#ef4444',
          confirmButtonText: 'Got it!'
        })
      }

      toast.success('OTP sent to your email!')
    } catch (err) {
      setError(err.message || 'Something went wrong')
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleMobileLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (!identifier) {
        throw new Error('Please enter your mobile number')
      }

      if (!/^[0-9]{10}$/.test(identifier.replace(/\D/g, ''))) {
        throw new Error('Please enter a valid 10-digit mobile number')
      }

      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: `+91${identifier}`,
          method: 'whatsapp'
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send OTP')
      }

      setUserId(data.userId)
      setStep('otp')
      setOtp(['', '', '', '', '', ''])
      setResendTimer(120)
      setCanResend(false)

      if (data.demoOtp) {
        Swal.fire({
          title: 'Demo Mode OTP',
          html: `<p style="color: #666;">Your OTP for testing:</p><h2 style="color: #ef4444; letter-spacing: 3px; font-size: 2em; margin: 15px 0;">${data.demoOtp}</h2>`,
          icon: 'info',
          confirmButtonColor: '#ef4444',
          confirmButtonText: 'Got it!'
        })
      }

      toast.success('OTP sent to your WhatsApp!')
    } catch (err) {
      setError(err.message || 'Something went wrong')
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleResendOtp = async () => {
    if (loading || !method) return

    try {
      setLoading(true)
      setError('')

      const payload =
        method === 'email'
          ? { email: identifier, method: 'email' }
          : { phone: `+91${identifier}`, method: 'whatsapp' }

      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Failed to resend OTP')
      }

      setUserId(data.userId)
      setOtp(['', '', '', '', '', ''])
      setResendTimer(120)
      setCanResend(false)

      toast.success(`OTP re-sent to your ${method === 'email' ? 'email' : 'WhatsApp'}`)
    } catch (err) {
      setError(err.message || 'Failed to resend OTP')
      toast.error(err.message || 'Failed to resend OTP')
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (!identifier || !password) {
        throw new Error('Please fill in all fields')
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier)) {
        throw new Error('Please enter a valid email address')
      }

      toast.error('Password login integration in progress')
    } catch (err) {
      setError(err.message || 'Something went wrong')
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleOTPChange = (index, value) => {
    if (value.length > 1) {
      value = value[value.length - 1]
    }

    const newOtp = [...otp]
    newOtp[index] = value

    setOtp(newOtp)

    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus()
    }
  }

  const handleOTPKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus()
    }
  }

  const handleVerifyOTP = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const otpValue = otp.join('')

      if (!otpValue || otpValue.length !== 6) {
        throw new Error('Please enter a valid 6-digit OTP')
      }

      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          otp: otpValue
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Invalid OTP')
      }

      localStorage.setItem('user', JSON.stringify(data.user))
      localStorage.setItem('token', data.token)

      // ✅ Sync CrashCash balance from database
      if (data.user && data.user.id) {
        try {
          const balResp = await fetch(`/api/crashcash/balance?userId=${data.user.id}`)
          if (balResp.ok) {
            const balData = await balResp.json()
            localStorage.setItem('crashCashBalance', (balData.balance || 0).toString())
            console.log(`✅ CrashCash balance synced on login: ₹${balData.balance}`)
          }
        } catch (balError) {
          console.error('Failed to sync balance:', balError)
        }
      }

      window.dispatchEvent(new Event('storage'))
      window.dispatchEvent(new Event('profileUpdated'))
      window.dispatchEvent(new Event('crashcash-update'))

      toast.success('Login successful!')

      if (data.requiresProfileSetup) {
        router.push('/profile-setup')
      } else {
        router.push('/')
      }
    } catch (err) {
      setError(err.message || 'Something went wrong')
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    try {
      setLoading(true)
      // Redirect to Google OAuth
      const redirectUri = `${window.location.origin}/auth/callback/google`
      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
      const scope = 'openid email profile'
      const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}&access_type=offline&prompt=consent`
      window.location.href = googleAuthUrl
    } catch (err) {
      console.error('Google login error:', err)
      toast.error(err.message || 'Failed to initiate Google login')
      setError('Google login failed. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center mx-6 my-10">
      <div className="w-full max-w-md">
        <form className="flex flex-col gap-4 bg-gradient-to-br from-[rgb(241,241,130)] to-[rgb(255,250,150)] p-12 rounded-3xl shadow-lg border-2 border-[rgb(0,2,65)]" style={{boxShadow: '4px 4px rgb(0, 2, 65)'}}>
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-center text-[rgb(0,2,65)] mb-2 tracking-tight">
              Welcome to CrashKart
            </h1>
            <p className="text-center text-sm text-[rgba(0,2,65,0.7)]">
              Sign in to your account
            </p>
          </div>

          {step === 'choose' && (
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={handleChooseEmail}
                className="w-full p-3.5 rounded-2xl border-2 border-[rgb(0,2,65)] bg-white/80 text-[rgb(0,2,65)] font-semibold text-base cursor-pointer transition-all hover:bg-red-100/10 hover:shadow-md flex items-center justify-center gap-2.5"
              >
                <Mail size={20} />
                Sign in with Email OTP
              </button>

              <button
                type="button"
                onClick={handleChooseMobile}
                className="w-full p-3.5 rounded-2xl border-2 border-[rgb(0,2,65)] bg-white/80 text-[rgb(0,2,65)] font-semibold text-base cursor-pointer transition-all hover:bg-red-100/10 hover:shadow-md flex items-center justify-center gap-2.5"
              >
                <Phone size={20} />
                Sign in with WhatsApp OTP
              </button>

              <button
                type="button"
                onClick={() => setStep('password')}
                className="w-full p-3.5 rounded-2xl border-2 border-[rgb(0,2,65)] bg-white/80 text-[rgb(0,2,65)] font-semibold text-base cursor-pointer transition-all hover:bg-red-100/10 hover:shadow-md flex items-center justify-center gap-2.5"
              >
                <Mail size={20} />
                Sign in with Password
              </button>

              <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full p-3.5 rounded-2xl border-2 border-[rgb(0,2,65)] bg-white/80 text-[rgb(0,2,65)] font-semibold text-base cursor-pointer transition-all hover:bg-red-100/10 hover:shadow-md flex items-center justify-center gap-2.5"
              >
                <Chrome size={20} />
                Sign in with Google
              </button>

              <div className="relative my-3 text-xs text-[rgba(0,2,65,0.5)]">
                <div className="absolute inset-x-0 top-1/2 h-px bg-[rgb(0,2,65)] opacity-30"></div>
                <span className="relative inline-block px-2 bg-gradient-to-r from-[rgb(241,241,130)] to-[rgb(255,250,150)]">
                  OR
                </span>
              </div>

              <p className="text-center text-sm text-[rgba(0,2,65,0.7)]">
                Don't have an account?{' '}
                <Link href="/signup" className="text-red-600 font-semibold no-underline transition-all hover:underline hover:text-red-700">
                  Sign up here
                </Link>
              </p>

              <p className="text-center text-xs text-[rgba(0,2,65,0.6)]">
                <Link href="/forgot-password" className="text-red-600 font-semibold no-underline transition-all hover:underline hover:text-red-700">
                  Forgot your password?
                </Link>
              </p>
            </div>
          )}

          {step === 'email' && (
            <>
              {error && (
                <div className="bg-red-100 border-2 border-red-600 text-red-900 p-3 rounded-2xl text-sm font-medium">
                  {error}
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-[rgb(0,2,65)]">
                  Email Address
                </label>
                <input
                  type="email"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  disabled={loading}
                  className="px-3.5 py-3 rounded-2xl border-2 border-[rgb(0,2,65)] text-base font-inherit bg-white/90 text-[rgb(0,2,65)] transition-all placeholder:text-[rgba(0,2,65,0.4)] disabled:bg-[rgba(0,2,65,0.05)] disabled:cursor-not-allowed focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-200"
                  placeholder="you@example.com"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                onClick={handleEmailLogin}
                className="p-3.5 rounded-2xl border-2 border-[rgb(0,2,65)] bg-[rgb(241,241,130)] text-[rgb(0,2,65)] text-base font-bold cursor-pointer transition-all shadow-md flex items-center justify-center gap-2 hover:enabled:bg-[rgb(235,255,59)] hover:enabled:shadow-lg hover:enabled:-translate-y-0.5 active:enabled:translate-y-0.5 active:enabled:shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading && <Loader size={18} className="animate-spin" />}
                {loading ? 'Sending...' : 'Send OTP to Email'}
              </button>

              <div className="flex items-center gap-2 text-xs text-[rgba(0,2,65,0.7)]">
                <NeonCheckbox
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  size={16}
                />
                <span>Remember me</span>
              </div>

              <button
                type="button"
                onClick={() => setStep('choose')}
                className="p-3 rounded-2xl border-none bg-transparent text-[rgba(0,2,65,0.7)] text-sm font-semibold cursor-pointer transition-all hover:text-[rgb(0,2,65)] hover:bg-[rgba(0,2,65,0.05)]"
              >
                ← Back
              </button>
            </>
          )}

          {step === 'mobile' && (
            <>
              {error && (
                <div className="bg-red-100 border-2 border-red-600 text-red-900 p-3 rounded-2xl text-sm font-medium">
                  {error}
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-[rgb(0,2,65)]">
                  Mobile Number
                </label>
                <div className="flex">
                  <span className="flex items-center p-3 bg-[rgba(0,2,65,0.05)] border-2 border-[rgb(0,2,65)] border-r-0 rounded-l-2xl text-[rgb(0,2,65)] font-semibold">
                    +91
                  </span>
                  <input
                    type="tel"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    disabled={loading}
                    className="flex-1 px-3.5 py-3 rounded-r-2xl border-2 border-[rgb(0,2,65)] border-l-0 text-base font-inherit bg-white/90 text-[rgb(0,2,65)] transition-all placeholder:text-[rgba(0,2,65,0.4)] disabled:bg-[rgba(0,2,65,0.05)] disabled:cursor-not-allowed focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-200 -ml-0.5"
                    placeholder="10-digit mobile number"
                    maxLength="10"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                onClick={handleMobileLogin}
                className="p-3.5 rounded-2xl border-2 border-[rgb(0,2,65)] bg-[rgb(241,241,130)] text-[rgb(0,2,65)] text-base font-bold cursor-pointer transition-all shadow-md flex items-center justify-center gap-2 hover:enabled:bg-[rgb(235,255,59)] hover:enabled:shadow-lg hover:enabled:-translate-y-0.5 active:enabled:translate-y-0.5 active:enabled:shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading && <Loader size={18} className="animate-spin" />}
                {loading ? 'Sending...' : 'Send OTP via WhatsApp'}
              </button>

              <button
                type="button"
                onClick={() => setStep('choose')}
                className="p-3 rounded-2xl border-none bg-transparent text-[rgba(0,2,65,0.7)] text-sm font-semibold cursor-pointer transition-all hover:text-[rgb(0,2,65)] hover:bg-[rgba(0,2,65,0.05)]"
              >
                ← Back
              </button>
            </>
          )}

          {step === 'otp' && (
            <>
              {error && (
                <div className="bg-red-100 border-2 border-red-600 text-red-900 p-3 rounded-2xl text-sm font-medium">
                  {error}
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-[rgb(0,2,65)]">
                  Enter OTP Code
                </label>
                <div className="flex gap-2.5 justify-center">
                  {[0, 1, 2, 3, 4, 5].map((index) => (
                    <input
                      key={index}
                      ref={(el) => (otpRefs.current[index] = el)}
                      type="text"
                      value={otp[index]}
                      onChange={(e) => handleOTPChange(index, e.target.value)}
                      onKeyDown={(e) => handleOTPKeyDown(index, e)}
                      disabled={loading}
                      maxLength="1"
                      className="w-11 h-12 rounded-2xl border-2 border-[rgb(0,2,65)] text-center text-xl font-bold bg-white/90 text-[rgb(0,2,65)] font-mono cursor-text transition-all placeholder:text-[rgba(0,2,65,0.4)] disabled:bg-[rgba(0,2,65,0.05)] disabled:cursor-not-allowed focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-200"
                    />
                  ))}
                </div>
                <p className="text-xs text-center text-[rgba(0,2,65,0.6)] mt-2">
                  We sent a 6-digit code to your {method === 'email' ? 'email' : 'WhatsApp'}
                </p>
                <div className="mt-3 text-center">
                  {!canResend ? (
                    <p className="text-[rgba(0,2,65,0.7)] text-sm">
                      Didn't receive OTP? Resend in{' '}
                      <span className="font-semibold text-[rgb(0,2,65)]">{resendTimer}s</span>
                    </p>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={loading}
                      className="inline-flex items-center justify-center gap-2 text-[rgb(0,2,65)] font-semibold hover:text-red-600 disabled:opacity-60"
                    >
                      <RotateCcw size={16} />
                      Resend OTP
                    </button>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                onClick={handleVerifyOTP}
                className="p-3.5 rounded-2xl border-2 border-[rgb(0,2,65)] bg-[rgb(241,241,130)] text-[rgb(0,2,65)] text-base font-bold cursor-pointer transition-all shadow-md flex items-center justify-center gap-2 hover:enabled:bg-[rgb(235,255,59)] hover:enabled:shadow-lg hover:enabled:-translate-y-0.5 active:enabled:translate-y-0.5 active:enabled:shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading && <Loader size={18} className="animate-spin" />}
                {loading ? 'Verifying...' : 'Verify & Login'}
              </button>

              <button
                type="button"
                onClick={() => setStep('choose')}
                className="p-3 rounded-2xl border-none bg-transparent text-[rgba(0,2,65,0.7)] text-sm font-semibold cursor-pointer transition-all hover:text-[rgb(0,2,65)] hover:bg-[rgba(0,2,65,0.05)]"
              >
                ← Back
              </button>
            </>
          )}

          {step === 'password' && (
            <>
              {error && (
                <div className="bg-red-100 border-2 border-red-600 text-red-900 p-3 rounded-2xl text-sm font-medium">
                  {error}
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-[rgb(0,2,65)]">
                  Email Address
                </label>
                <input
                  type="email"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  disabled={loading}
                  className="px-3.5 py-3 rounded-2xl border-2 border-[rgb(0,2,65)] text-base font-inherit bg-white/90 text-[rgb(0,2,65)] transition-all placeholder:text-[rgba(0,2,65,0.4)] disabled:bg-[rgba(0,2,65,0.05)] disabled:cursor-not-allowed focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-200"
                  placeholder="you@example.com"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-[rgb(0,2,65)]">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="px-3.5 py-3 rounded-2xl border-2 border-[rgb(0,2,65)] text-base font-inherit bg-white/90 text-[rgb(0,2,65)] transition-all placeholder:text-[rgba(0,2,65,0.4)] disabled:bg-[rgba(0,2,65,0.05)] disabled:cursor-not-allowed focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-200"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                onClick={handlePasswordLogin}
                className="p-3.5 rounded-2xl border-2 border-[rgb(0,2,65)] bg-[rgb(241,241,130)] text-[rgb(0,2,65)] text-base font-bold cursor-pointer transition-all shadow-md flex items-center justify-center gap-2 hover:enabled:bg-[rgb(235,255,59)] hover:enabled:shadow-lg hover:enabled:-translate-y-0.5 active:enabled:translate-y-0.5 active:enabled:shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading && <Loader size={18} className="animate-spin" />}
                {loading ? 'Signing In...' : 'Sign In'}
              </button>

              <button
                type="button"
                onClick={() => setStep('choose')}
                className="p-3 rounded-2xl border-none bg-transparent text-[rgba(0,2,65,0.7)] text-sm font-semibold cursor-pointer transition-all hover:text-[rgb(0,2,65)] hover:bg-[rgba(0,2,65,0.05)]"
              >
                ← Back
              </button>
            </>
          )}
        </form>
      </div>
    </div>
  )
}
