'use client'
import { useState, useEffect, useCallback, useRef } from 'react'

/**
 * Custom hook for real-time updates using polling and event listeners
 * Provides real-time order status, notification, and inventory updates
 */
export function useRealTimeUpdates(options = {}) {
  const {
    pollingInterval = 30000, // 30 seconds default
    enableOrderUpdates = true,
    enableNotifications = true,
    enableInventoryUpdates = false,
    userId = null,
  } = options

  const [orders, setOrders] = useState([])
  const [notifications, setNotifications] = useState([])
  const [inventory, setInventory] = useState([])
  const [lastUpdate, setLastUpdate] = useState(null)
  const [isConnected, setIsConnected] = useState(true)
  const intervalRef = useRef(null)

  // Fetch orders from API
  const fetchOrders = useCallback(async () => {
    if (!enableOrderUpdates || !userId) return

    try {
      const response = await fetch(`/api/orders?userId=${userId}`)
      if (response.ok) {
        const data = await response.json()
        setOrders(data.orders || [])
        setLastUpdate(new Date())
        setIsConnected(true)
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error)
      setIsConnected(false)
    }
  }, [enableOrderUpdates, userId])

  // Fetch notifications from API
  const fetchNotifications = useCallback(async () => {
    if (!enableNotifications || !userId) return

    try {
      const response = await fetch(`/api/notifications?userId=${userId}`)
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications || [])
        setLastUpdate(new Date())
        setIsConnected(true)
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
      setIsConnected(false)
    }
  }, [enableNotifications, userId])

  // Fetch inventory updates (for admin)
  const fetchInventory = useCallback(async () => {
    if (!enableInventoryUpdates) return

    try {
      const response = await fetch('/api/admin/inventory')
      if (response.ok) {
        const data = await response.json()
        setInventory(data.inventory || [])
        setLastUpdate(new Date())
        setIsConnected(true)
      }
    } catch (error) {
      console.error('Failed to fetch inventory:', error)
      setIsConnected(false)
    }
  }, [enableInventoryUpdates])

  // Combined refresh function
  const refresh = useCallback(async () => {
    await Promise.all([
      fetchOrders(),
      fetchNotifications(),
      fetchInventory(),
    ])
  }, [fetchOrders, fetchNotifications, fetchInventory])

  // Handle order status update events
  const handleOrderStatusUpdate = useCallback((event) => {
    const { orderId, newStatus } = event.detail
    setOrders((prevOrders) =>
      prevOrders.map((order) =>
        order.id === orderId ? { ...order, status: newStatus } : order
      )
    )
    setLastUpdate(new Date())
  }, [])

  // Handle new notification events
  const handleNewNotification = useCallback((event) => {
    const { notification } = event.detail
    setNotifications((prev) => [notification, ...prev])
    setLastUpdate(new Date())
  }, [])

  // Handle crash cash update events
  const handleCrashCashUpdate = useCallback((event) => {
    // Trigger a refresh to get updated crash cash
    if (enableNotifications) {
      fetchNotifications()
    }
  }, [enableNotifications, fetchNotifications])

  // Setup polling and event listeners
  useEffect(() => {
    // Initial fetch
    refresh()

    // Setup polling
    intervalRef.current = setInterval(refresh, pollingInterval)

    // Setup event listeners
    window.addEventListener('orderStatusUpdated', handleOrderStatusUpdate)
    window.addEventListener('newNotification', handleNewNotification)
    window.addEventListener('crashcash-update', handleCrashCashUpdate)
    window.addEventListener('storage', handleCrashCashUpdate)

    // Visibility change handler - refresh when tab becomes visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refresh()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Online/offline handlers
    const handleOnline = () => {
      setIsConnected(true)
      refresh()
    }
    const handleOffline = () => {
      setIsConnected(false)
    }
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      window.removeEventListener('orderStatusUpdated', handleOrderStatusUpdate)
      window.removeEventListener('newNotification', handleNewNotification)
      window.removeEventListener('crashcash-update', handleCrashCashUpdate)
      window.removeEventListener('storage', handleCrashCashUpdate)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [
    refresh,
    pollingInterval,
    handleOrderStatusUpdate,
    handleNewNotification,
    handleCrashCashUpdate,
  ])

  return {
    orders,
    notifications,
    inventory,
    lastUpdate,
    isConnected,
    refresh,
  }
}

