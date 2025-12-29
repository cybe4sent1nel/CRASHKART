/**
 * Notification Helper Utility
 * Centralizes notification creation and management
 */

// Notification types
export const NotificationType = {
  ORDER_PLACED: 'order_placed',
  ORDER_SHIPPED: 'order_shipped',
  ORDER_DELIVERED: 'order_delivered',
  ORDER_CANCELLED: 'order_cancelled',
  PAYMENT_SUCCESS: 'payment_success',
  PAYMENT_FAILED: 'payment_failed',
  CRASH_CASH_EARNED: 'crash_cash_earned',
  CRASH_CASH_REDEEMED: 'crash_cash_redeemed',
  PRICE_DROP: 'price_drop',
  BACK_IN_STOCK: 'back_in_stock',
  PROMOTION: 'promotion',
  WELCOME: 'welcome',
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  SUCCESS: 'success',
}

// Notification icons mapping
export const NotificationIcons = {
  [NotificationType.ORDER_PLACED]: 'Package',
  [NotificationType.ORDER_SHIPPED]: 'Truck',
  [NotificationType.ORDER_DELIVERED]: 'CheckCircle',
  [NotificationType.ORDER_CANCELLED]: 'XCircle',
  [NotificationType.PAYMENT_SUCCESS]: 'CreditCard',
  [NotificationType.PAYMENT_FAILED]: 'AlertCircle',
  [NotificationType.CRASH_CASH_EARNED]: 'Coins',
  [NotificationType.CRASH_CASH_REDEEMED]: 'Gift',
  [NotificationType.PRICE_DROP]: 'TrendingDown',
  [NotificationType.BACK_IN_STOCK]: 'Bell',
  [NotificationType.PROMOTION]: 'Tag',
  [NotificationType.WELCOME]: 'Sparkles',
  [NotificationType.INFO]: 'Info',
  [NotificationType.WARNING]: 'AlertTriangle',
  [NotificationType.ERROR]: 'XCircle',
  [NotificationType.SUCCESS]: 'CheckCircle',
}

/**
 * Create a notification via API
 * @param {Object} options - Notification options
 * @param {string} options.userId - User ID
 * @param {string} options.type - Notification type
 * @param {string} options.title - Notification title
 * @param {string} options.message - Notification message
 * @param {string} [options.link] - Optional link
 * @returns {Promise<Object>} - Created notification
 */
export async function createNotification(options) {
  try {
    const response = await fetch('/api/notifications/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options),
    })

    if (!response.ok) {
      throw new Error('Failed to create notification')
    }

    const data = await response.json()
    
    // Dispatch event for real-time update
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('newNotification', { detail: data.notification }))
    }
    
    return data.notification
  } catch (error) {
    console.error('Create notification error:', error)
    return null
  }
}

/**
 * Store notification locally (for client-side fallback)
 * @param {Object} notification - Notification object
 */
export function storeLocalNotification(notification) {
  if (typeof window === 'undefined') return
  
  try {
    const stored = JSON.parse(localStorage.getItem('localNotifications') || '[]')
    stored.unshift({
      ...notification,
      id: `local_${Date.now()}`,
      createdAt: new Date().toISOString(),
      isRead: false,
    })
    
    // Keep only last 50 notifications
    localStorage.setItem('localNotifications', JSON.stringify(stored.slice(0, 50)))
    
    // Dispatch event
    window.dispatchEvent(new CustomEvent('newNotification', { detail: notification }))
  } catch (error) {
    console.error('Store local notification error:', error)
  }
}

/**
 * Get local notifications
 * @returns {Array} - Local notifications
 */
export function getLocalNotifications() {
  if (typeof window === 'undefined') return []
  
  try {
    return JSON.parse(localStorage.getItem('localNotifications') || '[]')
  } catch {
    return []
  }
}

/**
 * Mark local notification as read
 * @param {string} notificationId - Notification ID
 */
export function markLocalNotificationAsRead(notificationId) {
  if (typeof window === 'undefined') return
  
  try {
    const stored = getLocalNotifications()
    const updated = stored.map(n => 
      n.id === notificationId ? { ...n, isRead: true } : n
    )
    localStorage.setItem('localNotifications', JSON.stringify(updated))
  } catch (error) {
    console.error('Mark local notification error:', error)
  }
}

