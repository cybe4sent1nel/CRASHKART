'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Wallet } from 'lucide-react'

export default function CrashCashCounter() {
    const [balance, setBalance] = useState(() => {
        if (typeof window === 'undefined') return 0
        return JSON.parse(localStorage.getItem('crashcashBalance') || '0')
    })
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)

        // Listen for storage changes (when balance updates from other component)
        const handleStorageChange = () => {
            const updated = JSON.parse(localStorage.getItem('crashcashBalance') || '0')
            setBalance(updated)
        }

        // Custom event listener for same-tab updates
        const handleCrashcashUpdate = (event) => {
            if (event.key === 'crashcashBalance' || !event.key) {
                const updated = JSON.parse(localStorage.getItem('crashcashBalance') || '0')
                setBalance(updated)
            }
        }

        window.addEventListener('storage', handleStorageChange)
        window.addEventListener('crashcash-update', handleCrashcashUpdate)
        
        // Also check for updates every 300ms (for same-tab updates)
        const interval = setInterval(() => {
            const updated = JSON.parse(localStorage.getItem('crashcashBalance') || '0')
            setBalance(updated)
        }, 300)

        return () => {
            window.removeEventListener('storage', handleStorageChange)
            window.removeEventListener('crashcash-update', handleCrashcashUpdate)
            clearInterval(interval)
        }
    }, [])

    if (!mounted) {
        return (
            <div className="flex items-center gap-2 bg-gradient-to-r from-amber-400 to-yellow-500 text-white px-3 py-2 rounded-lg font-semibold">
                <Wallet size={18} />
                <span className="text-sm">₹0</span>
            </div>
        )
    }

    return (
        <Link href="/crashcash" className="flex items-center gap-2 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-white px-3 py-2 rounded-lg transition font-semibold">
            <Wallet size={18} />
            <span className="text-sm">₹{balance}</span>
        </Link>
    )
}
