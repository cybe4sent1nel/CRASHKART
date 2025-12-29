'use client'
import Link from "next/link"
import { useState } from "react"
import { Settings, LogOut } from "lucide-react"
import { useRouter } from "next/navigation"

const AdminNavbar = () => {
    const [showMenu, setShowMenu] = useState(false)
    const router = useRouter()

    const handleLogout = () => {
        localStorage.removeItem('adminAuthenticated')
        router.push('/admin/login')
    }

    return (
        <div className="flex items-center justify-between px-12 py-3 border-b border-slate-200 transition-all">
            <Link href="/admin" className="flex items-center gap-3">
                <img src="/logo.bmp" alt="CrashKart" className="w-10 h-10" />
                <span className="text-2xl font-semibold text-slate-700">
                    <span className="text-red-600">crash</span>kart
                    <span className="text-red-600 text-3xl leading-0">.</span>
                </span>
                <span className="text-xs font-semibold px-3 py-1 rounded-full text-white bg-red-600">
                    Admin
                </span>
            </Link>
            <div className="flex items-center gap-5">
                <p className="text-slate-600">Hi, Admin</p>
                <div className="relative">
                    <button 
                        onClick={() => setShowMenu(!showMenu)}
                        className="flex items-center gap-2 px-3 py-2 hover:bg-slate-100 rounded-lg transition"
                    >
                        <Settings size={20} className="text-slate-600" />
                    </button>
                    {showMenu && (
                        <div className="absolute right-0 top-12 w-40 bg-white rounded-lg shadow-lg border border-slate-200 py-2 z-50">
                            <Link 
                                href="/admin/profile"
                                onClick={() => setShowMenu(false)}
                                className="flex items-center gap-2 px-4 py-2 hover:bg-slate-50 transition text-slate-700 text-sm"
                            >
                                <Settings size={16} />
                                Update Profile
                            </Link>
                            <button 
                                onClick={handleLogout}
                                className="w-full flex items-center gap-2 px-4 py-2 hover:bg-red-50 transition text-red-600 text-sm text-left"
                            >
                                <LogOut size={16} />
                                Logout
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default AdminNavbar