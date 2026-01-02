'use client'

import { usePathname } from "next/navigation"
import { HomeIcon, ShieldCheckIcon, StoreIcon, TicketPercentIcon, Users, MessageCircle, Package, AlertCircle, TrendingUp, Mail, Phone, MapPin, ChevronDown, Search, X, Flame, Coins, CreditCard } from "lucide-react"
import Link from "next/link"
import { assets } from "@/assets/assets"
import { useState, useEffect } from "react"
import Image from "next/image"

const AdminSidebar = () => {

    const pathname = usePathname()
    const [selectedUser, setSelectedUser] = useState(null)
    const [usersList, setUsersList] = useState([])
    const [searchQuery, setSearchQuery] = useState('')
    const [showUserList, setShowUserList] = useState(false)
    const [loadingUsers, setLoadingUsers] = useState(false)
    const [adminProfile, setAdminProfile] = useState({
        name: 'Admin',
        avatar: null
    })

    // Load admin profile from localStorage
    useEffect(() => {
        const loadProfile = () => {
            const savedProfile = localStorage.getItem('adminProfile')
            if (savedProfile) {
                const profile = JSON.parse(savedProfile)
                setAdminProfile({
                    name: profile.name || 'Admin',
                    avatar: profile.avatar || null
                })
            }
        }
        
        loadProfile()
        
        // Listen for profile updates
        const handleProfileUpdate = () => {
            loadProfile()
        }
        
        window.addEventListener('storage', handleProfileUpdate)
        window.addEventListener('profileUpdated', handleProfileUpdate)
        
        return () => {
            window.removeEventListener('storage', handleProfileUpdate)
            window.removeEventListener('profileUpdated', handleProfileUpdate)
        }
    }, [])

    const sidebarLinks = [
        { name: 'Dashboard', href: '/admin', icon: HomeIcon, group: 'Main' },
        { name: 'Products', href: '/admin/products', icon: Package, group: 'Management' },
        { name: 'Stores', href: '/admin/stores', icon: StoreIcon, group: 'Management' },
        { name: 'Approve Store', href: '/admin/approve', icon: ShieldCheckIcon, group: 'Management' },
        { name: 'Customers', href: '/admin/customers', icon: Users, group: 'Management' },
         { name: 'Inventory', href: '/admin/inventory-management', icon: Package, group: 'Operations' },
         { name: 'Feedback', href: '/admin/feedback', icon: MessageCircle, group: 'Support' },
        { name: 'Complaints', href: '/admin/complaints', icon: AlertCircle, group: 'Support' },
        { name: 'Coupons', href: '/admin/coupons', icon: TicketPercentIcon, group: 'Promotions' },
        { name: 'Charges', href: '/admin/charges', icon: CreditCard, group: 'Management' },
        { name: 'Flash Sales', href: '/admin/flash-sales', icon: Flame, group: 'Promotions' },
        { name: 'CrashCash', href: '/admin/crashcash', icon: Coins, group: 'Promotions' },
        { name: 'Analytics', href: '/admin/events', icon: TrendingUp, group: 'Reports' },
    ]

    // Fetch users list
    const fetchUsers = async (query = '') => {
        setLoadingUsers(true)
        try {
            const response = await fetch(`/api/admin/users?search=${encodeURIComponent(query)}`)
            if (response.ok) {
                const data = await response.json()
                setUsersList(data.users || [])
            }
        } catch (error) {
            console.error('Error fetching users:', error)
        } finally {
            setLoadingUsers(false)
        }
    }

    // Fetch selected user details
    const fetchUserDetails = async (userId) => {
        try {
            const response = await fetch(`/api/admin/users/${userId}`)
            if (response.ok) {
                const data = await response.json()
                setSelectedUser(data)
            }
        } catch (error) {
            console.error('Error fetching user details:', error)
        }
    }

    // Handle user search
    useEffect(() => {
        if (searchQuery.length > 0) {
            const timer = setTimeout(() => {
                fetchUsers(searchQuery)
            }, 300)
            return () => clearTimeout(timer)
        } else {
            setUsersList([])
        }
    }, [searchQuery])

    // Load initial users
    useEffect(() => {
        if (showUserList) {
            fetchUsers('')
        }
    }, [showUserList])

    const handleSelectUser = (user) => {
        fetchUserDetails(user.id)
        setShowUserList(false)
        setSearchQuery('')
    }

    const clearSelection = () => {
        setSelectedUser(null)
        setSearchQuery('')
        setUsersList([])
    }

    return (
        <div className="inline-flex h-full flex-col gap-5 border-r border-slate-200 sm:min-w-80 bg-white">
            {/* Admin Profile Section */}
            <div className="flex flex-col gap-3 justify-center items-center pt-8 max-sm:hidden px-4">
                <div className="relative">
                    {adminProfile.avatar ? (
                        <img
                            src={adminProfile.avatar}
                            alt="Profile"
                            className="w-16 h-16 rounded-full border-4 border-red-100 object-cover"
                        />
                    ) : (
                        <div className="w-16 h-16 rounded-full border-4 border-red-100 bg-gradient-to-br from-red-200 to-red-300 flex items-center justify-center">
                            <span className="text-white text-2xl font-bold">
                                {adminProfile.name.charAt(0).toUpperCase()}
                            </span>
                        </div>
                    )}
                    <img src="/logo.bmp" alt="CrashKart" className="absolute -bottom-2 -right-2 w-6 h-6 rounded-full border-4 border-white bg-white" />
                </div>
                <p className="text-slate-700 font-semibold text-center">Hi, {adminProfile.name}</p>
                <Link href="/admin/profile" className="text-xs text-red-600 hover:text-red-700 font-medium mt-1">
                    Update Profile
                </Link>
            </div>

            {/* Users Details Section */}
            <div className="px-4 py-4 border-t border-slate-200 max-sm:hidden">
                <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3">View User Details</h3>
                
                {/* Search Users */}
                <div className="relative mb-3">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search user..."
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value)
                            setShowUserList(true)
                        }}
                        onFocus={() => setShowUserList(true)}
                        className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                </div>

                {/* Users Dropdown List */}
                {showUserList && (
                    <div className="absolute left-4 right-4 top-32 bg-white border border-slate-300 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                        {loadingUsers ? (
                            <div className="p-3 text-sm text-slate-500">Loading users...</div>
                        ) : usersList.length > 0 ? (
                            usersList.map(user => (
                                <button
                                    key={user.id}
                                    onClick={() => handleSelectUser(user)}
                                    className="w-full text-left px-3 py-2 hover:bg-slate-100 border-b border-slate-200 last:border-b-0 transition"
                                >
                                    <p className="text-sm font-medium text-slate-800">{user.name || 'Unknown'}</p>
                                    <p className="text-xs text-slate-600">{user.email}</p>
                                </button>
                            ))
                        ) : (
                            <div className="p-3 text-sm text-slate-500">No users found</div>
                        )}
                    </div>
                )}

                {/* Selected User Details */}
                {selectedUser && (
                    <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-lg p-4 space-y-3">
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">Selected User</p>
                                <p className="text-sm font-bold text-slate-900 mt-1">{selectedUser.name}</p>
                            </div>
                            <button
                                onClick={clearSelection}
                                className="text-slate-400 hover:text-slate-600"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {/* Email */}
                        {selectedUser.email && (
                            <div className="flex items-center gap-2 text-sm">
                                <Mail className="w-4 h-4 text-blue-600 flex-shrink-0" />
                                <span className="text-slate-700 truncate" title={selectedUser.email}>{selectedUser.email}</span>
                            </div>
                        )}

                        {/* Phone */}
                        {selectedUser.phone && (
                            <div className="flex items-center gap-2 text-sm">
                                <Phone className="w-4 h-4 text-green-600 flex-shrink-0" />
                                <span className="text-slate-700">{selectedUser.phone}</span>
                            </div>
                        )}

                        {/* Default Address */}
                        {selectedUser.Address && selectedUser.Address.length > 0 && (
                            <div className="text-sm">
                                <div className="flex items-start gap-2">
                                    <MapPin className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-medium text-slate-900">{selectedUser.Address[0].name}</p>
                                        <p className="text-xs text-slate-600 mt-0.5">{selectedUser.Address[0].street}</p>
                                        <p className="text-xs text-slate-600">{selectedUser.Address[0].city}, {selectedUser.Address[0].state} {selectedUser.Address[0].zip}</p>
                                        {selectedUser.Address[0].phone && (
                                            <p className="text-xs text-slate-600 mt-1 flex items-center gap-1">
                                                <Phone size={12} />
                                                {selectedUser.Address[0].phone}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Verification Status */}
                        <div className="text-xs space-y-1 pt-2 border-t border-slate-300">
                            <p className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${selectedUser.isEmailVerified ? 'bg-green-600' : 'bg-red-600'}`}></span>
                                Email: {selectedUser.isEmailVerified ? 'Verified' : 'Not Verified'}
                            </p>
                            <p className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${selectedUser.isPhoneVerified ? 'bg-green-600' : 'bg-red-600'}`}></span>
                                Phone: {selectedUser.isPhoneVerified ? 'Verified' : 'Not Verified'}
                            </p>
                        </div>

                        {/* Joined Date */}
                        <p className="text-xs text-slate-600 text-center pt-2 border-t border-slate-300">
                            Joined: {new Date(selectedUser.createdAt).toLocaleDateString()}
                        </p>
                    </div>
                )}
            </div>

            {/* Navigation Links */}
            <div className="max-sm:mt-6 flex-1 overflow-y-auto px-2">
                {
                    (() => {
                        const groups = {}
                        sidebarLinks.forEach(link => {
                            if (!groups[link.group]) groups[link.group] = []
                            groups[link.group].push(link)
                        })
                        
                        return Object.entries(groups).map(([groupName, links]) => (
                            <div key={groupName}>
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-5 py-3 max-sm:hidden">
                                    {groupName}
                                </p>
                                {links.map((link, index) => (
                                    <Link key={index} href={link.href} className={`relative flex items-center gap-3 text-slate-500 hover:bg-slate-50 p-2.5 transition ${pathname === link.href && 'bg-slate-100 sm:text-slate-600'}`}>
                                        <link.icon size={18} className="sm:ml-5" />
                                        <p className="max-sm:hidden text-sm">{link.name}</p>
                                        {pathname === link.href && <span className="absolute bg-red-600 right-0 top-1.5 bottom-1.5 w-1 sm:w-1.5 rounded-l"></span>}
                                    </Link>
                                ))}
                            </div>
                        ))
                    })()
                }
            </div>
        </div>
    )
}

export default AdminSidebar
