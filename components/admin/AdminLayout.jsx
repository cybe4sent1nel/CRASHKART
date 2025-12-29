'use client'
import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import Loading from "../Loading"
import Link from "next/link"
import { ArrowRightIcon } from "lucide-react"
import AdminNavbar from "./AdminNavbar"
import AdminSidebar from "./AdminSidebar"

const AdminLayout = ({ children }) => {

    const router = useRouter()
    const pathname = usePathname()
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
         // Small delay to ensure localStorage is updated
         const timer = setTimeout(() => {
             // Check if login page is still processing
             const isLoginProcessing = sessionStorage.getItem('adminLoginProcessing') === 'true'
             if (isLoginProcessing) {
                 // Wait for login processing to complete
                 setLoading(false)
                 return
             }

             // Don't redirect from login page
             if (pathname === '/admin/login') {
                 setLoading(false)
                 return
             }

             // Check if admin is authenticated via 2FA or demo mode
             const isDemoMode = localStorage.getItem('isDemoMode') === 'true'
             const admin2FAVerified = sessionStorage.getItem('admin2FAVerified') === 'true' || localStorage.getItem('admin2FAVerified') === 'true'
             const isAdmin = localStorage.getItem('isAdmin') === 'true'
             
             console.log('AdminLayout - checking auth: demo=', isDemoMode, 'verified=', admin2FAVerified, 'isAdmin=', isAdmin, 'pathname:', pathname)
             
             // Allow access if demo mode OR (verified AND is admin)
             if (isDemoMode || (admin2FAVerified && isAdmin)) {
                 console.log('Authenticated, showing dashboard')
                 setIsAuthenticated(true)
                 setLoading(false)
             } else {
                 console.log('Not authenticated, redirecting to login')
                 // Redirect to login if not authenticated
                 router.push('/admin/login')
                 return
             }
         }, 100)

         return () => clearTimeout(timer)
     }, [router, pathname])

    // For login page, don't show layout
    if (pathname === '/admin/login') {
        return children
    }

    if (loading) {
        return <Loading />
    }

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center text-center px-6">
                <h1 className="text-2xl sm:text-4xl font-semibold text-slate-400">Please login to access admin panel</h1>
                <Link href="/admin/login" className="bg-red-600 text-white flex items-center gap-2 mt-8 p-2 px-6 max-sm:text-sm rounded-full hover:bg-red-700 transition">
                    Go to login <ArrowRightIcon size={18} />
                </Link>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-screen">
            <AdminNavbar />
            <div className="flex flex-1 items-start h-full overflow-y-scroll no-scrollbar">
                <AdminSidebar />
                <div className="flex-1 h-full p-5 lg:p-12 overflow-y-auto">
                    {children}
                </div>
            </div>
        </div>
    )
}

export default AdminLayout