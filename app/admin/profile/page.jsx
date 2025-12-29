'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Camera, Save, ArrowLeft, Check } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'react-hot-toast'
import Image from 'next/image'
import { assets } from '@/assets/assets'

export default function AdminProfile() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [profileData, setProfileData] = useState({
        name: 'Fahad Khan',
        email: 'fahad@crashkart.dev',
        phone: '+91 9876543210',
        company: 'CrashKart Admin',
        bio: 'Administrator of CrashKart Platform',
        avatar: null
    })

    useEffect(() => {
        // Check if admin is authenticated
        const isAuthenticated = localStorage.getItem('adminAuthenticated')
        if (!isAuthenticated) {
            router.push('/admin/login')
            return
        }
        
        // Load saved profile data if exists
        const savedProfile = localStorage.getItem('adminProfile')
        if (savedProfile) {
            setProfileData(JSON.parse(savedProfile))
        }
        
        setLoading(false)
    }, [router])

    const handleChange = (e) => {
        const { name, value } = e.target
        setProfileData(prev => ({
            ...prev,
            [name]: value
        }))
    }

    const handleAvatarChange = (e) => {
        const file = e.target.files[0]
        if (file) {
            const reader = new FileReader()
            reader.onloadend = () => {
                setProfileData(prev => ({
                    ...prev,
                    avatar: reader.result
                }))
            }
            reader.readAsDataURL(file)
        }
    }

    const handleSave = async (e) => {
        e.preventDefault()
        setSaving(true)

        // Validate
        if (!profileData.name || !profileData.email || !profileData.phone) {
            toast.error('Please fill all required fields')
            setSaving(false)
            return
        }

        // Save to localStorage
        localStorage.setItem('adminProfile', JSON.stringify(profileData))
        
        // Trigger storage event for other components (sidebar)
        window.dispatchEvent(new Event('profileUpdated'))
        
        toast.success('Profile updated successfully!')
        setSaving(false)
        
        // Refresh sidebar after a short delay
        setTimeout(() => {
            window.dispatchEvent(new Event('storage'))
        }, 300)
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-slate-600">Loading...</div>
            </div>
        )
    }

    return (
        <div className="max-w-2xl mx-auto">
            <Link href="/admin" className="flex items-center gap-2 text-slate-600 hover:text-slate-800 mb-6">
                <ArrowLeft size={18} />
                Back to Dashboard
            </Link>

            <div className="bg-white rounded-lg shadow border border-slate-200 overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-red-50 to-red-100 px-8 py-6">
                    <h1 className="text-3xl font-bold text-slate-800">Update Profile</h1>
                    <p className="text-slate-600 mt-1">Manage your admin account information</p>
                </div>

                {/* Content */}
                <form onSubmit={handleSave} className="p-8 space-y-8">
                    {/* Avatar Section */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-4">Profile Picture</label>
                        <div className="flex items-center gap-6">
                            <div className="relative">
                                <div className="w-24 h-24 rounded-full object-cover border-4 border-red-200 bg-gradient-to-br from-red-200 to-red-300 flex items-center justify-center overflow-hidden">
                                    {profileData.avatar ? (
                                        <img
                                            src={profileData.avatar}
                                            alt="Profile"
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="text-white text-4xl font-bold">
                                            {profileData.name?.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                <label htmlFor="avatar" className="absolute bottom-0 right-0 bg-red-600 hover:bg-red-700 text-white p-2 rounded-full cursor-pointer transition">
                                    <Camera size={16} />
                                    <input
                                        id="avatar"
                                        type="file"
                                        accept="image/*"
                                        onChange={handleAvatarChange}
                                        hidden
                                    />
                                </label>
                            </div>
                            <div>
                                <p className="text-sm text-slate-600">Upload a new profile picture</p>
                                <p className="text-xs text-slate-500 mt-1">Max file size: 5MB</p>
                            </div>
                        </div>
                    </div>

                    {/* Form Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Full Name *</label>
                            <input
                                type="text"
                                name="name"
                                value={profileData.name}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:border-red-600 focus:ring-2 focus:ring-red-100 transition"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Email *</label>
                            <input
                                type="email"
                                name="email"
                                value={profileData.email}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:border-red-600 focus:ring-2 focus:ring-red-100 transition bg-slate-50"
                                disabled
                            />
                            <p className="text-xs text-slate-500 mt-1">Email cannot be changed</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Phone *</label>
                            <input
                                type="tel"
                                name="phone"
                                value={profileData.phone}
                                onChange={handleChange}
                                placeholder="+91 XXXXX XXXXX"
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:border-red-600 focus:ring-2 focus:ring-red-100 transition"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Company</label>
                            <input
                                type="text"
                                name="company"
                                value={profileData.company}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:border-red-600 focus:ring-2 focus:ring-red-100 transition"
                            />
                        </div>
                    </div>

                    {/* Bio */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Bio</label>
                        <textarea
                            name="bio"
                            value={profileData.bio}
                            onChange={handleChange}
                            rows={4}
                            placeholder="Tell us about yourself..."
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:border-red-600 focus:ring-2 focus:ring-red-100 transition resize-none"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-4 pt-6 border-t border-slate-200">
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-6 py-3 rounded-lg font-medium transition"
                        >
                            <Save size={18} />
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                        <Link
                            href="/admin"
                            className="flex items-center gap-2 bg-slate-200 hover:bg-slate-300 text-slate-800 px-6 py-3 rounded-lg font-medium transition"
                        >
                            Cancel
                        </Link>
                    </div>
                </form>

                {/* Security Section */}
                <div className="border-t border-slate-200 px-8 py-6 bg-slate-50">
                    <h2 className="text-lg font-semibold text-slate-800 mb-4">Security</h2>
                    <div className="space-y-3">
                        <p className="text-sm text-slate-600 flex items-center gap-2">
                            <Check size={16} className="text-green-600" /> Two-Factor Authentication (2FA) is enabled for your account
                        </p>
                        <p className="text-xs text-slate-500">
                            You must verify your email with an OTP code every time you access the admin panel
                        </p>
                        <button
                            onClick={() => {
                                localStorage.removeItem('adminAuthenticated')
                                router.push('/admin/login')
                            }}
                            className="text-red-600 hover:text-red-700 text-sm font-medium"
                        >
                            Re-authenticate
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
