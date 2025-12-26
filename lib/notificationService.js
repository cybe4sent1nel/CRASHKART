import { orderConfirmationEmail, orderShippedEmail, orderDeliveredEmail } from './emailTemplates'

/**
 * Send order confirmation via Email, SMS, and WhatsApp
 */
export async function sendOrderConfirmation(order, customerEmail, customerPhone) {
    try {
        const trackingLink = `${typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_APP_URL}/track/${order.orderId}`
        
        // Send Email
        await sendEmail(customerEmail, order, trackingLink)
        
        // Send SMS
        if (customerPhone) {
            await sendSMS(customerPhone, order.orderId, trackingLink)
        }
        
        // Send WhatsApp
        if (customerPhone) {
            await sendWhatsApp(customerPhone, order.orderId, trackingLink)
        }
        
        return { success: true, message: 'Notifications sent successfully' }
    } catch (error) {
        console.error('Notification error:', error)
        return { success: false, error: error.message }
    }
}

/**
 * Send order shipped notification
 */
export async function sendOrderShipped(orderId, customerEmail, customerPhone, estimatedDelivery) {
    try {
        const trackingLink = `${typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_APP_URL}/track/${orderId}`
        
        // Send Email
        const emailTemplate = orderShippedEmail(orderId, trackingLink, estimatedDelivery)
        await fetch('/api/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                to: customerEmail,
                subject: emailTemplate.subject,
                html: emailTemplate.html
            })
        })
        
        // Send SMS
        if (customerPhone) {
            const message = `Your order ${orderId} has shipped! Track it here: ${trackingLink}`
            await sendSMS(customerPhone, orderId, trackingLink, 'shipped')
        }
        
        // Send WhatsApp
        if (customerPhone) {
            await sendWhatsApp(customerPhone, orderId, trackingLink, 'shipped')
        }
        
        return { success: true }
    } catch (error) {
        console.error('Shipped notification error:', error)
        return { success: false, error: error.message }
    }
}

/**
 * Send order delivered notification
 */
export async function sendOrderDelivered(orderId, customerEmail, customerPhone) {
    try {
        // Send Email
        const emailTemplate = orderDeliveredEmail(orderId)
        await fetch('/api/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                to: customerEmail,
                subject: emailTemplate.subject,
                html: emailTemplate.html
            })
        })
        
        // Send SMS
        if (customerPhone) {
            const message = `Your order ${orderId} has been delivered! Thank you for shopping with CrashKart`
            await sendSMS(customerPhone, orderId, null, 'delivered')
        }
        
        // Send WhatsApp
        if (customerPhone) {
            await sendWhatsApp(customerPhone, orderId, null, 'delivered')
        }
        
        return { success: true }
    } catch (error) {
        console.error('Delivered notification error:', error)
        return { success: false, error: error.message }
    }
}

/**
 * Send Email using backend API
 */
async function sendEmail(email, order, trackingLink) {
    const template = orderConfirmationEmail(order, trackingLink)
    
    const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            to: email,
            subject: template.subject,
            html: template.html
        })
    })
    
    if (!response.ok) {
        throw new Error('Email send failed')
    }
    
    return response.json()
}

/**
 * Send SMS using Twilio or similar service
 */
async function sendSMS(phoneNumber, orderId, trackingLink, type = 'confirmation') {
    const messages = {
        confirmation: `Your order ${orderId} is confirmed! Track it here: ${trackingLink}`,
        shipped: `Your order ${orderId} has been shipped! Track: ${trackingLink}`,
        delivered: `Your order ${orderId} has been delivered! Thank you for shopping with CrashKart`
    }
    
    const response = await fetch('/api/send-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            phoneNumber,
            message: messages[type]
        })
    })
    
    if (!response.ok) {
        throw new Error('SMS send failed')
    }
    
    return response.json()
}

/**
 * Send WhatsApp message
 */
async function sendWhatsApp(phoneNumber, orderId, trackingLink, type = 'confirmation') {
    const messages = {
        confirmation: `🎉 Your order *${orderId}* is confirmed!\n\nTrack your order: ${trackingLink}\n\nThank you for shopping with CrashKart!`,
        shipped: `📦 Your order *${orderId}* has been shipped!\n\nTrack: ${trackingLink}`,
        delivered: `✅ Your order *${orderId}* has been delivered!\n\nThank you for shopping with CrashKart!`
    }
    
    const response = await fetch('/api/send-whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            phoneNumber,
            message: messages[type]
        })
    })
    
    if (!response.ok) {
        console.warn('WhatsApp send failed (non-critical)')
    }
    
    return response.json()
}

/**
 * Create local notification
 */
export function createLocalNotification(title, message, type = 'info') {
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, {
            body: message,
            icon: '/logo.bmp',
            tag: 'crashkart-notification',
            requireInteraction: true
        })
    }
}