/**
 * Clear all local notifications
 */
export function clearLocalNotifications() {
  if (typeof window === 'undefined') return
  localStorage.removeItem('localNotifications')
}

/**
 * Pre-built notification templates
 */
export const NotificationTemplates = {
  orderPlaced: (orderId, total) => ({
    type: NotificationType.ORDER_PLACED,
    title: 'Order Placed Successfully',
    message: `Your order #${orderId} for ₹${total} has been placed successfully!`,
    link: `/my-orders`,
  }),
  
  orderShipped: (orderId, estimatedDelivery) => ({
    type: NotificationType.ORDER_SHIPPED,
    title: 'Order Shipped',
    message: `Your order #${orderId} has been shipped! Expected delivery: ${estimatedDelivery}`,
    link: `/track-order?id=${orderId}`,
  }),
  
  orderDelivered: (orderId) => ({
    type: NotificationType.ORDER_DELIVERED,
    title: 'Order Delivered',
    message: `Your order #${orderId} has been delivered. Enjoy your purchase!`,
    link: `/my-orders`,
  }),
  
  orderCancelled: (orderId, reason) => ({
    type: NotificationType.ORDER_CANCELLED,
    title: 'Order Cancelled',
    message: `Your order #${orderId} has been cancelled. ${reason ? `Reason: ${reason}` : ''}`,
    link: `/my-orders`,
  }),
  
  crashCashEarned: (amount, source) => ({
    type: NotificationType.CRASH_CASH_EARNED,
    title: 'CrashCash Earned!',
    message: `You earned ₹${amount} CrashCash from ${source}!`,
    link: `/crash-cash`,
  }),
  
  crashCashRedeemed: (amount) => ({
    type: NotificationType.CRASH_CASH_REDEEMED,
    title: 'CrashCash Redeemed',
    message: `You redeemed ₹${amount} CrashCash on your order!`,
    link: `/crash-cash`,
  }),
  
  priceDrop: (productName, oldPrice, newPrice) => ({
    type: NotificationType.PRICE_DROP,
    title: 'Price Drop Alert!',
    message: `${productName} price dropped from ₹${oldPrice} to ₹${newPrice}!`,
    link: null,
  }),
  
  backInStock: (productName) => ({
    type: NotificationType.BACK_IN_STOCK,
    title: 'Back in Stock!',
    message: `${productName} is back in stock. Get it before it sells out!`,
    link: null,
  }),
  
  welcome: (userName) => ({
    type: NotificationType.WELCOME,
    title: 'Welcome to CrashKart!',
    message: `Hi ${userName}! Thanks for joining CrashKart. Start shopping and earn CrashCash rewards!`,
    link: '/shop',
  }),
  
  promotion: (title, message, link) => ({
    type: NotificationType.PROMOTION,
    title,
    message,
    link,
  }),
}

/**
 * Send notification using template
 * @param {string} userId - User ID
 * @param {string} templateName - Template name from NotificationTemplates
 * @param {...any} args - Arguments for the template
 * @returns {Promise<Object>} - Created notification
 */
export async function sendNotification(userId, templateName, ...args) {
  const template = NotificationTemplates[templateName]
  if (!template) {
    console.error(`Unknown notification template: ${templateName}`)
    return null
  }
  
  const notificationData = template(...args)
  return createNotification({
    userId,
    ...notificationData,
  })
}

/**
 * Request browser notification permission
 * @returns {Promise<string>} - Permission status
 */
export async function requestNotificationPermission() {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported'
  }
  
  if (Notification.permission === 'granted') {
    return 'granted'
  }
  
  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission()
    return permission
  }
  
  return Notification.permission
}

/**
 * Show browser notification
 * @param {Object} options - Notification options
 */
export function showBrowserNotification(options) {
  if (typeof window === 'undefined' || !('Notification' in window)) return
  
  if (Notification.permission === 'granted') {
    const notification = new Notification(options.title, {
      body: options.message,
      icon: '/logo.bmp',
      badge: '/logo.bmp',
      tag: options.id || 'crashkart-notification',
      requireInteraction: false,
    })
    
    notification.onclick = () => {
      window.focus()
      if (options.link) {
        window.location.href = options.link
      }
      notification.close()
    }
    
    // Auto close after 5 seconds
    setTimeout(() => notification.close(), 5000)
  }
}
