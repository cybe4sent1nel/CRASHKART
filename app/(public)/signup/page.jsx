'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Mail, Phone, Chrome, Loader, RotateCcw } from 'lucide-react'
import toast from 'react-hot-toast'
import Swal from 'sweetalert2'
import { signIn } from 'next-auth/react'
import NeonCheckbox from '@/components/NeonCheckbox'
import TermsPopup from '@/components/TermsPopup'
import PrivacyPopup from '@/components/PrivacyPopup'
import styled from 'styled-components'

const StyledCard = styled.div`
  .card-form {
    display: flex;
    flex-direction: column;
    gap: 16px;
    background: linear-gradient(135deg, rgb(241, 241, 130) 0%, rgb(255, 250, 150) 100%);
    padding: 48px 28px;
    border-radius: 20px;
    box-shadow: 4px 4px rgb(0, 2, 65);
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  }

  .card-heading {
    font-size: 28px;
    text-align: center;
    font-weight: 700;
    color: rgb(0, 2, 65);
    margin-bottom: 8px;
    letter-spacing: -0.5px;
  }

  .card-subheading {
    font-size: 14px;
    text-align: center;
    color: rgba(0, 2, 65, 0.7);
    margin-bottom: 16px;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .form-label {
    font-size: 14px;
    font-weight: 600;
    color: rgb(0, 2, 65);
  }

  .form-input {
    padding: 12px 14px;
    border-radius: 10px;
    border: 2px solid rgb(0, 2, 65);
    font-size: 15px;
    font-family: inherit;
    background: rgba(255, 255, 255, 0.9);
    color: rgb(0, 2, 65);
    transition: all 300ms ease;

    &:focus {
      outline: none;
      box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.2), 2px 2px rgb(0, 2, 65);
      border-color: rgb(239, 68, 68);
    }

    &::placeholder {
      color: rgba(0, 2, 65, 0.4);
    }

    &:disabled {
      background: rgba(0, 2, 65, 0.05);
      cursor: not-allowed;
    }
  }

  .form-button {
    padding: 14px 16px;
    border-radius: 10px;
    border: 2px solid rgb(0, 2, 65);
    background: rgb(241, 241, 130);
    color: rgb(0, 2, 65);
    font-size: 15px;
    font-weight: 700;
    cursor: pointer;
    transition: all 300ms ease;
    box-shadow: 2px 2px rgb(0, 2, 65);
    font-family: inherit;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;

    &:hover:not(:disabled) {
      background: rgb(235, 255, 59);
      box-shadow: 3px 3px rgb(0, 2, 65);
      transform: translate(-1px, -1px);
    }

    &:active:not(:disabled) {
      transform: translate(1px, 1px);
      box-shadow: 1px 1px rgb(0, 2, 65);
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }

  .back-button {
    padding: 12px 16px;
    border-radius: 10px;
    border: none;
    background: transparent;
    color: rgba(0, 2, 65, 0.7);
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 300ms ease;
    font-family: inherit;

    &:hover {
      color: rgb(0, 2, 65);
      background: rgba(0, 2, 65, 0.05);
    }
  }

  .error-message {
    background: rgb(254, 226, 226);
    border: 2px solid rgb(239, 68, 68);
    color: rgb(185, 28, 28);
    padding: 12px 14px;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 500;
  }

  .method-button {
    width: 100%;
    padding: 14px 16px;
    border-radius: 10px;
    border: 2px solid rgb(0, 2, 65);
    background: rgba(255, 255, 255, 0.8);
    color: rgb(0, 2, 65);
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    transition: all 300ms ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    font-family: inherit;

    &:hover {
      background: rgba(239, 68, 68, 0.1);
      box-shadow: 2px 2px rgb(0, 2, 65);
    }
  }

  .divider {
    position: relative;
    margin: 12px 0;
    font-size: 13px;
    color: rgba(0, 2, 65, 0.5);
  }

  .divider::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 0;
    right: 0;
    height: 1px;
    background: rgb(0, 2, 65);
    opacity: 0.3;
  }

  .divider span {
    position: relative;
    background: linear-gradient(135deg, rgb(241, 241, 130) 0%, rgb(255, 250, 150) 100%);
    padding: 0 8px;
    display: inline-block;
  }

  .otp-container {
    display: flex;
    gap: 10px;
    justify-content: center;
  }

  .otp-input {
    width: 45px;
    height: 50px;
    border-radius: 10px;
    border: 2px solid rgb(0, 2, 65);
    font-size: 20px;
    font-weight: 700;
    text-align: center;
    background: rgba(255, 255, 255, 0.9);
    color: rgb(0, 2, 65);
    cursor: text;
    transition: all 300ms ease;
    font-family: 'Courier New', monospace;

    &:focus {
      outline: none;
      box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.2), 2px 2px rgb(0, 2, 65);
      border-color: rgb(239, 68, 68);
    }

    &:disabled {
      background: rgba(0, 2, 65, 0.05);
      cursor: not-allowed;
    }
  }

  .help-text {
    font-size: 13px;
    color: rgba(0, 2, 65, 0.6);
    text-align: center;
    margin-top: 8px;
  }

  .checkbox-wrapper {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: rgba(0, 2, 65, 0.7);
  }

  .link-text {
    color: rgb(239, 68, 68);
    text-decoration: none;
    font-weight: 600;
    cursor: pointer;
    transition: all 200ms ease;

    &:hover {
      text-decoration: underline;
      color: rgb(185, 28, 28);
    }
  }

  .resend-button {
    width: 100%;
    padding: 14px 16px;
    border-radius: 10px;
    border: 2px solid rgb(0, 2, 65);
    background: rgba(255, 255, 255, 0.8);
    color: rgb(0, 2, 65);
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    transition: all 300ms ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    font-family: inherit;

    &:hover:not(:disabled) {
      background: rgba(239, 68, 68, 0.1);
      box-shadow: 2px 2px rgb(0, 2, 65);
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
`;

