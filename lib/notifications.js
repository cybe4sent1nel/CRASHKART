/**
 * WhatsApp Notification Service using CallMeBot API (Free)
 * 
 * Setup Instructions:
 * 1. Add CallMeBot to WhatsApp: +34 644 34 97 21
 * 2. Send message: "I allow callmebot to send me messages"
 * 3. You'll receive an API key
 * 4. Add to .env: CALLMEBOT_API_KEY=your-key
 * 
 * Alternative Free Options:
 * - Twilio Free Trial (100 messages)
 * - WhatsApp Business API (requires business verification)
 */

/**
 * Send WhatsApp message using CallMeBot (Free)
 */
export async function sendWhatsAppNotification(phone, message) {
  try {
    // Remove +, spaces, and format phone number
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Option 1: CallMeBot API (Completely free, no signup needed)
    if (process.env.CALLMEBOT_API_KEY) {
      const apiUrl = `https://api.callmebot.com/whatsapp.php?phone=${cleanPhone}&text=${encodeURIComponent(message)}&apikey=${process.env.CALLMEBOT_API_KEY}`;
      
      const response = await fetch(apiUrl);
      
      if (response.ok) {
        console.log('✅ WhatsApp notification sent via CallMeBot');
        return { success: true, provider: 'callmebot' };
      }
    }

    // Option 2: Twilio (if configured)
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      const twilio = require('twilio');
      const client = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );

      await client.messages.create({
        body: message,
        from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
        to: `whatsapp:+${cleanPhone}`,
      });

      console.log('✅ WhatsApp notification sent via Twilio');
      return { success: true, provider: 'twilio' };
    }

    // No provider configured
    console.log('⚠️ No WhatsApp provider configured');
    return { success: false, error: 'No WhatsApp provider configured' };
    
  } catch (error) {
    console.error('❌ WhatsApp notification error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send order tracking link via WhatsApp
 */
export async function sendOrderTrackingWhatsApp(phone, orderId, trackingUrl) {
  const message = `🛒 *CRASHKART Order Update*

Order ID: ${orderId}
Status: Order Placed

Track your order: ${trackingUrl}

Thank you for shopping with us! 🎉`;

  return await sendWhatsAppNotification(phone, message);
}

/**
 * Send order delivered notification
 */
export async function sendOrderDeliveredWhatsApp(phone, orderId) {
  const message = `✅ *Order Delivered!*

Your CRASHKART order #${orderId} has been delivered successfully.

Thank you for shopping with us! We hope you love your purchase. 🎁`;

  return await sendWhatsAppNotification(phone, message);
}

/**
 * Send special offer notification
 */
export async function sendOfferWhatsApp(phone, offerDetails) {
  const message = `🎉 *Special Offer - CRASHKART*

${offerDetails.title}

${offerDetails.description}

Valid until: ${offerDetails.expiryDate}

Shop now: ${process.env.NEXT_PUBLIC_APP_URL || 'https://crashkart.com'}`;

  return await sendWhatsAppNotification(phone, message);
}

/**
 * SMS Notification using Twilio (fallback)
 */
export async function sendSMSNotification(phone, message) {
  try {
    if (!process.env.TWILIO_ACCOUNT_SID) {
      console.log('⚠️ Twilio not configured');
      return { success: false, error: 'Twilio not configured' };
    }

    const twilio = require('twilio');
    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: `+${phone.replace(/\D/g, '')}`,
    });

    console.log('✅ SMS sent via Twilio');
    return { success: true };
  } catch (error) {
    console.error('❌ SMS error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Web Push Notification (for browser)
 */
export async function sendPushNotification(userId, notification) {
  // This would integrate with web-push or Firebase Cloud Messaging
  // For now, we'll save to database for in-app notifications
  
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    await prisma.notification.create({
      data: {
        userId,
        title: notification.title,
        message: notification.message,
        type: notification.type || 'info',
        link: notification.link || null,
        isRead: false,
      },
    });

    console.log('✅ In-app notification created');
    return { success: true };
  } catch (error) {
    console.error('❌ Push notification error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Multi-channel notification sender
 * Sends via Email, WhatsApp, SMS, and Push based on user preferences
 */
export async function sendMultiChannelNotification(user, notification) {
  const results = {
    email: null,
    whatsapp: null,
    sms: null,
    push: null,
  };

  // Send email
  if (user.email && notification.sendEmail) {
    const { sendOTPEmail } = require('./email');
    results.email = await sendOTPEmail(user.email, notification.message, user.name);
  }

  // Send WhatsApp
  if (user.phone && notification.sendWhatsApp) {
    results.whatsapp = await sendWhatsAppNotification(user.phone, notification.message);
  }

  // Send SMS (fallback if WhatsApp fails)
  if (user.phone && notification.sendSMS && !results.whatsapp?.success) {
    results.sms = await sendSMSNotification(user.phone, notification.message);
  }

  // Send push notification
  if (notification.sendPush) {
    results.push = await sendPushNotification(user.id, notification);
  }

  return results;
}
