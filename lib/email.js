import nodemailer from 'nodemailer';
import * as emailTemplates from './emailTemplates.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// CrashKart Logo HTML for emails
const CRASHKART_LOGO_HTML = `
<div style="text-align: center; padding: 20px 0; margin-bottom: 20px;">
    <img src="https://disabled-blue-pxxlqc3pk9-hwn0d1df7j.edgeone.app/LOGO.png" alt="CrashKart Logo" style="max-width: 200px; height: auto; margin: 0 auto;">
</div>
`;

// Email configuration - supports Gmail, SendGrid, and custom SMTP
const createTransporter = () => {
  // Check if using Gmail
  if (process.env.EMAIL_SERVICE === 'gmail' || process.env.EMAIL_USER?.includes('@gmail.com')) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS // App-specific password required
      }
    });
  }

  // Check if using SendGrid
  if (process.env.EMAIL_SERVICE === 'sendgrid' && process.env.SENDGRID_API_KEY) {
    return nodemailer.createTransport({
      host: 'smtp.sendgrid.net',
      port: 587,
      auth: {
        user: 'apikey',
        pass: process.env.SENDGRID_API_KEY
      }
    });
  }

  // Generic SMTP configuration
  return nodemailer.createTransporter({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

let transporter = null;

const getTransporter = () => {
  if (!transporter) {
    transporter = createTransporter();
  }
  return transporter;
};

const APP_NAME = 'CRASHKART';
const FROM_EMAIL = process.env.EMAIL_USER;

// ========================
// Generic Email Sender
// ========================

/**
 * Convert item image URLs to inline CID attachments
 * Supports local paths and HTTP URLs (downloads and converts to base64)
 */
async function processProductImages(items) {
  const attachments = [];
  const fs = await import('fs').then(m => m.default);

  if (!items || !Array.isArray(items)) return attachments;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (!item.image) continue;

    try {
      const cidName = `product-${i}`;

      // Handle local file paths
      if (item.image.startsWith('/') || item.image.startsWith('.')) {
        const imagePath = path.join(__dirname, '../public', item.image.replace(/^\/public\/?/, ''));
        if (fs.existsSync(imagePath)) {
          attachments.push({
            filename: `product-${i}.jpg`,
            path: imagePath,
            cid: cidName
          });
          // Store the CID in the item for template reference
          item._emailImageCid = cidName;
        }
      }
      // Handle HTTP/HTTPS URLs
      else if (item.image.startsWith('http')) {
        try {
          const response = await fetch(item.image, { timeout: 10000 });
          if (response.ok) {
            const buffer = await response.arrayBuffer();
            const ext = item.image.split('.').pop().split('?')[0] || 'jpg';
            attachments.push({
              filename: `product-${i}.${ext}`,
              content: Buffer.from(buffer),
              cid: cidName
            });
            // Store the CID in the item for template reference
            item._emailImageCid = cidName;
          }
        } catch (urlError) {
          console.warn(`Failed to fetch product image from URL: ${item.image}`, urlError.message);
        }
      }
    } catch (error) {
      console.warn(`Failed to process product image for item ${i}:`, error.message);
    }
  }

  return attachments;
}

/**
 * Generate product image HTML with CID reference
 */
function getProductImageHTML(item, imageSize = '50px') {
  if (!item.image) return '';
  
  const cidName = item._emailImageCid || `product-${Math.random().toString(36).substr(2, 9)}`;
  return `<img src="cid:${cidName}" alt="${item.name}" style="width: ${imageSize}; height: ${imageSize}; object-fit: cover; border-radius: 4px; margin-right: 10px; vertical-align: middle;">`;
}

/**
 * Generic function to send any email
 */
async function sendEmailInternal(to, subject, html, fromName = APP_NAME, attachments = null) {
  try {
    // Inject logo into HTML at the top if not already present
    // Check for <!-- LOGO -->, CRASHKART_LOGO_HTML, or getLogoHeader() to avoid double logos
    if (!html.includes('<!-- LOGO -->') && !html.includes(CRASHKART_LOGO_HTML) && !html.includes('getLogoHeader()') && !html.includes('LOGO.png')) {
      // Find the opening body tag and insert logo after it
      if (html.includes('<body>')) {
        html = html.replace('<body>', `<body>${CRASHKART_LOGO_HTML}`);
      } else if (html.includes('<div class="email-wrapper">')) {
        html = html.replace('<div class="email-wrapper">', `<div class="email-wrapper">${CRASHKART_LOGO_HTML}`);
      } else {
        // Just prepend it
        html = CRASHKART_LOGO_HTML + html;
      }
    }
    
    const mailOptions = {
      from: `"${fromName}" <${FROM_EMAIL}>`,
      to,
      subject,
      html,
      // Explicitly set content type to ensure HTML rendering
      headers: {
        'Content-Type': 'text/html; charset=UTF-8'
      }
    };

    const attachmentList = [];

    // Handle attachment options
    if (Array.isArray(attachments)) {
      // Filter attachments to ensure files exist
      for (const att of attachments) {
        if (att.path && !fs.existsSync(att.path)) {
          console.warn('Attachment file not found, skipping:', att.path);
          continue;
        }
        attachmentList.push(att);
      }
    }

    if (attachmentList.length > 0) {
      mailOptions.attachments = attachmentList;
    }

    const info = await getTransporter().sendMail(mailOptions);
    console.log(`✅ Email sent to ${to}:`, info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Email sending error:', error);
    return { success: false, error: error.message };
  }
}

// Export the main sendEmail function
export const sendEmail = sendEmailInternal;

// ========================
// AUTHENTICATION EMAILS
// ========================

/**
 * Send OTP verification email
 */
export async function sendOTPEmail(email, otp, name = 'User') {
  const template = emailTemplates.otpVerificationEmail(name, otp);
  return sendEmail(email, template.subject, template.html, `${APP_NAME} Security`);
}

/**
 * Send welcome email for new users
 */
export async function sendWelcomeEmail(email, name = 'User', crashCashBonus = 100) {
  const template = emailTemplates.welcomeEmail(name, crashCashBonus);
  return sendEmail(email, template.subject, template.html, `${APP_NAME} Team`);
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(email, resetToken, name = 'User') {
  const template = emailTemplates.passwordResetEmail(name, resetToken);
  return sendEmail(email, template.subject, template.html, `${APP_NAME} Security`);
}

/**
 * Send password changed confirmation email
 */
export async function sendPasswordChangedEmail(email, name = 'User') {
  const template = emailTemplates.passwordChangedEmail(name);
  return sendEmail(email, template.subject, template.html, `${APP_NAME} Security`);
}

/**
 * Send email verification link
 */
export async function sendVerificationEmail(email, verificationToken, name = 'User') {
  const template = emailTemplates.emailVerificationEmail(name, verificationToken);
  return sendEmail(email, template.subject, template.html, `${APP_NAME} Security`);
}

// ========================
// ORDER EMAILS
// ========================

/**
 * Send order confirmation email
 */
export async function sendOrderConfirmationEmail(email, orderData, name = 'Customer') {
  const template = emailTemplates.orderConfirmationEmail(name, orderData);
  
  // Process product images as attachments
  const productAttachments = await processProductImages(orderData.items);
  
  return sendEmail(email, template.subject, template.html, `${APP_NAME} Orders`, productAttachments);
}

/**
 * Send order shipped email
 */
export async function sendOrderShippedEmail(email, orderData, name = 'Customer') {
  const template = emailTemplates.orderShippedEmail(name, orderData);
  
  // Process product images as attachments
  const productAttachments = await processProductImages(orderData.items);
  
  return sendEmail(email, template.subject, template.html, `${APP_NAME} Shipping`, productAttachments);
}

/**
 * Send a lightweight payment received email (different from full order confirmation)
 * ⚠️ NO ATTACHMENTS - Keeps email clean and avoids encoding issues
 */
export async function sendPaymentReceivedEmail(email, orderData, invoiceAttachment = null, name = 'Customer') {
  // Use a simple template if not present
  const template = emailTemplates.paymentReceivedEmail ? emailTemplates.paymentReceivedEmail(name, orderData) : {
    subject: `Payment Received - ${orderData.orderId}`,
    html: `<!DOCTYPE html><html><body><h2>Payment Received</h2><p>We have received your payment for order <strong>${orderData.orderId}</strong>. We'll process it and send a confirmation once the order is fully confirmed.</p></body></html>`
  }

  // ✅ NO ATTACHMENTS - Send clean HTML-only email
  // Invoice can be downloaded from user's orders page
  return sendEmail(email, template.subject, template.html, `${APP_NAME} Payments`, null)
}


/**
 * Send order delivered email
 */
export async function sendOrderDeliveredEmail(email, orderData, name = 'Customer') {
  const template = emailTemplates.orderDeliveredEmail(name, orderData);
  
  // Process product images as attachments
  const productAttachments = await processProductImages(orderData.items);
  
  return sendEmail(email, template.subject, template.html, `${APP_NAME} Delivery`, productAttachments);
}

/**
 * Send order cancelled email
 */
export async function sendOrderCancelledEmail(email, orderData, name = 'Customer') {
  const template = emailTemplates.orderCancelledEmail(name, orderData);
  
  // Process product images as attachments
  const productAttachments = await processProductImages(orderData.items);
  
  return sendEmail(email, template.subject, template.html, `${APP_NAME} Orders`, productAttachments);
}

/**
 * Send refund processed email
 */
export async function sendRefundProcessedEmail(email, refundData, name = 'Customer') {
  const template = emailTemplates.refundProcessedEmail(name, refundData);
  
  // Process product images as attachments
  const productAttachments = await processProductImages(refundData.items || []);
  
  return sendEmail(email, template.subject, template.html, `${APP_NAME} Payments`, productAttachments);
}

/**
 * Send return approved email
 */
export async function sendReturnApprovedEmail(email, returnData, name = 'Customer') {
  const template = emailTemplates.returnApprovedEmail(name, returnData);
  
  // Process product images as attachments
  const productAttachments = await processProductImages(returnData.items || []);
  
  return sendEmail(email, template.subject, template.html, `${APP_NAME} Orders`, productAttachments);
}

// ========================
// PROMOTIONAL EMAILS
// ========================

/**
 * Send flash sale alert
 */
export async function sendFlashSaleEmail(email, saleData, name = 'Shopper') {
  const template = emailTemplates.flashSaleEmail(name, saleData);
  return sendEmail(email, template.subject, template.html, `${APP_NAME} Deals`, 'include-logo');
}

/**
 * Send abandoned cart reminder
 */
export async function sendAbandonedCartEmail(email, cartData, name = 'Shopper') {
  const template = emailTemplates.abandonedCartEmail(name, cartData);
  return sendEmail(email, template.subject, template.html, `${APP_NAME} Deals`, 'include-logo');
}

/**
 * Send back in stock alert
 */
export async function sendBackInStockEmail(email, productData, name = 'Shopper') {
  const template = emailTemplates.backInStockEmail(name, productData);
  return sendEmail(email, template.subject, template.html, `${APP_NAME} Updates`, 'include-logo');
}

/**
 * Send price drop alert
 */
export async function sendPriceDropEmail(email, productData, name = 'Shopper') {
  const template = emailTemplates.priceDropEmail(name, productData);
  return sendEmail(email, template.subject, template.html, `${APP_NAME} Deals`, 'include-logo');
}

// ========================
// ACCOUNT EMAILS
// ========================

/**
 * Send account deactivation warning
 */
export async function sendAccountDeactivationWarningEmail(email, name = 'User') {
  const template = emailTemplates.accountDeactivationWarningEmail(name);
  return sendEmail(email, template.subject, template.html, `${APP_NAME} Team`, 'include-logo');
}

// ========================
// REWARD EMAILS
// ========================

/**
 * Send CrashCash earned email
 */
export async function sendCrashCashEarnedEmail(email, rewardData, name = 'User') {
   const template = emailTemplates.crashCashEarnedEmail(name, rewardData);
   return sendEmail(email, template.subject, template.html, `${APP_NAME} Rewards`, 'include-logo');
 }

/**
 * Send birthday reward email
 */
export async function sendBirthdayEmail(email, rewardData, name = 'User') {
   const template = emailTemplates.birthdayEmail(name, rewardData);
   return sendEmail(email, template.subject, template.html, `${APP_NAME} Team`, 'include-logo');
 }

// ========================
// REVIEW EMAILS
// ========================

/**
 * Send review request email
 */
export async function sendReviewRequestEmail(email, orderData, name = 'Customer') {
  const template = emailTemplates.reviewRequestEmail(name, orderData);
  return sendEmail(email, template.subject, template.html, `${APP_NAME} Reviews`, 'include-logo');
}

// ========================
// NEWSLETTER EMAILS
// ========================

/**
 * Send newsletter welcome email
 */
export async function sendNewsletterWelcomeEmail(email, name = 'Subscriber') {
  const template = emailTemplates.newsletterWelcomeEmail(name);
  return sendEmail(email, template.subject, template.html, `${APP_NAME} Newsletter`, 'include-logo');
}

/**
 * Send promotional newsletter email
 */
export async function sendPromotionalNewsletterEmail(email, promoData, name = 'Shopper') {
  const template = emailTemplates.promotionalNewsletterEmail(name, promoData);
  return sendEmail(email, template.subject, template.html, `${APP_NAME} Deals`, 'include-logo');
}

/**
 * Send promotional newsletter to multiple subscribers
 */
export async function sendBulkNewsletterEmail(subscribers, promoData) {
  const results = [];
  for (const subscriber of subscribers) {
    const result = await sendPromotionalNewsletterEmail(subscriber.email, promoData, subscriber.name);
    results.push({ email: subscriber.email, ...result });
    // Add delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  return results;
}

/**
 * Send special offer email
 */
export async function sendSpecialOfferEmail(email, offerData, name = 'Customer') {
  const template = emailTemplates.specialOfferEmail(name, offerData);
  return sendEmail(email, template.subject, template.html, `${APP_NAME} Offers`, 'include-logo');
}

/**
 * Send weekly deals email
 */
export async function sendWeeklyDealsEmail(email, dealsData, name = 'Shopper') {
  const template = emailTemplates.weeklyDealsEmail(name, dealsData);
  return sendEmail(email, template.subject, template.html, `${APP_NAME} Deals`, 'include-logo');
}

/**
 * Send weekly deals to multiple subscribers
 */
export async function sendBulkWeeklyDealsEmail(subscribers, dealsData) {
  const results = [];
  for (const subscriber of subscribers) {
    const result = await sendWeeklyDealsEmail(subscriber.email, dealsData, subscriber.name);
    results.push({ email: subscriber.email, ...result });
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  return results;
}

// ========================
// BULK EMAILS
// ========================

/**
 * Send promotional email to multiple users
 */
export async function sendBulkPromotionalEmail(users, saleData) {
  const results = [];
  for (const user of users) {
    const result = await sendFlashSaleEmail(user.email, saleData, user.name);
    results.push({ email: user.email, ...result });
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  return results;
}

/**
 * Send abandoned cart reminders to multiple users
 */
export async function sendBulkAbandonedCartEmails(cartDataList) {
  const results = [];
  for (const { email, name, cartData } of cartDataList) {
    const result = await sendAbandonedCartEmail(email, cartData, name);
    results.push({ email, ...result });
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  return results;
}

// ========================
// UTILITY FUNCTIONS
// ========================

/**
 * Test email configuration
 */
export async function testEmailConfig() {
  try {
    await getTransporter().verify();
    console.log('✅ Email service is ready');
    return { success: true, message: 'Email service configured correctly' };
  } catch (error) {
    console.error('❌ Email service error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send a test email
 */
export async function sendTestEmail(email, name = 'Test User') {
  const template = {
    subject: `🧪 Test Email from ${APP_NAME}`,
    html: `
      <!DOCTYPE html>
      <html>
      <body style="font-family: Arial, sans-serif; padding: 40px; text-align: center;">
        <h1 style="color: #ef4444;">🎉 Test Email Successful!</h1>
        <p>Hi ${name}, this is a test email from ${APP_NAME}.</p>
        <p>Your email configuration is working correctly.</p>
        <p style="color: #6b7280; margin-top: 30px;">Sent at: ${new Date().toLocaleString()}</p>
      </body>
      </html>
    `
  };
  return sendEmail(email, template.subject, template.html, `${APP_NAME} Test`);
}

// ========================
// ADMIN EMAILS
// ========================

/**
 * Send admin approval request email to main admin
 */
export async function sendAdminApprovalEmail(adminEmail, approvalData) {
  const { requesterEmail, approvalLink, rejectLink } = approvalData;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
        .email-wrapper { max-width: 600px; margin: 0 auto; background: #ffffff; }
        .logo-header { background-color: #f3f4f6; padding: 20px; text-align: center; border-radius: 8px; margin-bottom: 20px; }
        .logo-header h1 { color: #ef4444; margin: 10px 0 0 0; font-size: 32px; font-weight: bold; }
        .logo-header p { color: #6b7280; margin: 8px 0 0 0; font-size: 14px; }
        .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 30px; text-align: center; color: white; }
        .content { padding: 40px 30px; }
        .footer { background: #1f2937; color: #9ca3af; padding: 30px; text-align: center; font-size: 12px; }
        .btn { display: inline-block; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 10px 5px; }
        .btn-approve { background: #10b981; color: white; }
        .btn-reject { background: #ef4444; color: white; }
        .request-box { background: #f9fafb; border-left: 4px solid #ef4444; padding: 20px; margin: 20px 0; border-radius: 6px; }
        .info-box { background: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0; font-size: 14px; color: #6b7280; }
      </style>
    </head>
    <body>
      <div class="email-wrapper">
         <div class="logo-header">
           <h1>crashkart</h1>
           <p>Your Shopping Destination</p>
         </div>
         <div class="header">
           <h1>${APP_NAME} - Admin Access Request</h1>
          <p>A new user is requesting admin dashboard access</p>
        </div>
        <div class="content">
          <h2 style="color: #111827;">New Admin Access Request</h2>
          
          <div class="request-box">
            <p><strong>Requested by:</strong> ${requesterEmail}</p>
            <p><strong>Requested at:</strong> ${new Date().toLocaleString()}</p>
          </div>

          <h3 style="color: #111827; margin-top: 30px;">Review this request:</h3>
          
          <p style="text-align: center; margin: 30px 0;">
            <a href="${approvalLink}" class="btn btn-approve">✓ Approve Access</a>
            <a href="${rejectLink}" class="btn btn-reject">✕ Reject Request</a>
          </p>

          <div class="info-box">
            <strong>Important:</strong> Click the appropriate button above to approve or reject this admin access request. You can only perform this action once.
          </div>

          <div class="info-box">
            <p><strong>Security Note:</strong> If you didn't receive this request or don't recognize the email address, please disregard this email.</p>
          </div>
        </div>
        <div class="footer">
          <p>This is an automated email from ${APP_NAME} Admin System.</p>
          <p>Do not reply to this email. Please use the buttons above to respond.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail(adminEmail, `🔐 Admin Access Request from ${requesterEmail}`, html, `${APP_NAME} Admin`, 'include-logo');
  }

/**
 * Send approval confirmation email to requester
 */
export async function sendAdminApprovedEmail(requesterEmail, approvalData) {
  const { loginLink, mainAdminEmail } = approvalData;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
        .email-wrapper { max-width: 600px; margin: 0 auto; background: #ffffff; }
        .logo-header { background-color: #f3f4f6; padding: 20px; text-align: center; border-radius: 8px; margin-bottom: 20px; }
        .logo-header h1 { color: #ef4444; margin: 10px 0 0 0; font-size: 32px; font-weight: bold; }
        .logo-header p { color: #6b7280; margin: 8px 0 0 0; font-size: 14px; }
        .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; color: white; }
        .content { padding: 40px 30px; }
        .footer { background: #1f2937; color: #9ca3af; padding: 30px; text-align: center; font-size: 12px; }
        .btn { display: inline-block; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; background: #10b981; color: white; margin: 20px 0; }
        .success-box { background: #ecfdf5; border-left: 4px solid #10b981; padding: 20px; margin: 20px 0; border-radius: 6px; color: #047857; }
        .info-box { background: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0; font-size: 14px; color: #6b7280; }
      </style>
    </head>
    <body>
      <div class="email-wrapper">
         <div class="logo-header">
           <h1>crashkart</h1>
           <p>Your Shopping Destination</p>
         </div>
         <div class="header">
           <h1 style="margin: 0;">✅ Admin Access Approved!</h1>
        </div>
        <div class="content">
          <h2 style="color: #111827;">Welcome to ${APP_NAME} Admin Dashboard</h2>
          
          <div class="success-box">
            <p style="margin: 0;"><strong>Great news!</strong> Your admin access request has been <strong>approved</strong>.</p>
          </div>

          <p>You now have full access to the ${APP_NAME} admin dashboard. You can log in using the button below:</p>

          <div style="text-align: center;">
            <a href="${loginLink}" class="btn">Login to Admin Dashboard</a>
          </div>

          <div class="info-box">
            <p><strong>Admin Portal URL:</strong></p>
            <p style="word-break: break-all;">${loginLink}</p>
          </div>

          <h3 style="color: #111827;">What You Can Do:</h3>
          <ul style="color: #6b7280;">
            <li>Manage products and inventory</li>
            <li>View and process orders</li>
            <li>Manage coupons and promotions</li>
            <li>Send targeted emails and newsletters</li>
            <li>Access analytics and reports</li>
            <li>Manage user accounts and permissions</li>
          </ul>

          <div class="info-box">
            <p><strong>Need help?</strong> Contact the admin team at ${mainAdminEmail}</p>
          </div>
        </div>
        <div class="footer">
          <p>This is an automated email from ${APP_NAME} Admin System.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail(requesterEmail, `✅ Admin Access Approved - ${APP_NAME}`, html, `${APP_NAME} Admin`, 'include-logo');
  }

/**
 * Send rejection email to requester
 */
export async function sendAdminRejectedEmail(requesterEmail, rejectionData) {
  const { mainAdminEmail } = rejectionData;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
        .email-wrapper { max-width: 600px; margin: 0 auto; background: #ffffff; }
        .logo-header { background-color: #f3f4f6; padding: 20px; text-align: center; border-radius: 8px; margin-bottom: 20px; }

        .logo-header h1 { color: #ef4444; margin: 10px 0 0 0; font-size: 32px; font-weight: bold; }
        .logo-header p { color: #6b7280; margin: 8px 0 0 0; font-size: 14px; }
        .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 30px; text-align: center; color: white; }
        .content { padding: 40px 30px; }
        .footer { background: #1f2937; color: #9ca3af; padding: 30px; text-align: center; font-size: 12px; }
        .rejection-box { background: #fef2f2; border-left: 4px solid #ef4444; padding: 20px; margin: 20px 0; border-radius: 6px; color: #991b1b; }
        .info-box { background: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0; font-size: 14px; color: #6b7280; }
      </style>
    </head>
    <body>
      <div class="email-wrapper">
         <div class="logo-header">
           <h1>crashkart</h1>
           <p>Your Shopping Destination</p>
         </div>
         <div class="header">
           <h1 style="margin: 0;">❌ Admin Access Request Declined</h1>
        </div>
        <div class="content">
          <h2 style="color: #111827;">Request Status Update</h2>
          
          <div class="rejection-box">
            <p style="margin: 0;"><strong>Your admin access request has been declined.</strong></p>
          </div>

          <p>The admin team has reviewed your request and decided not to approve admin access at this time.</p>

          <h3 style="color: #111827;">What Now?</h3>
          <ul style="color: #6b7280;">
            <li>You can contact the admin team to inquire about the decision</li>
            <li>You may resubmit a new request in the future</li>
            <li>Continue using your regular user account</li>
          </ul>

          <div class="info-box">
            <p><strong>Questions?</strong> Contact the admin team at ${mainAdminEmail}</p>
          </div>
        </div>
        <div class="footer">
          <p>This is an automated email from ${APP_NAME} Admin System.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail(requesterEmail, `❌ Admin Access Request Declined - ${APP_NAME}`, html, `${APP_NAME} Admin`, 'include-logo');
  }

// ========================
// PLACEHOLDER EXPORTS (used in other APIs)
// ========================

/**
 * Bulk email sender (for email campaigns)
 */
export async function sendBulkEmail(recipients, template) {
  const results = [];
  for (const recipient of recipients) {
    const result = await sendEmail(recipient.email, template.subject, template.html);
    results.push({ email: recipient.email, ...result });
  }
  return results;
}

/**
 * Order status update email with invoice attachment
 */
export async function sendOrderStatusEmail(email, orderData, name = 'Customer', invoiceBuffer = null) {
   const template = emailTemplates.orderStatusEmail ? emailTemplates.orderStatusEmail(name, orderData) : {
     subject: `Order ${orderData.orderId} Status Update`,
     html: `<p>Your order ${orderData.orderId} status: ${orderData.status}</p>`
   };
   
   // Process product images as attachments
   const productAttachments = await processProductImages(orderData.items);
   const attachments = [];
   
   // Add product attachments if any
   if (productAttachments.length > 0) {
     attachments.push(...productAttachments);
   }
   
   // Add invoice if provided
   if (invoiceBuffer) {
     attachments.push({
       filename: `Invoice-${orderData.orderId}.pdf`,
       content: invoiceBuffer,
       contentType: 'application/pdf'
     });
   }
   
   return sendEmail(email, template.subject, template.html, `${APP_NAME} Orders`, attachments.length > 0 ? attachments : null);
}

/**
 * Send order confirmation with invoice
 */
export async function sendOrderConfirmationWithInvoice(email, orderData, invoiceAttachment, name = 'Customer') {
   const trackingLink = `${process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')}/my-orders/${orderData.orderId}`;
   const template = emailTemplates.orderConfirmationEmail(orderData, trackingLink);
   
   // Process product images as attachments
   const productAttachments = await processProductImages(orderData.items);
   const attachments = [];
   
   // Add product attachments if any
   if (productAttachments.length > 0) {
     attachments.push(...productAttachments);
   }
   
  // Add invoice attachment (prefer PDF when possible)
  if (invoiceAttachment) {
    // invoiceAttachment can be: Buffer, string (HTML), or object { filename, content, contentType }
    let att = null;

    // Buffer -> assume PDF
    if (Buffer.isBuffer(invoiceAttachment)) {
      att = {
        filename: `Invoice-${orderData.orderId}.pdf`,
        content: invoiceAttachment,
        contentType: 'application/pdf'
      };
    }

    // Plain string (HTML)
    else if (typeof invoiceAttachment === 'string') {
      att = {
        filename: `Invoice-${orderData.orderId}.html`,
        content: invoiceAttachment,
        contentType: 'text/html'
      };
    }

    // Object with content
    else if (invoiceAttachment && typeof invoiceAttachment === 'object') {
      const filename = invoiceAttachment.filename || `Invoice-${orderData.orderId}.pdf`;
      const content = invoiceAttachment.content;
      let contentType = invoiceAttachment.contentType;

      // If content is a Buffer and no contentType provided, assume PDF
      if (!contentType && Buffer.isBuffer(content)) contentType = 'application/pdf';
      // If filename ends with .pdf and no contentType, prefer PDF
      if (!contentType && filename.toLowerCase().endsWith('.pdf')) contentType = 'application/pdf';

      att = {
        filename,
        content,
        contentType: contentType || 'application/octet-stream'
      };
    }

    if (att) attachments.push(att);
  }
   
   console.log('📧 Preparing to send order confirmation email...')
   console.log('  - To:', email)
   console.log('  - Subject:', template.subject)
   console.log('  - Attachments:', attachments.length)
   
   try {
     const result = await sendEmail(email, template.subject, template.html, `${APP_NAME} Orders`, attachments.length > 0 ? attachments : null);
     console.log('✅ Order confirmation email sent successfully:', result);
     return result;
   } catch (error) {
     console.error('❌ Failed to send order confirmation email:', error);
     throw error;
   }
}

// Export all email templates for direct access if needed
export { emailTemplates };

export default {
  sendEmail,
  sendOTPEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendPasswordChangedEmail,
  sendVerificationEmail,
  sendOrderConfirmationEmail,
  sendOrderShippedEmail,
  sendOrderDeliveredEmail,
  sendOrderCancelledEmail,
  sendRefundProcessedEmail,
  sendReturnApprovedEmail,
  sendFlashSaleEmail,
  sendAbandonedCartEmail,
  sendBackInStockEmail,
  sendPriceDropEmail,
  sendAccountDeactivationWarningEmail,
  sendCrashCashEarnedEmail,
  sendBirthdayEmail,
  sendReviewRequestEmail,
  sendNewsletterWelcomeEmail,
  sendPromotionalNewsletterEmail,
  sendBulkNewsletterEmail,
  sendSpecialOfferEmail,
  sendWeeklyDealsEmail,
  sendBulkWeeklyDealsEmail,
  sendBulkPromotionalEmail,
  sendBulkAbandonedCartEmails,
  testEmailConfig,
  sendTestEmail,
  sendAdminApprovalEmail,
  sendAdminApprovedEmail,
  sendAdminRejectedEmail,
  sendPaymentReceivedEmail,
  sendOrderStatusEmail,
  sendOrderConfirmationWithInvoice,
  processProductImages,
  getProductImageHTML
};