export default function Signup() {
  const router = useRouter()
  const [step, setStep] = useState('choose') // choose, email, mobile, otp
  const [formData, setFormData] = useState({
    identifier: '',
    name: ''
  })
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const otpRefs = useRef([])
  const [userId, setUserId] = useState(null)
  const [method, setMethod] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [resendCountdown, setResendCountdown] = useState(0)
  const [newsletter, setNewsletter] = useState(false)
  const [termsPopupOpen, setTermsPopupOpen] = useState(false)
  const [privacyPopupOpen, setPrivacyPopupOpen] = useState(false)

  const handleChooseEmail = () => {
    setStep('email')
    setFormData({ identifier: '', name: '' })
    setError('')
    setMethod('email')
  }

  const handleChooseMobile = () => {
    toast.error('🚧 WhatsApp signup is under development. Please use Email signup instead.', {
      duration: 4000,
      icon: '⚠️'
    })
    // Don't change method, keep user on email flow
  }

  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendCountdown])

  const handleResendOTP = async () => {
    if (resendCountdown > 0) {
      toast.error(`Please wait ${resendCountdown}s before resending`)
      return
    }

    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: method === 'email' ? formData.identifier : undefined,
          phone: method === 'whatsapp' ? formData.identifier : undefined,
          method
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to resend OTP')
      }

      setResendCountdown(60)
      toast.success('OTP resent successfully!')

      if (data.demoOtp) {
        Swal.fire({
          title: 'Demo Mode OTP',
          html: `<p style="color: #666;">Your new OTP for testing:</p><h2 style="color: #ef4444; letter-spacing: 3px; font-size: 2em; margin: 15px 0;">${data.demoOtp}</h2>`,
          icon: 'info',
          confirmButtonColor: '#ef4444',
          confirmButtonText: 'Got it!'
        })
      }
    } catch (err) {
      setError(err.message || 'Failed to resend OTP')
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleEmailSignup = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (!formData.name || !formData.identifier) {
        throw new Error('Please fill in all fields')
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.identifier)) {
        throw new Error('Please enter a valid email address')
      }

      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.identifier,
          method: 'email'
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send OTP')
      }

      setUserId(data.userId)
      setOtpSent(true)
      setStep('otp')
      setResendCountdown(60)

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

  const handleMobileSignup = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (!formData.name || !formData.identifier) {
        throw new Error('Please fill in all fields')
      }

      if (!/^[0-9]{10}$/.test(formData.identifier.replace(/\D/g, ''))) {
        throw new Error('Please enter a valid 10-digit mobile number')
      }

      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: `+91${formData.identifier}`,
          method: 'whatsapp'
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send OTP')
      }

      setUserId(data.userId)
      setOtpSent(true)
      setStep('otp')
      setResendCountdown(60)

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

      // ✅ Sync CrashCash balance from database (bonus already added by API)
      if (data.user && data.user.id) {
        try {
          const balResp = await fetch(`/api/crashcash/balance?userId=${data.user.id}`)
          if (balResp.ok) {
            const balData = await balResp.json()
            localStorage.setItem('crashCashBalance', (balData.balance || 0).toString())
            console.log(`✅ CrashCash balance synced: ₹${balData.balance}`)
          }
        } catch (balError) {
          console.error('Failed to sync balance:', balError)
        }
      }

      window.dispatchEvent(new Event('storage'))
      window.dispatchEvent(new Event('profileUpdated'))
      window.dispatchEvent(new Event('crashcash-update'))

      if (data.isNewUser && data.newUserBonus > 0) {
        Swal.fire({
          title: 'Welcome to CrashKart!',
          html: `<p style="color: #666; font-size: 1.1em;">You've earned a welcome bonus of</p><h2 style="color: #ef4444; font-size: 2.5em; margin: 15px 0; letter-spacing: 2px;">${data.newUserBonus}</h2><p style="color: #999; font-size: 0.95em;">CrashCash to use on your first purchase!</p>`,
          icon: 'success',
          confirmButtonColor: '#ef4444',
          confirmButtonText: 'Start Shopping!',
          allowOutsideClick: false,
          allowEscapeKey: false
        }).then(() => {
          if (data.requiresProfileSetup) {
            router.push('/profile-setup')
          } else {
            router.push('/')
          }
        })
      } else {
        toast.success('Signup successful!')

        if (data.requiresProfileSetup) {
          router.push('/profile-setup')
        } else {
          router.push('/')
        }
      }
    } catch (err) {
      setError(err.message || 'Something went wrong')
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignup = async () => {
    try {
      setLoading(true)
      // Redirect to Google OAuth
      const redirectUri = `${window.location.origin}/auth/callback/google`
      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '501082196293-jkoqi4u1807eq4dgdbnct7ndakc3thkg.apps.googleusercontent.com'
      const scope = 'openid email profile'
      const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}&access_type=offline&prompt=consent`
      window.location.href = googleAuthUrl
    } catch (err) {
      console.error('Google signup error:', err)
      toast.error(err.message || 'Failed to initiate Google signup')
      setError('Google signup failed. Please try again.')
      setLoading(false)
    }
  }

  return (
    <StyledCard>
      <div className="min-h-[80vh] flex items-center justify-center mx-6 my-10">
        <div className="w-full max-w-md">
          <form className="card-form">
            {/* Header */}
            <div>
              <h1 className="card-heading">Join CrashKart</h1>
              <p className="card-subheading">Create your account and start shopping</p>
            </div>

            {step === 'choose' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <button
                  type="button"
                  onClick={handleChooseEmail}
                  className="method-button"
                >
                  <Mail size={20} />
                  Sign up with Email
                </button>

                <button
                  type="button"
                  onClick={handleChooseMobile}
                  className="method-button"
                >
                  <Phone size={20} />
                  Sign up with Mobile
                </button>

                <button
                  type="button"
                  onClick={handleGoogleSignup}
                  className="method-button"
                >
                  <Chrome size={20} />
                  Sign up with Google
                </button>

                <div className="divider">
                  <span>OR</span>
                </div>

                <p style={{ textAlign: 'center', fontSize: '14px', color: 'rgba(0, 2, 65, 0.7)' }}>
                  Already have an account?{' '}
                  <Link href="/login" className="link-text">
                    Sign In
                  </Link>
                </p>
              </div>
            )}

            {step === 'email' && (
              <>
                {error && <div className="error-message">{error}</div>}

                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    disabled={loading}
                    className="form-input"
                    placeholder="Your name"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    name="identifier"
                    value={formData.identifier}
                    onChange={handleChange}
                    disabled={loading}
                    className="form-input"
                    placeholder="you@example.com"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  onClick={handleEmailSignup}
                  className="form-button"
                >
                  {loading && <Loader size={18} className="animate-spin" />}
                  {loading ? 'Sending...' : 'Send OTP to Email'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStep('choose')
                    setError('')
                  }}
                  className="back-button"
                >
                  ← Back
                </button>
              </>
            )}

            {step === 'mobile' && (
              <>
                {error && <div className="error-message">{error}</div>}

                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    disabled={loading}
                    className="form-input"
                    placeholder="Your name"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Mobile Number</label>
                  <div style={{ display: 'flex' }}>
                    <span style={{ display: 'flex', alignItems: 'center', padding: '12px 14px', background: 'rgba(0, 2, 65, 0.05)', border: '2px solid rgb(0, 2, 65)', borderRight: 'none', borderRadius: '10px 0 0 10px', color: 'rgb(0, 2, 65)', fontWeight: 600 }}>
                      +91
                    </span>
                    <input
                      type="tel"
                      name="identifier"
                      value={formData.identifier}
                      onChange={handleChange}
                      disabled={loading}
                      className="form-input"
                      placeholder="10-digit mobile number"
                      maxLength="10"
                      style={{ borderRadius: '0 10px 10px 0', marginLeft: '-2px', flex: 1 }}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  onClick={handleMobileSignup}
                  className="form-button"
                >
                  {loading && <Loader size={18} className="animate-spin" />}
                  {loading ? 'Sending...' : 'Send OTP via WhatsApp'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStep('choose')
                    setError('')
                  }}
                  className="back-button"
                >
                  ← Back
                </button>
              </>
            )}

            {step === 'otp' && (
              <>
                {error && <div className="error-message">{error}</div>}

                <div className="form-group">
                  <label className="form-label">Enter OTP Code</label>
                  <div className="otp-container">
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
                        className="otp-input"
                      />
                    ))}
                  </div>
                  <p className="help-text">We sent a 6-digit code to your {method === 'email' ? 'email' : 'WhatsApp'}</p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  onClick={handleVerifyOTP}
                  className="form-button"
                >
                  {loading && <Loader size={18} className="animate-spin" />}
                  {loading ? 'Verifying...' : 'Verify & Continue'}
                </button>

                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={resendCountdown > 0 || loading}
                  className="resend-button"
                >
                  <RotateCcw size={16} />
                  {resendCountdown > 0 ? `Resend in ${resendCountdown}s` : 'Resend OTP'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStep('choose')
                    setOtp(['', '', '', '', '', ''])
                    setError('')
                    setResendCountdown(0)
                  }}
                  className="back-button"
                >
                  ← Back
                </button>
              </>
            )}

            <div className="checkbox-wrapper" style={{ marginTop: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <NeonCheckbox
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                size={16}
              />
              <p style={{ fontSize: '12px', color: 'rgba(0, 2, 65, 0.7)', margin: 0, width: '100%' }}>
                I agree to the{' '}
                <button
                  type="button"
                  onClick={() => !agreedToTerms && setTermsPopupOpen(true)}
                  className="link-text"
                  style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                >
                  Terms of Service
                </button>
                {' '}and{' '}
                <button
                  type="button"
                  onClick={() => !agreedToTerms && setPrivacyPopupOpen(true)}
                  className="link-text"
                  style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                >
                  Privacy Policy
                </button>
              </p>
              {agreedToTerms && (
                <p style={{ fontSize: '11px', color: 'rgb(34, 197, 94)', margin: '4px 0 0 0', width: '100%', fontWeight: 600 }}>
                  ✓ Terms accepted. You can still read them by clicking the links above.
                </p>
              )}
            </div>
          </form>

          <TermsPopup
            isOpen={termsPopupOpen}
            onClose={() => setTermsPopupOpen(false)}
            onAgree={() => setAgreedToTerms(true)}
          />
          <PrivacyPopup
            isOpen={privacyPopupOpen}
            onClose={() => setPrivacyPopupOpen(false)}
            onAgree={() => setAgreedToTerms(true)}
          />
        </div>
      </div>
    </StyledCard>
  )
}
