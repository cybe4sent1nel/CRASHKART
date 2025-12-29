'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Mail, Lock, Smartphone, Eye, EyeOff, Shield } from 'lucide-react'
import { toast } from 'react-hot-toast'
import Swal from 'sweetalert2'

const MAIN_ADMIN_EMAIL = 'crashkart.help@gmail.com'

export default function AdminLogin() {
     const router = useRouter()
     const [step, setStep] = useState('email') // email, security-code, verification
     const [email, setEmail] = useState('')
     const [loading, setLoading] = useState(false)
     const [demoMode, setDemoMode] = useState(false)
     const [requestSent, setRequestSent] = useState(false)
     const [securityCode, setSecurityCode] = useState('')
     const [codeSent, setCodeSent] = useState(false)
     const [codeLoading, setCodeLoading] = useState(false)
     const [profileEmail, setProfileEmail] = useState(null)
     const [showEmailInput, setShowEmailInput] = useState(false)
     const [isLoggedIn, setIsLoggedIn] = useState(false)
     const [securityCodeSentOnce, setSecurityCodeSentOnce] = useState(false)

     useEffect(() => {
          // Clear any previous 2FA verification when visiting login page
          // This ensures admin must verify every time they want to access admin panel
          localStorage.removeItem('admin2FAVerified')
          sessionStorage.removeItem('admin2FAVerified')
          localStorage.removeItem('adminAuthenticated')
          sessionStorage.removeItem('adminAuthenticated')
          
          // Mark that we're processing admin login to prevent race conditions
          sessionStorage.setItem('adminLoginProcessing', 'true')

          // Load email from user profile if available (regular login or Google login)
          let userEmail = null
          
          // Check regular user data
          const userData = localStorage.getItem('user')
          if (userData) {
              try {
                  const user = JSON.parse(userData)
                  if (user.email) {
                      userEmail = user.email
                  }
              } catch (err) {
                  console.error('Error loading user profile:', err)
              }
          }
          
          // Check Google user data if regular login not found
          if (!userEmail) {
              const googleData = localStorage.getItem('googleUser')
              if (googleData) {
                  try {
                      const googleUser = JSON.parse(googleData)
                      if (googleUser.email) {
                          userEmail = googleUser.email
                      }
                  } catch (err) {
                      console.error('Error loading Google profile:', err)
                  }
              }
          }
          
          // If user email found AND they're the main admin, show security verification
          if (userEmail && userEmail === MAIN_ADMIN_EMAIL) {
              setProfileEmail(userEmail)
              setEmail(userEmail)
              setIsLoggedIn(true)
              setStep('security-code')
              // Auto-send security code for main admin (only once)
              if (!securityCodeSentOnce) {
                  sendSecurityCodeToLoggedInUser(userEmail)
                  setSecurityCodeSentOnce(true)
              }
          } else if (userEmail) {
              // Regular user logged in but trying to access admin - show request form
              setProfileEmail(userEmail)
              setEmail(userEmail)
              setIsLoggedIn(false)
              setStep('email')
          } else {
              // No user logged in - show request form
              setStep('email')
          }

          // Cleanup flag
          return () => {
              sessionStorage.removeItem('adminLoginProcessing')
          }
     }, [])

    const sendSecurityCodeToLoggedInUser = async (userEmail) => {
        try {
            const response = await fetch('/api/admin/send-security-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: userEmail })
            })
            
            const data = await response.json()
            
            if (response.ok) {
                setCodeSent(true)
                setStep('security-code')
                toast.success('Security code sent to your email!')
            } else {
                toast.error(data.message || 'Failed to send security code')
            }
        } catch (error) {
            console.error('Error sending code:', error)
            toast.error('Failed to send security code')
        }
    }

    const handleSecurityCodeSubmit = async (e) => {
         e.preventDefault()
         setCodeLoading(true)

        if (!securityCode || securityCode.length < 6) {
             toast.error('Please enter the 6-digit security code')
             setCodeLoading(false)
             return
         }

        try {
             const verifyEmail = isLoggedIn ? email : MAIN_ADMIN_EMAIL
             console.log('Verifying code for email:', verifyEmail)
             
             const response = await fetch('/api/admin/verify-security-code', {
                 method: 'POST',
                 headers: { 'Content-Type': 'application/json' },
                 body: JSON.stringify({ 
                     email: verifyEmail,
                     code: securityCode 
                 })
             })

            const data = await response.json()
            console.log('Verification response:', response.status, data)

            if (response.ok && data.success) {
                 toast.success('Security code verified!')
                 sessionStorage.setItem('adminEmail', verifyEmail)
                 sessionStorage.setItem('admin2FAVerified', 'true')
                 localStorage.setItem('adminEmail', verifyEmail)
                 localStorage.setItem('admin2FAVerified', 'true')
                 localStorage.setItem('isAdmin', 'true')
                 localStorage.setItem('adminAuthenticated', 'true')
                 
                 // Redirect immediately
                 router.push('/admin')
             } else {
                 toast.error(data.message || 'Invalid security code')
                 setCodeLoading(false)
             }
         } catch (error) {
             console.error('Error verifying code:', error)
             toast.error('Failed to verify security code')
             setCodeLoading(false)
         }
     }

    const handleEmailSubmit = async (e) => {
         e.preventDefault()
         setLoading(true)

        if (!email) {
            toast.error('Please enter email')
            setLoading(false)
            return
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
            toast.error('Please enter a valid email')
            setLoading(false)
            return
        }

        try {
            if (demoMode) {
                // Demo mode - instant access
                localStorage.setItem('adminAuthenticated', 'true')
                localStorage.setItem('adminEmail', email)
                localStorage.setItem('isDemoMode', 'true')
                toast.success('Demo mode activated!')
                setTimeout(() => {
                    router.push('/admin')
                }, 500)
            } else {
                 // Check if this is the main admin email
                 if (email === MAIN_ADMIN_EMAIL) {
                     // Main admin - require security code verification
                     setEmail(email)
                     
                     // Send security code
                     try {
                         const response = await fetch('/api/admin/send-security-code', {
                             method: 'POST',
                             headers: { 'Content-Type': 'application/json' },
                             body: JSON.stringify({ email })
                         })
                         
                         const data = await response.json()
                         
                         if (response.ok) {
                             setCodeSent(true)
                             setStep('security-code')
                             toast.success('Security code sent to your email!')
                         } else {
                             toast.error(data.message || 'Failed to send security code')
                         }
                     } catch (error) {
                         console.error('Error sending code:', error)
                         toast.error('Failed to send security code')
                     }
                 } else {
                    // Regular user - send approval request
                    const response = await fetch('/api/admin/request-access', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email })
                    })

                    const data = await response.json()

                    if (response.ok) {
                        setRequestSent(true)
                        toast.success('Access request sent!')
                        
                        // Show confirmation message
                        Swal.fire({
                            title: 'Access Request Sent',
                            html: `<p>Your admin access request has been sent to ${MAIN_ADMIN_EMAIL}</p>
                                   <p style="margin-top: 15px; color: #666; font-size: 14px;">Please wait for approval. An email will be sent to you once approved.</p>`,
                            icon: 'info',
                            confirmButtonColor: '#ef4444',
                            confirmButtonText: 'Got it!'
                        })

                        // Reset form after 2 seconds
                        setTimeout(() => {
                            setEmail('')
                            setRequestSent(false)
                        }, 2000)
                    } else {
                        toast.error(data.message || 'Failed to send request')
                    }
                }
            }
        } catch (error) {
            console.error('Error:', error)
            toast.error('An error occurred. Please try again.')
        } finally {
            setLoading(false)
        }
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
                    <p className="text-slate-600">Admin Access</p>
                </div>

                {/* Demo Mode Toggle - Only show if not logged in */}
                {!isLoggedIn && (
                    <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-semibold text-blue-900 text-sm">Demo Mode</p>
                                <p className="text-xs text-blue-700 mt-1">Test admin features without real changes</p>
                            </div>
                            <button
                                onClick={() => setDemoMode(!demoMode)}
                                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                                    demoMode ? 'bg-blue-600' : 'bg-gray-300'
                                }`}
                            >
                                <span
                                    className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                                        demoMode ? 'translate-x-7' : 'translate-x-1'
                                    }`}
                                />
                            </button>
                        </div>
                    </div>
                )}

                {/* Login Form */}
                 <div className="bg-white rounded-lg shadow-lg border border-slate-200 p-8">
                     {isLoggedIn ? (
                        // Logged-in user - Only show security code verification
                        <>
                             <h2 className="text-2xl font-bold text-slate-800 mb-2">Admin Access Verification</h2>
                             <p className="text-slate-600 text-sm mb-6">
                                 We've sent a 6-digit security code to <strong>{email}</strong>. Enter it below to verify your admin access.
                             </p>

                            <form onSubmit={handleSecurityCodeSubmit} className="space-y-4">
                                 <div>
                                     <label className="block text-sm font-medium text-slate-700 mb-2">
                                         <Shield size={16} className="inline mr-2" />
                                         Security Code
                                     </label>
                                     <input
                                         type="text"
                                         maxLength="6"
                                         value={securityCode}
                                         onChange={(e) => setSecurityCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                         placeholder="000000"
                                         className="w-full px-4 py-3 border border-slate-300 rounded-lg outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 transition text-center text-2xl tracking-widest font-mono"
                                         required
                                         autoComplete="off"
                                         autoFocus
                                     />
                                     <p className="text-xs text-slate-500 mt-2">Check your email for the 6-digit code</p>
                                 </div>

                                <button
                                     type="submit"
                                     disabled={codeLoading || securityCode.length < 6}
                                     className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold py-3 px-4 rounded-lg transition"
                                 >
                                     {codeLoading ? 'Verifying...' : 'Verify & Access Admin'}
                                 </button>

                                <button
                                     type="button"
                                     onClick={() => {
                                         setStep('email')
                                         setSecurityCode('')
                                         setCodeSent(false)
                                         setIsLoggedIn(false)
                                     }}
                                     className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold py-3 px-4 rounded-lg transition mt-2"
                                 >
                                     Use Different Email
                                 </button>
                             </form>

                            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                                 <p className="text-xs text-blue-800">
                                     <strong>Admin Access:</strong> You are logged in as an admin. Verify your identity with the security code to access the admin panel.
                                 </p>
                             </div>
                        </>
                     ) : step === 'security-code' ? (
                        // Security Code Verification Form (for non-logged-in main admin)
                        <>
                             <h2 className="text-2xl font-bold text-slate-800 mb-2">Verify Your Identity</h2>
                             <p className="text-slate-600 text-sm mb-6">
                                 We've sent a 6-digit security code to your email. Enter it below to proceed.
                             </p>

                            <form onSubmit={handleSecurityCodeSubmit} className="space-y-4">
                                 <div>
                                     <label className="block text-sm font-medium text-slate-700 mb-2">
                                         <Shield size={16} className="inline mr-2" />
                                         Security Code
                                     </label>
                                     <input
                                         type="text"
                                         maxLength="6"
                                         value={securityCode}
                                         onChange={(e) => setSecurityCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                         placeholder="000000"
                                         className="w-full px-4 py-3 border border-slate-300 rounded-lg outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 transition text-center text-2xl tracking-widest font-mono"
                                         required
                                         autoComplete="off"
                                     />
                                     <p className="text-xs text-slate-500 mt-2">Check your email for the 6-digit code</p>
                                 </div>

                                <button
                                     type="submit"
                                     disabled={codeLoading || securityCode.length < 6}
                                     className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold py-3 px-4 rounded-lg transition"
                                 >
                                     {codeLoading ? 'Verifying...' : 'Verify Code'}
                                 </button>

                                <button
                                     type="button"
                                     onClick={() => {
                                         setStep('email')
                                         setSecurityCode('')
                                         setCodeSent(false)
                                     }}
                                     className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold py-3 px-4 rounded-lg transition mt-2"
                                 >
                                     Back to Email
                                 </button>
                             </form>

                            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                                 <p className="text-xs text-blue-800">
                                     <strong>Security Notice:</strong> Only crashkart.help@gmail.com can access the main admin panel with this verification method.
                                 </p>
                             </div>
                        </>
                     ) : demoMode ? (
                         // Demo Mode Form
                         <>
                             <h2 className="text-2xl font-bold text-slate-800 mb-2">Demo Mode</h2>
                             <p className="text-slate-600 text-sm mb-6">
                                 Access a sandbox clone of the admin panel. Changes made here won't affect the real app.
                             </p>

                             {!showEmailInput && profileEmail ? (
                                 // Show profile email with option to change
                                 <div className="space-y-4">
                                     <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                         <p className="text-xs text-blue-700 mb-2">Email from your profile:</p>
                                         <p className="text-lg font-semibold text-blue-900">{profileEmail}</p>
                                     </div>

                                     <button
                                         type="button"
                                         onClick={() => setShowEmailInput(true)}
                                         className="w-full text-blue-600 hover:text-blue-700 font-medium text-sm py-2 transition"
                                     >
                                         Use Different Email
                                     </button>

                                     <button
                                         type="submit"
                                         disabled={loading}
                                         onClick={handleEmailSubmit}
                                         className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-3 px-4 rounded-lg transition"
                                     >
                                         {loading ? 'Entering Demo...' : 'Enter Demo Mode'}
                                     </button>
                                 </div>
                             ) : (
                                 // Show email input field
                                 <form onSubmit={handleEmailSubmit} className="space-y-4">
                                     <div>
                                         <label className="block text-sm font-medium text-slate-700 mb-2">
                                             <Mail size={16} className="inline mr-2" />
                                             Email Address
                                         </label>
                                         <input
                                             type="email"
                                             value={email}
                                             onChange={(e) => setEmail(e.target.value)}
                                             placeholder="Enter your email"
                                             className="w-full px-4 py-3 border border-slate-300 rounded-lg outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition"
                                             required
                                             autoFocus
                                         />
                                     </div>

                                     <button
                                         type="submit"
                                         disabled={loading}
                                         className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-3 px-4 rounded-lg transition"
                                     >
                                         {loading ? 'Entering Demo...' : 'Enter Demo Mode'}
                                     </button>

                                     {profileEmail && (
                                         <button
                                             type="button"
                                             onClick={() => {
                                                 setShowEmailInput(false)
                                                 setEmail(profileEmail)
                                             }}
                                             className="w-full text-slate-600 hover:text-slate-700 font-medium text-sm py-2 transition"
                                         >
                                             Back to Profile Email
                                         </button>
                                     )}
                                 </form>
                             )}

                            <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                <p className="text-xs text-yellow-800">
                                    <strong>Demo Info:</strong> This is a sandbox environment. You can test all features freely without affecting the live system.
                                </p>
                            </div>
                        </>
                    ) : (
                        // Production Mode Form
                        <>
                            <h2 className="text-2xl font-bold text-slate-800 mb-2">Request Admin Access</h2>
                            <p className="text-slate-600 text-sm mb-6">
                                Submit your email to request admin dashboard access. The main admin will review and approve your request.
                            </p>

                            <form onSubmit={handleEmailSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        <Mail size={16} className="inline mr-2" />
                                        Email Address
                                    </label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="your@email.com"
                                        className="w-full px-4 py-3 border border-slate-300 rounded-lg outline-none focus:border-red-600 focus:ring-2 focus:ring-red-100 transition"
                                        required
                                        disabled={requestSent}
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading || requestSent}
                                    className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold py-3 px-4 rounded-lg transition"
                                >
                                    {loading ? 'Sending Request...' : requestSent ? 'Request Sent' : 'Request Access'}
                                </button>
                            </form>

                            <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
                                <p className="text-xs text-green-800">
                                    <strong>How it works:</strong> Your request will be sent to the main admin ({MAIN_ADMIN_EMAIL}). Once approved, you'll receive an email with access credentials.
                                </p>
                            </div>
                        </>
                    )}
                </div>

                {/* Info Cards */}
                <div className="mt-6 grid grid-cols-2 gap-4">
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                        <p className="text-2xl mb-2">🔐</p>
                        <p className="text-xs font-semibold text-purple-900">Secure Access</p>
                        <p className="text-xs text-purple-700 mt-1">Two-step approval process</p>
                    </div>
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                        <p className="text-2xl mb-2">📧</p>
                        <p className="text-xs font-semibold text-orange-900">Email Approval</p>
                        <p className="text-xs text-orange-700 mt-1">Admin reviews your request</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
