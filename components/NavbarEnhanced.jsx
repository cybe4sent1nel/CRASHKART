'use client'
import { Search, ShoppingCart, Heart, LogOut, User, Home, Package, Info, Mail } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { FloatingDock } from "@/components/ui/floating-dock";
import { PlaceholdersAndVanishInput } from "@/components/ui/placeholders-and-vanish-input";
import LogoutConfirmModal from "./LogoutConfirmModal";
import { performLogout } from "@/lib/logout";

const NavbarEnhanced = () => {

    const router = useRouter();

    const [search, setSearch] = useState('')
    const [user, setUser] = useState(null)
    const [showMenu, setShowMenu] = useState(false)
    const [showFloatingDock, setShowFloatingDock] = useState(false)
    const [showLogoutModal, setShowLogoutModal] = useState(false)
    const [loggingOut, setLoggingOut] = useState(false)
    const cartCount = useSelector(state => state.cart.total)
    const wishlistCount = useSelector(state => state.wishlist?.total || 0)

    useEffect(() => {
        const userData = localStorage.getItem('user')
        if (userData) {
            setUser(JSON.parse(userData))
        }
    }, [])

    const handleSearch = (e) => {
        e.preventDefault()
        router.push(`/shop?search=${search}`)
    }

    const handleLogin = () => {
        router.push('/login')
    }

    const handleLogout = () => {
        setShowLogoutModal(true)
    }

    const confirmLogout = async (allDevices = false) => {
        setLoggingOut(true)
        try {
            await performLogout({ allDevices })
            setUser(null)
            setShowMenu(false)
            router.push('/')
        } finally {
            setLoggingOut(false)
            setShowLogoutModal(false)
        }
    }

    // Floating dock items
    const dockItems = [
        {
            icon: <Home size={20} />,
            label: "Home",
            onClick: () => router.push('/')
        },
        {
            icon: <Package size={20} />,
            label: "Shop",
            onClick: () => router.push('/shop')
        },
        {
            icon: <Info size={20} />,
            label: "About",
            onClick: () => router.push('/')
        },
        {
            icon: <Mail size={20} />,
            label: "Contact",
            onClick: () => router.push('/')
        }
    ]

    return (
        <nav className="relative bg-white shadow-md">
            <div className="mx-6">
                <div className="flex items-center justify-between max-w-7xl mx-auto py-4 transition-all">

                    {/* Logo */}
                    <Link href="/" className="relative text-4xl font-semibold text-slate-700 hover:text-red-600 transition">
                        <span className="text-red-600">crash</span>kart<span className="text-red-600 text-5xl leading-0">.</span>
                        <p className="absolute text-xs font-semibold -top-1 -right-8 px-3 p-0.5 rounded-full flex items-center gap-2 text-white bg-red-500">
                            plus
                        </p>
                    </Link>

                    {/* Desktop Menu */}
                    <div className="hidden sm:flex items-center gap-4 lg:gap-8 text-slate-600">
                        <Link href="/" className="hover:text-red-600 transition font-medium">Home</Link>
                        <Link href="/shop" className="hover:text-red-600 transition font-medium">Shop</Link>
                        <Link href="/" className="hover:text-red-600 transition font-medium">About</Link>
                        <Link href="/" className="hover:text-red-600 transition font-medium">Contact</Link>

                        <div className="hidden xl:block w-xs">
                            <PlaceholdersAndVanishInput
                                placeholders={['Search products...', 'Find deals...', 'Browse electronics...']}
                                onSubmit={handleSearch}
                            />
                        </div>

                        <Link href="/wishlist" className="relative flex items-center gap-2 text-slate-600 hover:text-red-600 transition font-medium">
                            <Heart size={20} />
                            <span className="absolute -top-2 -right-2 text-[10px] text-white bg-red-500 size-4 rounded-full flex items-center justify-center">{wishlistCount}</span>
                        </Link>

                        <Link href="/cart" className="relative flex items-center gap-2 text-slate-600 hover:text-red-600 transition font-medium">
                            <ShoppingCart size={20} />
                            Cart
                            <button className="absolute -top-1 left-3 text-[8px] text-white bg-slate-600 size-3.5 rounded-full">{cartCount}</button>
                        </Link>

                        {user ? (
                            <div className="relative">
                                <button onClick={() => setShowMenu(!showMenu)} className="px-4 py-2 bg-red-600 hover:bg-red-700 transition text-white rounded-full flex items-center gap-2 font-medium">
                                    <User size={16} />
                                    {user.name || user.email.split('@')[0]}
                                </button>
                                {showMenu && (
                                    <div className="absolute right-0 top-12 bg-white border border-slate-200 rounded-lg shadow-lg w-48 z-50">
                                        <Link href="/profile" className="block px-4 py-3 hover:bg-slate-100 border-b flex items-center gap-2 transition">
                                            <User size={16} />
                                            My Profile
                                        </Link>
                                        <Link href="/my-orders" className="block px-4 py-3 hover:bg-slate-100 border-b transition">
                                            My Orders
                                        </Link>
                                        <button onClick={handleLogout} className="w-full text-left px-4 py-3 hover:bg-slate-100 flex items-center gap-2 text-red-600 transition">
                                            <LogOut size={16} />
                                            Logout
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <button onClick={handleLogin} className="px-8 py-2 bg-indigo-500 hover:bg-indigo-600 transition text-white rounded-full font-medium">
                                Login
                            </button>
                        )}

                    </div>

                    {/* Mobile Menu */}
                    <div className="sm:hidden flex items-center gap-3">
                        <Link href="/wishlist" className="relative">
                            <Heart size={20} className="text-slate-600 hover:text-red-600 transition" />
                            <span className="absolute -top-2 -right-2 text-[8px] text-white bg-red-500 size-3 rounded-full flex items-center justify-center">{wishlistCount}</span>
                        </Link>
                        {user ? (
                            <div className="relative">
                                <button onClick={() => setShowMenu(!showMenu)} className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-sm transition text-white rounded-full font-medium">
                                    {user.name || user.email.split('@')[0]}
                                </button>
                                {showMenu && (
                                    <div className="absolute right-0 top-10 bg-white border border-slate-200 rounded-lg shadow-lg w-40 z-50">
                                        <Link href="/profile" className="block px-4 py-2 hover:bg-slate-100 border-b text-sm transition">
                                            My Profile
                                        </Link>
                                        <Link href="/my-orders" className="block px-4 py-2 hover:bg-slate-100 border-b text-sm transition">
                                            My Orders
                                        </Link>
                                        <button onClick={handleLogout} className="w-full text-left px-4 py-2 hover:bg-slate-100 text-red-600 text-sm transition">
                                            Logout
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <button onClick={handleLogin} className="px-5 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-sm transition text-white rounded-full font-medium">
                                Login
                            </button>
                        )}
                    </div>
                </div>
            </div>
            <hr className="border-gray-300" />

            <LogoutConfirmModal
                open={showLogoutModal}
                onClose={() => setShowLogoutModal(false)}
                onConfirm={confirmLogout}
                loading={loggingOut}
            />
        </nav>
    )
}

export default NavbarEnhanced