/**
 * Hook for real-time order tracking
 */
export function useOrderTracking(orderId) {
  const [order, setOrder] = useState(null)
  const [trackingHistory, setTrackingHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchOrderTracking = useCallback(async () => {
    if (!orderId) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/orders/${orderId}/tracking`)
      if (response.ok) {
        const data = await response.json()
        setOrder(data.order || null)
        setTrackingHistory(data.trackingHistory || [])
      } else {
        setError('Order not found')
      }
    } catch (err) {
      setError('Failed to fetch tracking info')
      console.error('Error fetching order tracking:', err)
    } finally {
      setLoading(false)
    }
  }, [orderId])

  useEffect(() => {
    fetchOrderTracking()

    // Refresh every 60 seconds for tracking updates
    const interval = setInterval(fetchOrderTracking, 60000)

    // Listen for status updates
    const handleStatusUpdate = (event) => {
      if (event.detail.orderId === orderId) {
        fetchOrderTracking()
      }
    }
    window.addEventListener('orderStatusUpdated', handleStatusUpdate)

    return () => {
      clearInterval(interval)
      window.removeEventListener('orderStatusUpdated', handleStatusUpdate)
    }
  }, [orderId, fetchOrderTracking])

  return {
    order,
    trackingHistory,
    loading,
    error,
    refresh: fetchOrderTracking,
  }
}

/**
 * Hook for real-time crash cash balance
 */
export function useCrashCash(userEmail) {
  const [balance, setBalance] = useState(0)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchCrashCash = useCallback(() => {
    if (!userEmail) return

    setLoading(true)
    try {
      // Get from localStorage per-user storage
      const userKey = `crashkart_user_${userEmail}`
      const userData = localStorage.getItem(userKey)
      
      if (userData) {
        const parsed = JSON.parse(userData)
        setBalance(parsed.crashCash?.total || 0)
        setHistory(parsed.crashCash?.history || [])
      }
    } catch (error) {
      console.error('Error fetching crash cash:', error)
    } finally {
      setLoading(false)
    }
  }, [userEmail])

  useEffect(() => {
    fetchCrashCash()

    // Listen for crash cash updates
    const handleUpdate = () => {
      fetchCrashCash()
    }
    window.addEventListener('crashcash-update', handleUpdate)
    window.addEventListener('storage', handleUpdate)

    return () => {
      window.removeEventListener('crashcash-update', handleUpdate)
      window.removeEventListener('storage', handleUpdate)
    }
  }, [fetchCrashCash])

  return {
    balance,
    history,
    loading,
    refresh: fetchCrashCash,
  }
}

/**
 * Hook for real-time inventory alerts (admin)
 */
export function useInventoryAlerts(threshold = 10) {
  const [lowStockItems, setLowStockItems] = useState([])
  const [outOfStockItems, setOutOfStockItems] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchInventoryAlerts = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/inventory?threshold=${threshold}`)
      if (response.ok) {
        const data = await response.json()
        setLowStockItems(data.lowStockItems || [])
        setOutOfStockItems(data.outOfStockItems || [])
      }
    } catch (error) {
      console.error('Error fetching inventory alerts:', error)
    } finally {
      setLoading(false)
    }
  }, [threshold])

  useEffect(() => {
    fetchInventoryAlerts()

    // Refresh every 5 minutes for inventory
    const interval = setInterval(fetchInventoryAlerts, 300000)

    return () => clearInterval(interval)
  }, [fetchInventoryAlerts])

  return {
    lowStockItems,
    outOfStockItems,
    loading,
    refresh: fetchInventoryAlerts,
  }
}

export default useRealTimeUpdates
