'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Mail, Lock, User as UserIcon, AlertTriangle } from 'lucide-react'
import { toast } from 'react-hot-toast'

export default function AdminSetup() {
    const router = useRouter()
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [loading, setLoading] = useState(false)

    const handleCreateAdmin = async (e) => {
        e.preventDefault()
        setLoading(true)

        if (!name || !email || !password || !confirmPassword) {
            toast.error('Please fill all fields')
            setLoading(false)
            return
        }

        if (password !== confirmPassword) {
            toast.error('Passwords do not match')
            setLoading(false)
            return
        }

        if (password.length < 6) {
            toast.error('Password must be at least 6 characters')
            setLoading(false)
            return
        }

        try {
            const response = await fetch('/api/admin/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password })
            })

            const data = await response.json()

            if (!response.ok) {
                toast.error(data.error || 'Failed to create admin')
                setLoading(false)
                return
            }

            toast.success('Admin account created! Redirecting to login...')
            setTimeout(() => {
                router.push('/admin/login')
            }, 1500)
        } catch (error) {
            toast.error('An error occurred. Please try again.')
            console.error(error)
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
                    <p className="text-slate-600">Admin Setup</p>
                </div>

                {/* Setup Form */}
                <div className="bg-white rounded-lg shadow-lg border border-slate-200 p-8">
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">Create Admin Account</h2>
                    <p className="text-slate-600 text-sm mb-6">Set up your first admin account</p>
                    
                    <form onSubmit={handleCreateAdmin} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                <UserIcon size={16} className="inline mr-2" />
                                Full Name
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Enter your full name"
                                className="w-full px-4 py-3 border border-slate-300 rounded-lg outline-none focus:border-red-600 focus:ring-2 focus:ring-red-100 transition"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                <Mail size={16} className="inline mr-2" />
                                Admin Email
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter your admin email"
                                className="w-full px-4 py-3 border border-slate-300 rounded-lg outline-none focus:border-red-600 focus:ring-2 focus:ring-red-100 transition"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                <Lock size={16} className="inline mr-2" />
                                Password
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter a strong password"
                                className="w-full px-4 py-3 border border-slate-300 rounded-lg outline-none focus:border-red-600 focus:ring-2 focus:ring-red-100 transition"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                <Lock size={16} className="inline mr-2" />
                                Confirm Password
                            </label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Confirm your password"
                                className="w-full px-4 py-3 border border-slate-300 rounded-lg outline-none focus:border-red-600 focus:ring-2 focus:ring-red-100 transition"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold py-3 px-4 rounded-lg transition"
                        >
                            {loading ? 'Creating Admin...' : 'Create Admin Account'}
                        </button>
                    </form>
                </div>

                {/* Info */}
                <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <p className="text-xs text-amber-800 flex items-center gap-2">
                        <AlertTriangle size={16} className="text-amber-600" />
                        <span><strong>Important:</strong> This page should be protected or removed after initial setup</span>
                    </p>
                </div>
            </div>
        </div>
    )
}
