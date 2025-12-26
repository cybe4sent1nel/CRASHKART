'use client'
import { useState, useEffect } from 'react'
import { Wifi, WifiOff, RefreshCw } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function ConnectionStatus({ className = '' }) {
  const [isOnline, setIsOnline] = useState(true)
  const [showStatus, setShowStatus] = useState(false)
  const [lastSync, setLastSync] = useState(null)

  useEffect(() => {
    // Check initial state
    setIsOnline(navigator.onLine)

    const handleOnline = () => {
      setIsOnline(true)
      setShowStatus(true)
      setTimeout(() => setShowStatus(false), 3000)
      setLastSync(new Date())
    }

    const handleOffline = () => {
      setIsOnline(false)
      setShowStatus(true)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Format last sync time
  const formatLastSync = () => {
    if (!lastSync) return null
    const now = new Date()
    const diff = Math.floor((now - lastSync) / 1000)
    
    if (diff < 60) return 'Just now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    return lastSync.toLocaleTimeString()
  }

  return (
    <AnimatePresence>
      {showStatus && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 ${className}`}
        >
          <div
            className={`flex items-center gap-2 px-4 py-2 rounded-full shadow-lg ${
              isOnline
                ? 'bg-green-500 text-white'
                : 'bg-red-500 text-white'
            }`}
          >
            {isOnline ? (
              <>
                <Wifi size={16} />
                <span className="text-sm font-medium">Back online</span>
              </>
            ) : (
              <>
                <WifiOff size={16} />
                <span className="text-sm font-medium">You're offline</span>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/**
 * Live indicator component - shows a pulsing dot for real-time data
 */
export function LiveIndicator({ isLive = true, size = 'sm' }) {
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  }

  return (
    <div className="flex items-center gap-1.5">
      <span className="relative flex">
        <span
          className={`${sizeClasses[size]} rounded-full ${
            isLive ? 'bg-green-500' : 'bg-gray-400'
          }`}
        />
        {isLive && (
          <span
            className={`absolute ${sizeClasses[size]} rounded-full bg-green-500 animate-ping opacity-75`}
          />
        )}
      </span>
      <span className="text-xs text-slate-500 dark:text-slate-400">
        {isLive ? 'Live' : 'Offline'}
      </span>
    </div>
  )
}

/**
 * Sync status component - shows when data was last synced
 */
export function SyncStatus({ lastSync, onRefresh, isRefreshing = false }) {
  const formatTime = (date) => {
    if (!date) return 'Never'
    const now = new Date()
    const diff = Math.floor((now - date) / 1000)
    
    if (diff < 60) return 'Just now'
    if (diff < 3600) return `${Math.floor(diff / 60)} min ago`
    return date.toLocaleTimeString()
  }

  return (
    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
      <span>Last updated: {formatTime(lastSync)}</span>
      {onRefresh && (
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition"
          title="Refresh"
        >
          <RefreshCw
            size={14}
            className={isRefreshing ? 'animate-spin' : ''}
          />
        </button>
      )}
    </div>
  )
}
