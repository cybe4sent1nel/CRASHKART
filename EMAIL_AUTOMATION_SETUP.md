# Email Automation System Setup Guide

## Overview
This document describes the automated email trigger system for CRASHKART, which sends:
- Order confirmation emails on order placement
- Order status update emails (PROCESSING, SHIPPED, DELIVERED)
- Promotional emails and newsletters
- Abandoned cart reminder emails

## Components

### 1. Email Trigger Service
**File:** `lib/emailTriggerService.js`

Core functions:
- `triggerOrderConfirmationEmail()` - Sends confirmation when order is placed
- `triggerOrderStatusEmail()` - Sends email on order status changes
- `triggerPromotionalEmails()` - Sends promotional campaigns
- `triggerAbandonedCartEmails()` - Sends cart recovery emails

### 2. Order Creation Flow
**File:** `app/api/orders/create/route.js`

When an order is created:
1. Order is saved to database
2. `triggerOrderConfirmationEmail()` is called automatically
3. Email is sent with order details and tracking link

### 3. Status Update Flow
**Files:**
- `app/api/admin/orders/route.js` (PUT endpoint)
- `app/api/orders/[orderId]/status/route.js`

When order status is updated:
1. Admin updates status in dashboard
2. `triggerOrderStatusEmail()` is called automatically
3. Appropriate email sent based on new status:
   - PROCESSING → Generic status update
   - SHIPPED → Shipping notification with tracking
   - DELIVERED → Delivery confirmation

### 4. Automated Cron Job
**File:** `app/api/cron/email-triggers/route.js`

**Purpose:** Sends promotional and abandoned cart emails periodically

**Setup Instructions:**

#### Option A: Using an External Cron Service (Recommended)

1. **Sign up for a cron service:**
   - Upstash Cron (https://upstash.com/docs/redis/features/cron)
   - EasyCron (https://www.easycron.com/)
   - APITimer (https://apitimer.com/)

2. **Configure the cron job:**
   ```
   URL: https://your-app-domain.com/api/cron/email-triggers?token=YOUR_CRON_SECRET
   Method: GET
   Frequency: Every hour (for promotional emails)
   ```

3. **Set environment variable:**
   ```env
   CRON_SECRET=your-secure-random-token
   ```

#### Option B: Using Vercel Cron (If deployed on Vercel)

1. **Create `vercel.json`:**
   ```json
   {
     "crons": [
       {
         "path": "/api/cron/email-triggers",
         "schedule": "0 * * * *"
       }
     ]
   }
   ```

2. **Add to `app/api/cron/email-triggers/route.js`:**
   ```javascript
   export const maxDuration = 60; // 60 seconds max
   ```

#### Option C: Node Cron (Local Development)

1. **Install package:**
   ```bash
   npm install node-cron
   ```

2. **Create `lib/cronJobs.js`:**
   ```javascript
   import cron from 'node-cron';
   import { triggerPromotionalEmails } from './emailTriggerService';

   // Run every hour
   cron.schedule('0 * * * *', async () => {
     console.log('Running email cron job');
     await triggerPromotionalEmails();
   });
   ```

3. **Call in `app/layout.js` or server initialization**

## Environment Variables

Add these to your `.env.local`:

```env
# Email Configuration
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-specific-password
EMAIL_SERVICE=gmail

# App Configuration
NEXT_PUBLIC_APP_URL=https://your-domain.com
NEXT_PUBLIC_CURRENCY_SYMBOL=₹

# Cron Security
CRON_SECRET=your-secure-random-token

# Database (if using Prisma)
DATABASE_URL=your-database-url
```

## Email Templates

All email templates are in `lib/emailTemplates.js`. Key templates:

- `orderConfirmationTemplate()` - Order placed
- `orderShippedTemplate()` - Order shipped
- `orderDeliveredTemplate()` - Order delivered
- `promotionalNewsletterTemplate()` - Promotional campaigns
- `abandonedCartTemplate()` - Cart recovery

## Database Setup (Optional)

If you want to track email logs, add this to your Prisma schema:

```prisma
model EmailLog {
  id        String   @id @default(cuid())
  userId    String?  @db.ObjectId
  email     String
  type      String   // ORDER_CONFIRMATION, ORDER_STATUS, PROMOTIONAL, ABANDONED_CART
  orderId   String?
  subject   String
  sentAt    DateTime @default(now())
  openedAt  DateTime?
  status    String   @default("sent") // sent, failed, opened, bounced
  
  user      User?    @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([email])
  @@index([userId])
  @@index([type])
}
```

## Testing

### Test Order Confirmation Email
1. Place a test order
2. Check email inbox
3. Verify email contains:
   - Order ID and date
   - Product details
   - Total amount
   - Delivery address
   - Tracking link

### Test Status Update Email
1. Go to Admin Dashboard
2. Update order status to SHIPPED
3. Check email for:
   - Shipping notification
   - Tracking number
   - Estimated delivery date

### Test Promotional Email
1. Call endpoint manually:
   ```bash
   curl "http://localhost:3000/api/cron/email-triggers?token=YOUR_CRON_SECRET"
   ```
2. Check logs for email sending
3. Verify users received promotional emails

## Troubleshooting

### Emails Not Sending

1. **Check EMAIL credentials:**
   - Verify `EMAIL_USER` and `EMAIL_PASS` in `.env.local`
   - For Gmail: Use App Password (not regular password)
   - Generate here: https://myaccount.google.com/apppasswords

2. **Check email logs:**
   - Look for errors in server console
   - Verify email transporter configuration in `lib/email.js`

3. **Verify SMTP settings:**
   ```javascript
   // Test in development
   const transporter = getTransporter();
   await transporter.verify(); // Should return true
   ```

### Cron Job Not Running

1. **Verify endpoint is accessible:**
   ```bash
   curl https://your-domain.com/api/cron/email-triggers?token=YOUR_TOKEN
   ```

2. **Check server logs** for errors

3. **Verify CRON_SECRET** matches in environment variables

### Duplicate Emails Sending

1. **Check email deduplication** in `triggerPromotionalEmails()`
2. **Verify cron frequency** is correct (should be 1 hour minimum)
3. **Check database** for duplicate email log entries

## Production Checklist

- [ ] Email credentials configured in production environment
- [ ] CRON_SECRET set to strong random value
- [ ] Cron job scheduled with external service
- [ ] Email templates tested in production
- [ ] Email unsubscribe links working
- [ ] Email logs table created in database (optional)
- [ ] Error monitoring setup (Sentry, etc.)
- [ ] Email rate limiting implemented (if needed)

## Future Enhancements

1. **Email Preferences:**
   - Allow users to choose which emails to receive
   - Unsubscribe from promotional emails
   - Frequency preferences

2. **Analytics:**
   - Track email opens
   - Track click-through rates
   - A/B testing for promotional emails

3. **Advanced Triggers:**
   - Price drop notifications
   - Wishlist restock alerts
   - Birthday/anniversary offers

4. **SMS & WhatsApp:**
   - Extend trigger service to SMS (Twilio)
   - WhatsApp notifications (Meta API)

## Support

For issues or questions, check:
1. Server console logs
2. Email service provider logs
3. Network requests in browser DevTools
4. Email spam folder (check deliverability)
