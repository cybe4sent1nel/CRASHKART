'use client'
import Image from "next/image"
import { MapPin, Mail, Phone } from "lucide-react"
import { useState, useEffect } from "react"
import { assets } from "@/assets/assets"

const StoreInfo = ({store}) => {
    const [adminProfile, setAdminProfile] = useState({
        avatar: null,
        name: store.user.name,
        email: store.user.email
    })

    useEffect(() => {
        // Load admin profile from localStorage
        const savedProfile = localStorage.getItem('adminProfile')
        if (savedProfile) {
            try {
                const profile = JSON.parse(savedProfile)
                setAdminProfile({
                    avatar: profile.avatar,
                    name: profile.name || store.user.name,
                    email: profile.email || store.user.email
                })
            } catch (e) {
                console.log('Could not parse profile data')
            }
        }

        // Listen for profile updates
        const handleProfileUpdate = () => {
            const updated = localStorage.getItem('adminProfile')
            if (updated) {
                try {
                    const profile = JSON.parse(updated)
                    setAdminProfile({
                        avatar: profile.avatar,
                        name: profile.name || store.user.name,
                        email: profile.email || store.user.email
                    })
                } catch (e) {
                    console.log('Could not parse profile data')
                }
            }
        }

        window.addEventListener('storage', handleProfileUpdate)
        window.addEventListener('profileUpdated', handleProfileUpdate)

        return () => {
            window.removeEventListener('storage', handleProfileUpdate)
            window.removeEventListener('profileUpdated', handleProfileUpdate)
        }
    }, [store.user.name, store.user.email])

    return (
        <div className="flex-1 space-y-2 text-sm">
            {store.name === 'CrashKart' ? (
                <img src="/logo.bmp" alt={store.name} className="w-20 h-20 object-contain shadow rounded-full max-sm:mx-auto" />
            ) : (
                <Image width={100} height={100} src={store.logo} alt={store.name} className="max-w-20 max-h-20 object-contain shadow rounded-full max-sm:mx-auto" />
            )}
            <div className="flex flex-col sm:flex-row gap-3 items-center">
                <h3 className="text-xl font-semibold text-slate-800"> {store.name} </h3>
                <span className="text-sm">@{store.username}</span>

                {/* Status Badge */}
                <span
                    className={`text-xs font-semibold px-4 py-1 rounded-full ${store.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : store.status === 'rejected'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-green-100 text-green-800'
                        }`}
                >
                    {store.status}
                </span>
            </div>

            <p className="text-slate-600 my-5 max-w-2xl">{store.description}</p>
            <p className="flex items-center gap-2"> <MapPin size={16} /> {store.address}</p>
            <p className="flex items-center gap-2"><Phone size={16} /> {store.contact}</p>
            <p className="flex items-center gap-2"><Mail size={16} />  {store.email}</p>
            <p className="text-slate-700 mt-5">Applied  on <span className="text-xs">{new Date(store.createdAt).toLocaleDateString()}</span> by</p>
            <div className="flex items-center gap-2 text-sm ">
                {adminProfile.avatar ? (
                    <img 
                        src={adminProfile.avatar} 
                        alt={adminProfile.name} 
                        className="w-9 h-9 rounded-full object-cover"
                    />
                ) : (
                    <Image width={36} height={36} src={assets.profile_pic1} alt={adminProfile.name} className="w-9 h-9 rounded-full object-cover" unoptimized />
                )}
                <div>
                    <p className="text-slate-600 font-medium">{adminProfile.name}</p>
                    <p className="text-slate-400">{adminProfile.email}</p>
                </div>
            </div>
        </div>
    )
}

export default StoreInfo