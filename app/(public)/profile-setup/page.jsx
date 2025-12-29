'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { User, MapPin, Camera, Loader, Gift, Truck, Star } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ProfileSetup() {
    const router = useRouter()
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(false)
    const [profileImage, setProfileImage] = useState(null)
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        dateOfBirth: '',
        gender: '',
        address: {
            street: '',
            city: '',
            state: '',
            zip: '',
            country: 'India'
        }
    })

    useEffect(() => {
        const userData = localStorage.getItem('user')
        if (!userData) {
            router.push('/login')
            return
        }
        const parsedUser = JSON.parse(userData)
        setUser(parsedUser)
        setFormData(prev => ({
            ...prev,
            name: parsedUser.name || ''
        }))
    }, [router])

    const handleChange = (e) => {
        const { name, value } = e.target
        if (name.includes('address.')) {
            const key = name.split('.')[1]
            setFormData(prev => ({
                ...prev,
                address: { ...prev.address, [key]: value }
            }))
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }))
        }
    }

    const handleImageUpload = (e) => {
        const file = e.target.files[0]
        if (file) {
            // Convert to base64
            const reader = new FileReader()
            reader.onloadend = () => {
                setProfileImage(reader.result)
            }
            reader.readAsDataURL(file)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)

        try {
            if (!formData.name) {
                throw new Error('Name is required')
            }

            const token = localStorage.getItem('token')
            if (!token || !user) {
                throw new Error('Not authenticated')
            }

            const response = await fetch('/api/auth/setup-profile', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    userId: user.id,
                    name: formData.name,
                    phone: formData.phone,
                    dateOfBirth: formData.dateOfBirth,
                    gender: formData.gender,
                    address: formData.address,
                    profileImage
                })
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Failed to setup profile')
            }

            // Update localStorage with new user data
             localStorage.setItem('user', JSON.stringify(data.user))
             
             // Dispatch event to notify all components about profile update
             window.dispatchEvent(new Event('storage'));
             window.dispatchEvent(new Event('profileUpdated'));
             
             toast.success('Profile setup completed!')
             router.push('/')

        } catch (error) {
            toast.error(error.message)
        } finally {
            setLoading(false)
        }
    }

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader className="animate-spin" size={40} />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-blue-50 py-10">
            <div className="max-w-2xl mx-auto px-4">
                <div className="bg-white rounded-lg shadow-lg p-8">
                    <div className="text-center mb-8">
                        <div className="flex items-center justify-center gap-3 mb-2">
                            <img src="/logo.bmp" alt="CrashKart" className="w-12 h-12" />
                            <h1 className="text-4xl font-bold text-slate-800">
                                Complete Your Profile
                            </h1>
                        </div>
                        <p className="text-slate-600">Help us know you better to provide better service</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Profile Image */}
                        <div className="flex justify-center mb-8">
                            <div className="relative">
                                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-red-300 to-blue-300 flex items-center justify-center overflow-hidden">
                                    {profileImage ? (
                                        <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <User size={60} className="text-white" />
                                    )}
                                </div>
                                <label className="absolute bottom-0 right-0 bg-red-600 hover:bg-red-700 text-white rounded-full p-3 cursor-pointer transition">
                                    <Camera size={20} />
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        className="hidden"
                                    />
                                </label>
                            </div>
                        </div>

                        {/* Basic Info */}
                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Full Name *
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    disabled={loading}
                                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 disabled:bg-slate-100"
                                    placeholder="Your full name"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Phone Number
                                </label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    disabled={loading}
                                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 disabled:bg-slate-100"
                                    placeholder="+91 9876543210"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Date of Birth
                                </label>
                                <input
                                    type="date"
                                    name="dateOfBirth"
                                    value={formData.dateOfBirth}
                                    onChange={handleChange}
                                    disabled={loading}
                                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 disabled:bg-slate-100"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Gender
                                </label>
                                <select
                                    name="gender"
                                    value={formData.gender}
                                    onChange={handleChange}
                                    disabled={loading}
                                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 disabled:bg-slate-100"
                                >
                                    <option value="">Select Gender</option>
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                        </div>

                        {/* Address */}
                        <div className="border-t pt-6">
                            <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                                <MapPin size={20} />
                                Default Address
                            </h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Street Address
                                    </label>
                                    <input
                                        type="text"
                                        name="address.street"
                                        value={formData.address.street}
                                        onChange={handleChange}
                                        disabled={loading}
                                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 disabled:bg-slate-100"
                                        placeholder="123 Main Street"
                                    />
                                </div>

                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">
                                            City
                                        </label>
                                        <input
                                            type="text"
                                            name="address.city"
                                            value={formData.address.city}
                                            onChange={handleChange}
                                            disabled={loading}
                                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 disabled:bg-slate-100"
                                            placeholder="Mumbai"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">
                                            State
                                        </label>
                                        <input
                                            type="text"
                                            name="address.state"
                                            value={formData.address.state}
                                            onChange={handleChange}
                                            disabled={loading}
                                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 disabled:bg-slate-100"
                                            placeholder="Maharashtra"
                                        />
                                    </div>
                                </div>

                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">
                                            ZIP Code
                                        </label>
                                        <input
                                            type="text"
                                            name="address.zip"
                                            value={formData.address.zip}
                                            onChange={handleChange}
                                            disabled={loading}
                                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 disabled:bg-slate-100"
                                            placeholder="400001"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">
                                            Country
                                        </label>
                                        <input
                                            type="text"
                                            name="address.country"
                                            value={formData.address.country}
                                            onChange={handleChange}
                                            disabled={loading}
                                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 disabled:bg-slate-100"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="flex gap-4 pt-6 border-t">
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2"
                            >
                                {loading && <Loader size={20} className="animate-spin" />}
                                {loading ? 'Setting Up...' : 'Complete Profile'}
                            </button>

                            <button
                                type="button"
                                onClick={() => router.push('/')}
                                disabled={loading}
                                className="flex-1 border-2 border-slate-300 hover:border-slate-400 text-slate-700 font-semibold py-3 rounded-lg transition"
                            >
                                Skip for Now
                            </button>
                        </div>
                    </form>
                </div>

                {/* Info Cards */}
                <div className="grid md:grid-cols-3 gap-4 mt-8">
                    <div className="bg-white rounded-lg shadow p-6 text-center">
                        <div className="flex justify-center mb-2">
                            <Gift size={32} className="text-red-500" />
                        </div>
                        <p className="text-slate-700 text-sm"><strong>Complete Profile</strong> and get exclusive offers</p>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6 text-center">
                        <div className="flex justify-center mb-2">
                            <Truck size={32} className="text-blue-500" />
                        </div>
                        <p className="text-slate-700 text-sm"><strong>Easy Checkout</strong> with saved address</p>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6 text-center">
                        <div className="flex justify-center mb-2">
                            <Star size={32} className="text-yellow-500" />
                        </div>
                        <p className="text-slate-700 text-sm"><strong>Better Experience</strong> tailored for you</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
