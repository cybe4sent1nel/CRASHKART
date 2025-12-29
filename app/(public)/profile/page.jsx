'use client'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Edit2, Save, X, User, Mail, Phone, MapPin, Camera, Shield, ShoppingBag, Heart, CreditCard, LogOut, Settings, Bell, Gift, Coins, MessageSquare, Tag, Package, Megaphone, Star } from 'lucide-react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import toast from 'react-hot-toast'
import NeonCheckbox from '@/components/NeonCheckbox'
import AddressForm from '@/components/AddressForm'
import MyReviews from '@/components/MyReviews'

export default function Profile() {
    const router = useRouter()
    const fileInputRef = useRef(null)
    const [user, setUser] = useState(null)
    const [isEditing, setIsEditing] = useState(false)
    const [loading, setLoading] = useState(false)
    const [uploadingImage, setUploadingImage] = useState(false)
    const [showAddressForm, setShowAddressForm] = useState(false)
    const [addresses, setAddresses] = useState([])
    const [loadingAddresses, setLoadingAddresses] = useState(false)
    const [activeSection, setActiveSection] = useState('profile')
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        address: ''
    })

    // Notification preferences
    const [notifications, setNotifications] = useState({
        orderUpdates: true,
        promotions: false,
        priceDrops: true,
        newProducts: false,
        emailNotifications: true,
        smsNotifications: false,
        pushNotifications: true
    })

    useEffect(() => {
        const userData = localStorage.getItem('user')
        if (!userData) {
            router.push('/login')
        } else {
            const parsedUser = JSON.parse(userData)
            setUser(parsedUser)
            setFormData({
                name: parsedUser.name || '',
                email: parsedUser.email || '',
                phone: parsedUser.phone || '',
                address: parsedUser.address || ''
            })
            // Load saved notification preferences
            const savedNotifications = localStorage.getItem('notificationPreferences')
            if (savedNotifications) {
                setNotifications(JSON.parse(savedNotifications))
            }
            // Fetch addresses
            fetchAddresses()
        }
    }, [router])

    const fetchAddresses = async () => {
        setLoadingAddresses(true)
        try {
            const userData = localStorage.getItem('user')
            if (!userData) {
                setLoadingAddresses(false)
                return
            }
            
            const user = JSON.parse(userData)
            const email = user.email
            
            if (!email) {
                setLoadingAddresses(false)
                return
            }
            
            const token = localStorage.getItem('token')
            const response = await fetch('/api/user/addresses', {
                headers: {
                    'x-user-email': email,
                    ...(token && { 'Authorization': `Bearer ${token}` })
                }
            })

            if (response.ok) {
                const data = await response.json()
                setAddresses(data.addresses || [])
            }
        } catch (error) {
            console.error('Error fetching addresses:', error)
        } finally {
            setLoadingAddresses(false)
        }
    }

    const handleNotificationChange = (key) => {
        const newNotifications = { ...notifications, [key]: !notifications[key] }
        setNotifications(newNotifications)
        localStorage.setItem('notificationPreferences', JSON.stringify(newNotifications))
        toast.success('Notification preference updated!')
    }

    const handleDeleteAddress = async (addressId) => {
        toast((t) => (
            <div className="flex flex-col gap-3">
                <p className="font-semibold">Delete this address?</p>
                <div className="flex gap-2">
                    <button
                        onClick={async () => {
                            toast.dismiss(t.id)
                            try {
                                const userData = localStorage.getItem('user')
                                if (!userData) {
                                    toast.error('Please login to delete address')
                                    return
                                }

                                const user = JSON.parse(userData)
                                const email = user.email

                                const token = localStorage.getItem('token')
                                const response = await fetch(`/api/user/addresses?id=${addressId}`, {
                                    method: 'DELETE',
                                    headers: {
                                        'x-user-email': email,
                                        ...(token && { 'Authorization': `Bearer ${token}` })
                                    }
                                })

                                if (response.ok) {
                                    toast.success('Address deleted successfully!')
                                    // Refresh addresses list
                                    fetchAddresses()
                                } else {
                                    const error = await response.json()
                                    toast.error(error.error || 'Failed to delete address')
                                }
                            } catch (error) {
                                console.error('Error deleting address:', error)
                                toast.error('Failed to delete address')
                            }
                        }}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                    >
                        Delete
                    </button>
                    <button
                        onClick={() => toast.dismiss(t.id)}
                        className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        ))
    }

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        })
    }

    const handleImageUpload = async (e) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast.error('Please select an image file')
            return
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error('Image size should be less than 5MB')
            return
        }

        setUploadingImage(true)
        const loadingToast = toast.loading('Uploading image...')

        try {
            // Convert image to base64
            const reader = new FileReader()
            reader.readAsDataURL(file)
            
            reader.onload = async () => {
                try {
                    const base64Image = reader.result
                    const token = localStorage.getItem('token')

                    // Update user profile with new image
                    const response = await fetch('/api/user/profile', {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'x-user-email': user.email,
                            ...(token && { 'Authorization': `Bearer ${token}` })
                        },
                        body: JSON.stringify({
                            email: user.email,
                            image: base64Image
                        })
                    })

                    if (!response.ok) throw new Error('Upload failed')

                    const data = await response.json()
                    
                    // Update user image in localStorage and state
                    const updatedUser = { ...user, image: base64Image }
                    localStorage.setItem('user', JSON.stringify(updatedUser))
                    setUser(updatedUser)
                    
                    toast.success('Profile image updated!', { id: loadingToast })
                    setUploadingImage(false)
                } catch (error) {
                    console.error('Error uploading image:', error)
                    toast.error('Failed to upload image', { id: loadingToast })
                    setUploadingImage(false)
                }
            }

            reader.onerror = () => {
                toast.error('Failed to read image', { id: loadingToast })
                setUploadingImage(false)
            }
        } catch (error) {
            console.error('Error uploading image:', error)
            toast.error('Failed to upload image', { id: loadingToast })
            setUploadingImage(false)
        }
    }

    const handleSave = async () => {
        setLoading(true)
        try {
            // Get token for authorization
            const token = localStorage.getItem('token')
            
            // Save to database via API
            const response = await fetch('/api/user/profile', {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email || user?.email,
                    phone: formData.phone,
                    address: formData.address
                })
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                console.error('Profile update error:', { status: response.status, data: errorData })
                throw new Error(errorData.details || `Failed to save profile (${response.status})`)
            }

            const updatedUserData = await response.json()

            // Update localStorage as well for offline access
            const updatedUser = { ...user, ...formData }
            localStorage.setItem('user', JSON.stringify(updatedUser))
            setUser(updatedUser)
            setIsEditing(false)
            toast.success('Profile updated successfully!')
        } catch (error) {
            console.error('Error saving profile:', error)
            toast.error(error.message || 'Failed to update profile')
        } finally {
            setLoading(false)
        }
    }

    const handleLogout = () => {
        localStorage.removeItem('user')
        toast.success('Logged out successfully')
        router.push('/login')
    }

    if (!user) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
        </div>
    )

    const quickLinks = [
        { icon: ShoppingBag, label: 'My Orders', href: '/my-orders', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-500' },
        { icon: Heart, label: 'Wishlist', href: '/wishlist', color: 'bg-red-100 dark:bg-red-900/30 text-red-500' },
        { icon: Gift, label: 'Rewards', href: '/rewards', color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-500' },
        { icon: Coins, label: 'Crash Cash', href: '/crash-cash', color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-500' },
        { icon: MapPin, label: 'Addresses', href: '/profile', color: 'bg-green-100 dark:bg-green-900/30 text-green-500' },
        { icon: CreditCard, label: 'Payments', href: '/profile', color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-500' },
    ]

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-8">
            <div className="max-w-5xl mx-auto px-4 sm:px-6">
                {/* Profile Header */}
                <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-r from-red-500 to-orange-500 rounded-2xl p-6 sm:p-8 mb-6 text-white relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                    <div className="relative flex flex-col sm:flex-row items-center gap-6">
                        <div className="relative">
                            <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center">
                                {user.image ? (
                                    <img src={user.image} alt={user.name} className="w-full h-full rounded-full object-cover" />
                                ) : (
                                    <User className="w-12 h-12 text-white" />
                                )}
                            </div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="hidden"
                            />
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploadingImage}
                                className="absolute bottom-0 right-0 p-2 bg-white rounded-full text-red-500 shadow-lg hover:scale-110 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {uploadingImage ? (
                                    <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <Camera className="w-4 h-4" />
                                )}
                            </button>
                        </div>
                        <div className="text-center sm:text-left">
                            <h1 className="text-2xl sm:text-3xl font-bold">{formData.name || 'User'}</h1>
                            <p className="text-white/80 flex items-center gap-2 justify-center sm:justify-start mt-1">
                                <Mail className="w-4 h-4" />
                                {formData.email}
                            </p>
                            {formData.phone && (
                                <p className="text-white/80 flex items-center gap-2 justify-center sm:justify-start mt-1">
                                    <Phone className="w-4 h-4" />
                                    {formData.phone}
                                </p>
                            )}
                        </div>
                    </div>
                </motion.div>

                {/* Quick Links */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="grid grid-cols-3 sm:grid-cols-6 gap-4 mb-6"
                >
                    {quickLinks.map((link, index) => (
                        <Link
                            key={index}
                            href={link.href}
                            className="bg-white dark:bg-slate-800 rounded-xl p-4 flex flex-col items-center gap-2 hover:shadow-lg transition-all group"
                        >
                            <div className={`p-3 rounded-xl ${link.color} group-hover:scale-110 transition-transform`}>
                                <link.icon className="w-6 h-6" />
                            </div>
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{link.label}</span>
                        </Link>
                    ))}
                </motion.div>

                {/* Section Tabs */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="flex gap-2 mb-6 overflow-x-auto pb-2"
                >
                    <button
                        onClick={() => setActiveSection('profile')}
                        className={`px-6 py-3 rounded-xl font-medium transition whitespace-nowrap ${
                            activeSection === 'profile'
                                ? 'bg-red-500 text-white shadow-lg'
                                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                        }`}
                    >
                        Profile Information
                    </button>
                    <button
                        onClick={() => setActiveSection('reviews')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition whitespace-nowrap ${
                            activeSection === 'reviews'
                                ? 'bg-red-500 text-white shadow-lg'
                                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                        }`}
                    >
                        <Star size={18} />
                        My Reviews
                    </button>
                </motion.div>

                {/* Conditional Content */}
                {activeSection === 'reviews' ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <MyReviews />
                    </motion.div>
                ) : (
                <>
                {/* Profile Form */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg overflow-hidden"
                >
                    <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg">
                                <Settings className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                            </div>
                            <h2 className="text-xl font-semibold text-slate-800 dark:text-white">
                                {isEditing ? 'Edit Profile' : 'Profile Information'}
                            </h2>
                        </div>
                        {!isEditing ? (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl transition font-medium"
                            >
                                <Edit2 size={16} />
                                Edit
                            </button>
                        ) : (
                            <button
                                onClick={() => setIsEditing(false)}
                                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition"
                            >
                                <X size={20} className="text-slate-500" />
                            </button>
                        )}
                    </div>

                    <div className="p-6">
                        {!isEditing ? (
                            <div className="grid sm:grid-cols-2 gap-6">
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg">
                                        <User className="w-5 h-5 text-slate-500" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Full Name</p>
                                        <p className="text-slate-800 dark:text-white font-medium">{formData.name || 'Not provided'}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg">
                                        <Mail className="w-5 h-5 text-slate-500" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Email Address</p>
                                        <p className="text-slate-800 dark:text-white font-medium">{formData.email}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg">
                                        <Phone className="w-5 h-5 text-slate-500" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Phone Number</p>
                                        <p className="text-slate-800 dark:text-white font-medium">{formData.phone || 'Not provided'}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg">
                                        <MapPin className="w-5 h-5 text-slate-500" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Address</p>
                                        <p className="text-slate-800 dark:text-white font-medium">{formData.address || 'Not provided'}</p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <form className="space-y-5">
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        <User className="w-4 h-4" />
                                        Full Name
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 transition"
                                        placeholder="Enter your name"
                                    />
                                </div>
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        <Mail className="w-4 h-4" />
                                        Email Address
                                    </label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        disabled
                                        className="w-full px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-500 cursor-not-allowed"
                                    />
                                    <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                                        <Shield className="w-3 h-3" />
                                        Email cannot be changed for security reasons
                                    </p>
                                </div>
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        <Phone className="w-4 h-4" />
                                        Phone Number
                                    </label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 transition"
                                        placeholder="Enter your phone number"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        <MapPin className="w-4 h-4" />
                                        Address
                                    </label>
                                    <div className="flex gap-2">
                                        <textarea
                                            name="address"
                                            value={formData.address}
                                            onChange={handleChange}
                                            className="flex-1 px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 transition resize-none"
                                            placeholder="Enter your address"
                                            rows="3"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowAddressForm(true)}
                                            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition flex items-center gap-2 whitespace-nowrap"
                                        >
                                            <MapPin size={18} />
                                            Pick on Map
                                        </button>
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={handleSave}
                                        disabled={loading}
                                        className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-600 disabled:bg-green-400 text-white rounded-xl transition font-medium"
                                    >
                                        {loading ? (
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        ) : (
                                            <>
                                                <Save size={18} />
                                                Save Changes
                                            </>
                                        )}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIsEditing(false)}
                                        className="px-6 py-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl transition font-medium"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </motion.div>

                {/* Saved Addresses */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.23 }}
                    className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg overflow-hidden mt-6"
                >
                    <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg">
                                <MapPin className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                            </div>
                            <h2 className="text-xl font-semibold text-slate-800 dark:text-white">
                                Saved Addresses
                            </h2>
                        </div>
                        <button
                            onClick={() => setShowAddressForm(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl transition font-medium"
                        >
                            <MapPin size={16} />
                            Add New
                        </button>
                    </div>

                    <div className="p-6">
                        {loadingAddresses ? (
                            <div className="flex justify-center py-8">
                                <div className="w-8 h-8 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin"></div>
                            </div>
                        ) : addresses.length === 0 ? (
                            <div className="text-center py-12">
                                <MapPin className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                                <p className="text-slate-500 dark:text-slate-400 mb-4">No saved addresses yet</p>
                                <button
                                    onClick={() => setShowAddressForm(true)}
                                    className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl transition"
                                >
                                    Add Your First Address
                                </button>
                            </div>
                        ) : (
                            <div className="grid sm:grid-cols-2 gap-4">
                                {addresses.map((address) => (
                                    <div 
                                        key={address.id}
                                        className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 hover:border-red-500 transition"
                                    >
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <MapPin className="w-4 h-4 text-red-500" />
                                                <span className="font-semibold text-slate-800 dark:text-white">{address.type || 'Address'}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {address.isDefault && (
                                                    <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-xs rounded-full">
                                                        Default
                                                    </span>
                                                )}
                                                <button
                                                    onClick={() => handleDeleteAddress(address.id)}
                                                    className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition group"
                                                    title="Delete address"
                                                >
                                                    <X className="w-4 h-4 text-slate-400 group-hover:text-red-500 transition" />
                                                </button>
                                            </div>
                                        </div>
                                        <p className="text-sm text-slate-600 dark:text-slate-300 mb-2">{address.name}</p>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
                                            {address.street}, {address.city}, {address.state} {address.zip}
                                        </p>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">
                                            <Phone className="w-3 h-3 inline mr-1" />
                                            {address.phone}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Notification Preferences */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg overflow-hidden mt-6"
                >
                    <div className="flex items-center gap-3 p-6 border-b border-slate-200 dark:border-slate-700">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                            <Bell className="w-5 h-5 text-purple-500" />
                        </div>
                        <h2 className="text-xl font-semibold text-slate-800 dark:text-white">Notification Preferences</h2>
                    </div>

                    <div className="p-6 space-y-6">
                        {/* Notification Types */}
                        <div>
                            <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-4">What notifications would you like to receive?</h3>
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-900 rounded-xl">
                                    <NeonCheckbox 
                                        checked={notifications.orderUpdates}
                                        onChange={() => handleNotificationChange('orderUpdates')}
                                        size={20}
                                    />
                                    <div className="flex items-center gap-2 flex-1">
                                        <Package className="w-5 h-5 text-blue-500" />
                                        <div>
                                            <p className="text-slate-800 dark:text-white font-medium text-sm">Order Updates</p>
                                            <p className="text-slate-500 dark:text-slate-400 text-xs">Shipping, delivery status</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-900 rounded-xl">
                                    <NeonCheckbox 
                                        checked={notifications.promotions}
                                        onChange={() => handleNotificationChange('promotions')}
                                        size={20}
                                    />
                                    <div className="flex items-center gap-2 flex-1">
                                        <Megaphone className="w-5 h-5 text-orange-500" />
                                        <div>
                                            <p className="text-slate-800 dark:text-white font-medium text-sm">Promotions & Offers</p>
                                            <p className="text-slate-500 dark:text-slate-400 text-xs">Sales, discounts, special deals</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-900 rounded-xl">
                                    <NeonCheckbox 
                                        checked={notifications.priceDrops}
                                        onChange={() => handleNotificationChange('priceDrops')}
                                        size={20}
                                    />
                                    <div className="flex items-center gap-2 flex-1">
                                        <Tag className="w-5 h-5 text-green-500" />
                                        <div>
                                            <p className="text-slate-800 dark:text-white font-medium text-sm">Price Drop Alerts</p>
                                            <p className="text-slate-500 dark:text-slate-400 text-xs">Wishlist item price changes</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-900 rounded-xl">
                                    <NeonCheckbox 
                                        checked={notifications.newProducts}
                                        onChange={() => handleNotificationChange('newProducts')}
                                        size={20}
                                    />
                                    <div className="flex items-center gap-2 flex-1">
                                        <Gift className="w-5 h-5 text-pink-500" />
                                        <div>
                                            <p className="text-slate-800 dark:text-white font-medium text-sm">New Products</p>
                                            <p className="text-slate-500 dark:text-slate-400 text-xs">New arrivals & launches</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Notification Channels */}
                        <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                            <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-4">How would you like to be notified?</h3>
                            <div className="space-y-3">
                                <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-900 rounded-xl">
                                    <NeonCheckbox 
                                        checked={notifications.emailNotifications}
                                        onChange={() => handleNotificationChange('emailNotifications')}
                                        size={20}
                                    />
                                    <div className="flex items-center gap-2 flex-1">
                                        <Mail className="w-5 h-5 text-red-500" />
                                        <div>
                                            <p className="text-slate-800 dark:text-white font-medium text-sm">Email Notifications</p>
                                            <p className="text-slate-500 dark:text-slate-400 text-xs">{formData.email || 'Not set'}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-900 rounded-xl">
                                    <NeonCheckbox 
                                        checked={notifications.smsNotifications}
                                        onChange={() => handleNotificationChange('smsNotifications')}
                                        size={20}
                                    />
                                    <div className="flex items-center gap-2 flex-1">
                                        <MessageSquare className="w-5 h-5 text-green-500" />
                                        <div>
                                            <p className="text-slate-800 dark:text-white font-medium text-sm">SMS Notifications</p>
                                            <p className="text-slate-500 dark:text-slate-400 text-xs">{formData.phone || 'Add phone number to enable'}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-900 rounded-xl">
                                    <NeonCheckbox 
                                        checked={notifications.pushNotifications}
                                        onChange={() => handleNotificationChange('pushNotifications')}
                                        size={20}
                                    />
                                    <div className="flex items-center gap-2 flex-1">
                                        <Bell className="w-5 h-5 text-purple-500" />
                                        <div>
                                            <p className="text-slate-800 dark:text-white font-medium text-sm">Push Notifications</p>
                                            <p className="text-slate-500 dark:text-slate-400 text-xs">Browser & app notifications</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Logout Button */}
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="mt-6"
                >
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 rounded-xl transition font-medium border border-slate-200 dark:border-slate-700"
                    >
                        <LogOut size={18} />
                        Logout
                    </button>
                </motion.div>
                </>
                )}

            </div>

            {/* Address Form Modal with Location Picker */}
            {showAddressForm && (
                <AddressForm
                    onSave={() => {
                        setShowAddressForm(false)
                        toast.success('Address saved successfully!')
                        // Refresh addresses list
                        fetchAddresses()
                    }}
                    onClose={() => setShowAddressForm(false)}
                />
            )}
        </div>
    )
}