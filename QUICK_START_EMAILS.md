# Quick Start - Email Automation

## 3 Simple Steps to Get Emails Working

### Step 1: Set Email Credentials (5 minutes)

Add to `.env.local`:
```env
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASS=your-app-password-16-chars
EMAIL_SERVICE=gmail
```

**For Gmail:**
1. Go to https://myaccount.google.com/apppasswords
2. Select "Mail" and "Windows Computer"
3. Copy 16-character password
4. Paste as `EMAIL_PASS`

### Step 2: Test Order Email

1. **Place a test order** on the site
2. **Check your email inbox**
3. Verify receipt of order confirmation

Done! ✅ Order confirmation emails now work.

### Step 3: Setup Promotional Emails (Optional)

Choose one of these services (free tier available):

#### Option A: Upstash (Recommended)
1. Go to https://upstash.com/
2. Sign up free
3. Create a new Redis database
4. Go to "Cron" tab
5. Create new cron:
   - **URL:** `https://your-domain.com/api/cron/email-triggers?token=YOUR_SECRET`
   - **Schedule:** `0 * * * *` (every hour)
6. Add to `.env.local`:
   ```env
   CRON_SECRET=your-super-secret-string
   ```

#### Option B: EasyCron
1. Go to https://www.easycron.com/
2. Sign up free
3. Create new cron job
4. Enter URL: `https://your-domain.com/api/cron/email-triggers?token=YOUR_SECRET`
5. Set frequency to hourly

#### Option C: Vercel (If hosted on Vercel)
1. Create `vercel.json`:
   ```json
   {
     "crons": [{
       "path": "/api/cron/email-triggers",
       "schedule": "0 * * * *"
     }]
   }
   ```
2. Deploy to Vercel

## What Works Now

| Feature | Status | What Happens |
|---------|--------|--------------|
| Order Confirmation | ✅ Active | Customer gets email when order placed |
| Status Updates | ✅ Active | Customer gets email when order status changes |
| Shipping Notification | ✅ Active | Customer gets tracking number |
| Delivery Confirmation | ✅ Active | Customer gets delivery confirmation |
| Promotional Emails | ⏳ Setup Required | Weekly offers and discounts |
| Invoice Download | ✅ Active | Download invoice as HTML |

## Quick Testing

### Test Order Email
```bash
# Place test order in UI and check email
```

### Test Promotional Email
```bash
curl "https://your-domain.com/api/cron/email-triggers?token=YOUR_CRON_SECRET"
```

### Check if Email is Configured
```javascript
// Add to your API route for testing
const transporter = getTransporter();
const verified = await transporter.verify();
console.log('Email configured:', verified);
```

## Common Issues

### "Email not sending"
→ Check EMAIL_USER and EMAIL_PASS in .env.local
→ Verify App Password was used (not regular password)

### "Promotional emails not received"
→ Set up cron job (Step 3)
→ Test with curl command above

### "Invoice download fails"
→ Check user is logged in
→ Verify order ID is correct
→ Check browser console for errors

## API Endpoints

### Get Order Invoice
```
GET /api/orders/[orderId]/invoice
Returns: HTML invoice download
```

### Update Order Status (sends email)
```
PUT /api/admin/orders
Body: { orderId: "xxx", status: "SHIPPED" }
Result: Sends status email automatically
```

### Trigger Promotional Emails
```
GET /api/cron/email-triggers?token=YOUR_CRON_SECRET
Result: Sends promotional emails to opted-in users
```

## For Developers

### Add Custom Email Template

1. Create template in `lib/emailTemplates.js`
2. Create sender function in `lib/email.js`
3. Add trigger in `lib/emailTriggerService.js`
4. Call from relevant API route

### Debug Email Sending
```javascript
// Enable debug logging in email.js
console.log('📧 Sending email to:', recipientEmail);
console.log('📝 Template:', templateName);
```

## Files Created/Modified

✅ New:
- `lib/emailTriggerService.js` - Core email automation
- `app/api/cron/email-triggers/route.js` - Scheduled emails
- `app/api/orders/[orderId]/invoice/route.js` - Invoice generation
- `app/api/orders/[orderId]/status/route.js` - Status updates

✅ Modified:
- `app/api/orders/create/route.js` - Auto-trigger confirmation email
- `app/api/admin/orders/route.js` - Auto-trigger status emails
- `components/OrderItem.jsx` - Added invoice button
- `components/admin/AdminLayout.jsx` - Fixed sidebar

## Next Steps

1. ✅ Set email credentials
2. ✅ Test order email
3. ⏳ Setup cron job (optional)
4. 🚀 Deploy to production

---

**Questions?** Check `EMAIL_AUTOMATION_SETUP.md` for detailed docs.
