"use client";

import { cn } from "@/lib/utils";
import {
  motion,
  AnimatePresence,
  useScroll,
  useMotionValueEvent,
} from "motion/react";
import React, { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart, ShoppingCart, Menu, X, User, LogOut, Package, Gift, Coins, Bell, Headphones } from "lucide-react";
import { useSelector } from "react-redux";
import { PlaceholdersAndVanishInput } from "./ui/placeholders-and-vanish-input";
import ProfileImage from "./ProfileImage";
import { updateCrashCashBalance } from "@/lib/crashcashStorage";
import { initializeUserProfile, migrateUserData } from "@/lib/userDataStorage";
import LogoutConfirmModal from "./LogoutConfirmModal";
import { performLogout } from "@/lib/logout";

const navItems = [
  { name: "Home", link: "/" },
  { name: "Shop", link: "/shop" },
  { name: "About", link: "/about" },
  { name: "Contact", link: "/about#contact" },
  { name: "Become a Seller", link: "/seller-query", special: true },
];

export default function Navbar() {
  const ref = useRef(null);
  const desktopMenuRef = useRef(null);
  const mobileMenuRef = useRef(null);
  const { scrollY } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const [visible, setVisible] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [crashCash, setCrashCash] = useState(0);
  const [hydrated, setHydrated] = useState(false);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const router = useRouter();

  // Check for unread notifications from API
  useEffect(() => {
    const checkNotifications = async () => {
      const userData = localStorage.getItem('user')
      if (!userData) return
      
      try {
        const user = JSON.parse(userData)
        const userId = user.id
        
        if (!userId) return
        
        const response = await fetch(`/api/notifications?userId=${userId}&unreadOnly=true`)
        const data = await response.json()
        
        if (data.success) {
          setHasUnreadNotifications(data.unreadCount > 0)
        }
      } catch (error) {
        console.error('Failed to check notifications:', error)
      }
    }
    
    checkNotifications()
    
    // Check periodically for notification updates every 30 seconds
    const interval = setInterval(checkNotifications, 30000)
    
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    let cancelled = false;

    // Load user data from localStorage
    const loadUser = () => {
      const userData = localStorage.getItem('user');
      if (userData) {
        try {
          const parsed = JSON.parse(userData);
          if (!cancelled) setUser(parsed);
          return parsed;
        } catch (e) {
          localStorage.removeItem('user');
          if (!cancelled) setUser(null);
          return null;
        }
      } else {
        if (!cancelled) setUser(null);
        return null;
      }
    };

    // Load crash cash for the logged-in user from backend; fallback to local
    const loadCrashCash = async () => {
      try {
        const userData = localStorage.getItem('user');
        const parsed = userData ? JSON.parse(userData) : null;

        // Always compute local merged balance (includes scratch/discountRewards) as a fallback
        const localMergedBalance = updateCrashCashBalance();

        if (parsed?.id) {
          const resp = await fetch(`/api/crashcash/rewards?userId=${parsed.id}`);
          if (resp.ok) {
            const data = await resp.json();
            const active = data.activeRewards || [];
            const serverBalance = active.reduce((sum, r) => sum + Number(r.amount || r.crashcash || 0), 0);
            if (!cancelled) setCrashCash(serverBalance);
            console.log('💰 Navbar loaded CrashCash balance (server only):', { serverBalance });
            return;
          }
        }

        if (!cancelled) setCrashCash(localMergedBalance);
        console.log('💰 Navbar loaded CrashCash balance (local fallback):', localMergedBalance);
      } catch (e) {
        console.error('Error loading crash cash:', e);
        if (!cancelled) setCrashCash(0);
      }
    };

    // Initial load - only once on mount
    const userData = loadUser();
    loadCrashCash();
    
    // Migrate and initialize user data on first load
    if (userData && userData.email) {
      try {
        migrateUserData(userData.email);
        initializeUserProfile(userData.email, userData);
      } catch (error) {
        console.error('Error initializing user profile:', error);
      }
    }
    
    setHydrated(true);

    // Listen for storage changes - debounced to prevent rapid updates
    let storageTimeout;
    const handleStorageChange = () => {
      clearTimeout(storageTimeout);
      storageTimeout = setTimeout(() => {
        const newUserData = loadUser();
        loadCrashCash();
      }, 100);
    };

    const handleCrashcashUpdate = () => {
      loadCrashCash();
    };

    const handleCrashcashAdded = () => {
      console.log('💰 CrashCash added event received, refreshing balance...');
      loadCrashCash();
    };

    const handleProfileUpdate = () => {
      loadUser();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('crashcash-update', handleCrashcashUpdate);
    window.addEventListener('crashcash-added', handleCrashcashAdded);
    window.addEventListener('profileUpdated', handleProfileUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('crashcash-update', handleCrashcashUpdate);
      window.removeEventListener('crashcash-added', handleCrashcashAdded);
      window.removeEventListener('profileUpdated', handleProfileUpdate);
      clearTimeout(storageTimeout);
      cancelled = true;
    };
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (desktopMenuRef.current && !desktopMenuRef.current.contains(event.target) &&
          mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    };

    if (userMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [userMenuOpen]);

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = async (allDevices = false) => {
    setLoggingOut(true);
    try {
      await performLogout({ allDevices });
      setUser(null);
      setUserMenuOpen(false);
      router.push('/');
    } finally {
      setLoggingOut(false);
      setShowLogoutModal(false);
    }
  };

  const cartCount = useSelector((state) => state.cart.total);
  const wishlistCount = useSelector((state) => state.wishlist?.total || 0);

  useMotionValueEvent(scrollY, "change", (latest) => {
    if (latest > 100) {
      setVisible(true);
    } else {
      setVisible(false);
    }
  });

  return (
    <motion.div
      ref={ref}
      className={cn("sticky inset-x-0 top-0 z-40 w-full")}
    >
      {/* Top Attribution Bar */}
      <div className="hidden lg:block w-full bg-gradient-to-r from-red-50 via-purple-50 to-blue-50 dark:from-slate-800/50 dark:via-slate-800/50 dark:to-slate-800/50 px-6 py-2">
        <div className="max-w-7xl mx-auto">
          <p className="text-xs sm:text-sm text-center text-slate-600 dark:text-slate-400">
            Designed and Developed by{' '}
            <span className="bg-gradient-to-r from-red-600 via-purple-600 to-blue-600 bg-clip-text text-transparent font-bold">
              Fahad Khan
            </span>
          </p>
        </div>
      </div>

      {/* Desktop Navbar */}
      <motion.div
        animate={{
          backdropFilter: visible ? "blur(10px)" : "none",
          boxShadow: visible
            ? "0 0 24px rgba(34, 42, 53, 0.06), 0 1px 1px rgba(0, 0, 0, 0.05), 0 0 0 1px rgba(34, 42, 53, 0.04), 0 0 4px rgba(34, 42, 53, 0.08), 0 16px 68px rgba(47, 48, 55, 0.05), 0 1px 0 rgba(255, 255, 255, 0.1) inset"
            : "none",
        }}
        transition={{
          type: "spring",
          stiffness: 200,
          damping: 50,
        }}
        className={cn(
          "relative z-[60] hidden w-full flex-row items-center justify-between px-6 py-4 lg:flex",
          visible && "bg-white/80 dark:bg-neutral-950/80"
        )}
      >
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="relative z-20 flex items-center gap-2">
            <img src="/logo.bmp" alt="CrashKart" className="w-8 h-8" />
            <span className="text-2xl font-semibold text-slate-700 dark:text-white">
              <span className="text-red-600">crash</span>kart
              <span className="text-red-600 text-3xl leading-0">.</span>
            </span>
          </Link>

          {/* Nav Items */}
          <div className="flex items-center gap-8 ml-8">
            {navItems.map((item, idx) => (
              <Link
                key={idx}
                href={item.link}
                className={cn(
                  "relative px-4 py-2 transition",
                  item.special
                    ? "text-red-600 dark:text-red-400 font-semibold hover:text-red-700 dark:hover:text-red-300"
                    : "text-neutral-600 dark:text-white hover:text-neutral-900 dark:hover:text-gray-300"
                )}
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Right Side - Wishlist, Cart, CrashCash, Profile */}
          <div className="flex items-center gap-4">
            {/* Support */}
            <Link href="/support" className="flex items-center text-slate-600 dark:text-white hover:text-cyan-600 transition" title="Customer Support">
              <Headphones size={20} />
            </Link>

            {/* Notifications */}
            <Link href="/notifications" className="relative flex items-center text-slate-600 dark:text-white hover:text-green-600 transition">
              <Bell size={20} />
              {hasUnreadNotifications && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-slate-900 animate-pulse"></span>
              )}
            </Link>
            
            <Link href="/wishlist" className="relative flex items-center gap-2 text-slate-600 dark:text-white hover:text-red-600 transition">
              <Heart size={18} />
              <span className="absolute -top-2 -right-2 text-[10px] text-white bg-red-500 size-4 rounded-full flex items-center justify-center">
                {hydrated ? wishlistCount : 0}
              </span>
            </Link>

            <Link href="/crash-cash" className="flex items-center gap-2 text-slate-600 dark:text-white hover:text-yellow-600 transition">
              <img src="/crashcash.ico" alt="CrashCash" className="w-7 h-7" />
              <span className="text-sm font-semibold text-slate-700 dark:text-white">{crashCash}</span>
            </Link>

            <Link href="/cart" className="relative flex items-center gap-2 text-slate-600 dark:text-white hover:text-slate-800 dark:hover:text-gray-300 transition">
              <ShoppingCart size={18} />
              <span className="absolute -top-2 -right-2 text-[10px] text-white bg-slate-600 size-4 rounded-full flex items-center justify-center">
                {hydrated ? cartCount : 0}
              </span>
            </Link>

            {user ? (
              <Link
                href="/profile"
                className="flex items-center gap-2 hover:opacity-80 transition relative"
              >
                <ProfileImage 
                  src={user.image} 
                  alt={user.name} 
                  name={user.name}
                  className="w-10 h-10 rounded-full object-cover border-2 border-red-500"
                />
              </Link>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => router.push('/login')}
                  className="px-6 py-2 border-2 border-slate-800 dark:border-white text-slate-800 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700 transition rounded-full text-sm font-medium"
                >
                  Login
                </button>
                <button
                  onClick={() => router.push('/signup')}
                  className="px-6 py-2 bg-red-600 hover:bg-red-700 transition text-white rounded-full text-sm font-medium"
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Mobile Navbar */}
      <motion.div
        animate={{
          backdropFilter: visible ? "blur(10px)" : "none",
          boxShadow: visible
            ? "0 0 24px rgba(34, 42, 53, 0.06), 0 1px 1px rgba(0, 0, 0, 0.05)"
            : "none",
        }}
        className={cn(
          "relative z-50 flex lg:hidden w-full flex-col items-center justify-between px-6 py-4",
          visible && "bg-white/80 dark:bg-neutral-950/80"
        )}
      >
        <div className="w-full flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="relative z-20 flex items-center gap-2">
            <img src="/logo.bmp" alt="CrashKart" className="w-7 h-7" />
            <span className="text-xl font-semibold text-slate-700 dark:text-white">
              <span className="text-red-600">crash</span>kart
              <span className="text-red-600 text-2xl leading-0">.</span>
            </span>
          </Link>

          {/* Right Side Icons */}
          <div className="flex items-center gap-3">
            {/* Support - Mobile */}
            <Link href="/support" className="relative">
              <Headphones size={20} className="text-slate-600 dark:text-white hover:text-cyan-600 transition" />
            </Link>

            {/* Notifications - Mobile */}
            <Link href="/notifications" className="relative">
              <Bell size={20} className="text-slate-600 dark:text-white hover:text-green-600 transition" />
              {hasUnreadNotifications && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white dark:border-slate-900 animate-pulse"></span>
              )}
            </Link>

            <Link href="/wishlist" className="relative">
              <Heart size={20} className="text-slate-600 dark:text-white hover:text-red-600 transition" />
              <span className="absolute -top-2 -right-2 text-[8px] text-white bg-red-500 size-3 rounded-full flex items-center justify-center">
                {hydrated ? wishlistCount : 0}
              </span>
            </Link>

            <Link href="/crash-cash" className="flex items-center gap-1">
              <img src="/crashcash.ico" alt="CrashCash" className="w-5 h-5" />
              <span className="text-xs font-semibold text-slate-700 dark:text-white">{hydrated ? crashCash : 0}</span>
            </Link>

            {user ? (
              <Link
                href="/profile"
                className="flex items-center hover:opacity-80 transition"
              >
                <ProfileImage 
                  src={user.image} 
                  alt={user.name} 
                  name={user.name}
                  className="w-8 h-8 rounded-full object-cover border-2 border-red-500"
                />
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => router.push('/login')}
                  className="px-3 py-1.5 border-2 border-slate-800 dark:border-white text-slate-800 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700 text-xs transition rounded-full"
                >
                  Login
                </button>
                <button
                  onClick={() => router.push('/signup')}
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-xs transition text-white rounded-full"
                >
                  Sign Up
                </button>
              </div>
            )}

            <button onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? (
                <X className="text-black dark:text-white" size={24} />
              ) : (
                <Menu className="text-black dark:text-white" size={24} />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute inset-x-0 top-16 z-50 flex w-full flex-col items-start justify-start gap-4 rounded-lg bg-white px-4 py-8 shadow-lg dark:bg-neutral-950"
            >
              {navItems.map((item, idx) => (
                <Link
                  key={idx}
                  href={item.link}
                  className={cn(
                    "transition",
                    item.special
                      ? "text-red-600 dark:text-red-400 font-semibold hover:text-red-700 dark:hover:text-red-300"
                      : "text-neutral-600 dark:text-white hover:text-neutral-900 dark:hover:text-gray-300"
                  )}
                  onClick={() => setMobileOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Search Bar */}
      <div
        className={cn(
          "w-full px-6 py-4 transition-all",
          visible && "bg-white/80 dark:bg-neutral-950/80 backdrop-blur-md"
        )}
      >
        <div className="max-w-7xl mx-auto">
          <PlaceholdersAndVanishInput
            placeholders={["Search products...", "Find electronics...", "Browse deals..."]}
            onChange={(e) => {
              if (e.target.value) {
                router.push(`/shop?search=${e.target.value}`);
              }
            }}
            onSubmit={() => {}}
          />
        </div>
      </div>

      <LogoutConfirmModal
        open={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={confirmLogout}
        loading={loggingOut}
      />
    </motion.div>
  );
}
