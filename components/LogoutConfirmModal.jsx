"use client"

import { useEffect, useState } from 'react'
import { LogOut, X } from 'lucide-react'

export default function LogoutConfirmModal({ open, onClose, onConfirm, loading = false }) {
    const [allDevices, setAllDevices] = useState(false)

    useEffect(() => {
        if (!open) setAllDevices(false)
    }, [open])

    if (!open) return null

    return (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
            <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200 p-6 relative">
                <button
                    aria-label="Close logout confirmation"
                    onClick={onClose}
                    className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 transition"
                >
                    <X size={18} />
                </button>

                <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 rounded-xl bg-red-50 text-red-600">
                        <LogOut size={20} />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-slate-900">Ready to logout?</h3>
                        <p className="text-sm text-slate-600">You can also sign out from every device.</p>
                    </div>
                </div>

                <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:border-slate-300 transition cursor-pointer mb-4">
                    <input
                        type="checkbox"
                        className="h-4 w-4 text-red-600"
                        checked={allDevices}
                        onChange={(e) => setAllDevices(e.target.checked)}
                    />
                    <div>
                        <p className="text-sm font-medium text-slate-800">Log out from all devices</p>
                        <p className="text-xs text-slate-500">Select to end sessions everywhere.</p>
                    </div>
                </label>

                <div className="flex items-center justify-end gap-2">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg text-slate-700 hover:bg-slate-100 transition"
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => onConfirm?.(allDevices)}
                        disabled={loading}
                        className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition disabled:opacity-60"
                    >
                        {loading ? 'Signing out...' : 'Logout'}
                    </button>
                </div>
            </div>
        </div>
    )
}
