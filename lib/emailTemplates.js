// Helper function for dynamic copyright year
const getCurrentYear = () => new Date().getFullYear();

// Developer name - can be configured
const getDeveloperName = () => process.env.NEXT_PUBLIC_DEVELOPER_NAME || 'CrashKart Dev Team';

// Helper function for footer with developer info
const getEmailFooter = () => {
    return `
        <div style="background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 13px; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0;">© ${getCurrentYear()} CrashKart. All rights reserved.</p>
            <p style="margin: 8px 0 0 0; font-size: 12px;">Crafted with ❤️ by ${getDeveloperName()}</p>
            <p style="margin: 5px 0 0 0;">Your Shopping Destination</p>
        </div>
    `;
};

// Helper function for logo header with image
const getLogoHeader = () => {
    return `
        <div style="background-color: #f3f4f6; padding: 20px; text-align: center; border-radius: 8px; margin-bottom: 20px;">
            <img src="https://disabled-blue-pxxlqc3pk9-hwn0d1df7j.edgeone.app/LOGO.png" alt="CrashKart Logo" style="max-width: 200px; height: auto; margin: 0 auto;">
            <p style="color: #6b7280; margin: 12px 0 0 0; font-size: 14px;">Your Shopping Destination</p>
        </div>
    `;
};

// Helper function for product image with CID reference
const getProductImageHTML = (item, imageSize = '50px') => {
    if (!item || !item.image) return '';
    
    // Use the _emailImageCid if it was set by processProductImages, otherwise fallback to direct image
    const cidName = item._emailImageCid;
    if (cidName) {
        return `<img src="cid:${cidName}" alt="${item.name}" style="width: ${imageSize}; height: ${imageSize}; object-fit: cover; border-radius: 4px; margin-right: 10px; vertical-align: middle;">`;
    }
    
    // Fallback: use the image URL directly if CID not available
    return `<img src="${item.image}" alt="${item.name}" style="width: ${imageSize}; height: ${imageSize}; object-fit: cover; border-radius: 4px; margin-right: 10px; vertical-align: middle;">`;
};

export const orderConfirmationEmail = (order, trackingLink) => {
    const {
        orderId,
        items,
        subtotal,
        discount,
        crashCashApplied,
        total,
        address,
        paymentMethod,
        customerName,
        currency = '₹'
    } = order;

    const itemsHTML = items.map(item => `
        <tr>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
                ${getProductImageHTML(item, '60px')}
                <div style="font-weight: 600; margin-bottom: 4px;">${item.name}</div>
                <div style="color: #6b7280; font-size: 14px;">Qty: ${item.quantity}</div>
            </td>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">
                ${currency}${(item.price * item.quantity).toFixed(2)}
            </td>
        </tr>
    `).join('');

    return {
        subject: `Order Confirmed - ${orderId}`,
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <style>
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; background-color: #f9fafb; }
                    .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 40px 20px; text-align: center; }
                    .header h1 { margin: 0; font-size: 28px; }
                    .content { background: white; padding: 30px; }
                    .order-id { background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center; }
                    .order-id .label { color: #6b7280; font-size: 14px; }
                    .order-id .value { font-size: 24px; font-weight: bold; color: #ef4444; }
                    .section { margin: 30px 0; }
                    .section-title { font-size: 18px; font-weight: 600; margin-bottom: 15px; color: #1f2937; border-bottom: 2px solid #ef4444; padding-bottom: 10px; }
                    table { width: 100%; border-collapse: collapse; }
                    .items-table { margin: 20px 0; }
                    .summary-row { display: flex; justify-content: space-between; padding: 10px 0; }
                    .summary-row.total { background: #f3f4f6; padding: 15px; border-radius: 8px; font-size: 18px; font-weight: bold; color: #1f2937; margin-top: 15px; }
                    .address-box { background: #f0fdf4; border-left: 4px solid #22c55e; padding: 15px; border-radius: 4px; }
                    .button { display: inline-block; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; text-align: center; font-weight: 600; }
                    .footer { background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 14px; }
                    .badge { display: inline-block; background: #dbeafe; color: #1e40af; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-left: 10px; }
                </style>
            </head>
            <body>
                <div class="container">
                    ${getLogoHeader()}
                    <div class="header">
                         <h1>🎉 Order Confirmed!</h1>
                         <p style="margin: 10px 0 0 0; font-size: 16px;">Thank you for your purchase</p>
                     </div>

                     <div class="content">
                         <p>Hi <strong>${customerName}</strong>,</p>
                        <p>Your order has been successfully placed and confirmed. Below are your order details.</p>

                        <div class="order-id">
                            <div class="label">Order ID</div>
                            <div class="value">${orderId}</div>
                        </div>

                        <div class="section">
                            <div class="section-title">📦 Order Items</div>
                            <table class="items-table">
                                <tbody>
                                    ${itemsHTML}
                                </tbody>
                            </table>
                        </div>

                        <div class="section">
                            <div class="section-title">💰 Order Summary</div>
                            <div class="summary-row">
                                <span>Subtotal:</span>
                                <span>${currency}${subtotal.toFixed(2)}</span>
                            </div>
                            ${discount ? `
                                <div class="summary-row">
                                    <span>Discount:</span>
                                    <span style="color: #22c55e;">-${currency}${discount.toFixed(2)}</span>
                                </div>
                            ` : ''}
                            ${crashCashApplied ? `
                                <div class="summary-row">
                                    <span>CrashCash Applied:</span>
                                    <span style="color: #22c55e;">-${currency}${crashCashApplied.toFixed(2)}</span>
                                </div>
                            ` : ''}
                            <div class="summary-row total">
                                <span>Total Amount:</span>
                                <span>${currency}${total.toFixed(2)}</span>
                            </div>
                        </div>

                        <div class="section">
                            <div class="section-title">🏠 Delivery Address</div>
                            <div class="address-box">
                                <div style="font-weight: 600; margin-bottom: 8px;">${address.name}</div>
                                <div>${address.street}</div>
                                <div>${address.city}, ${address.state} ${address.zipCode}</div>
                                <div style="margin-top: 10px; color: #4b5563;">
                                    <div>📞 ${address.phone}</div>
                                    <div>📧 ${address.email}</div>
                                </div>
                            </div>
                        </div>

                        <div class="section">
                            <div class="section-title">💳 Payment Method</div>
                            <p><strong>${paymentMethod}</strong></p>
                        </div>

                        <div class="section">
                            <div class="section-title">📍 Track Your Order</div>
                            <p>Click the button below to track your order in real-time and get live updates on its delivery status.</p>
                            <a href="${trackingLink}" class="button">Track Order</a>
                        </div>

                        <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 4px; margin: 20px 0;">
                            <p style="margin: 0;"><strong>⏱️ What's Next?</strong></p>
                            <ul style="margin: 10px 0 0 0; padding-left: 20px;">
                                <li>Your order is being processed</li>
                                <li>We'll send you a shipping confirmation shortly</li>
                                <li>You'll receive a tracking link via SMS and WhatsApp</li>
                                <li>Estimated delivery: 3-5 business days</li>
                            </ul>
                        </div>

                        <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                            If you have any questions, please <a href="mailto:crashkart.help@gmail.com" style="color: #ef4444; text-decoration: none;">contact our support team</a>.
                        </p>

                        <p style="margin-top: 20px;">
                            <strong>CrashKart Team</strong>
                        </p>
                    </div>

                    <div class="footer">
                         <p style="margin: 0;">© ${getCurrentYear()} CrashKart. All rights reserved.</p>
                         <p style="margin: 8px 0 0 0; font-size: 12px;">Crafted with ❤️ by ${getDeveloperName()}</p>
                         <p style="margin: 5px 0 0 0;">Your Shopping Destination</p>
                     </div>
                </div>
            </body>
            </html>
        `
    };
};

export const orderShippedEmail = (orderId, trackingLink, estimatedDelivery) => {
    return {
        subject: `Your order ${orderId} has shipped!`,
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <style>
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; }
                    .header { background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: white; padding: 30px; text-align: center; }
                    .content { background: white; padding: 30px; }
                </style>
            </head>
            <body>
                <div class="container">
                    ${getLogoHeader()}
                    <div class="header">
                         <h1>📦 Your Order is on the Way!</h1>
                     </div>
                     <div class="content">
                         <p>Your order <strong>${orderId}</strong> has been shipped!</p>
                        <p>Estimated delivery: <strong>${estimatedDelivery}</strong></p>
                        <p><a href="${trackingLink}" style="color: #22c55e; font-weight: bold;">Track your package</a></p>
                    </div>
                </div>
            </body>
            </html>
        `
    };
};

export const orderDeliveredEmail = (orderId) => {
     return {
         subject: `Your order ${orderId} has been delivered!`,
         html: `
             <!DOCTYPE html>
             <html>
             <head>
                 <meta charset="utf-8">
                 <style>
                     body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; }
                     .container { max-width: 600px; margin: 0 auto; }
                     .header { background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; padding: 30px; text-align: center; }
                 </style>
             </head>
             <body>
                 <div class="container">
                     ${getLogoHeader()}
                     <div class="header">
                         <h1>🎉 Your Order has been Delivered!</h1>
                     </div>
                     <div style="background: white; padding: 30px;">
                         <p>Great news! Your order <strong>${orderId}</strong> has been successfully delivered.</p>
                         <p>We hope you enjoy your purchase. Thank you for shopping with us!</p>
                     </div>
                 </div>
             </body>
             </html>
         `
     };
 };

// OTP Verification Email - Vibrant
export const otpVerificationEmail = (name, otp) => {
    return {
        subject: '🔐 Your CrashKart Login OTP',
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f9fafb; margin: 0; padding: 0; }
                    .container { max-width: 600px; margin: 0 auto; background: white; }
                    .header { background: linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%); color: white; padding: 40px 20px; text-align: center; }
                    .header h1 { margin: 10px 0; font-size: 28px; font-weight: bold; }
                    .header p { margin: 8px 0 0 0; font-size: 16px; opacity: 0.95; }
                    .content { padding: 30px; }
                    .otp-box { background: linear-gradient(135deg, #f0f0f5 0%, #e8e8f0 100%); padding: 30px; text-align: center; border-radius: 12px; margin: 25px 0; border: 2px solid #7c3aed; }
                    .otp { font-size: 48px; font-weight: 900; letter-spacing: 8px; color: #7c3aed; font-family: 'Courier New', monospace; }
                    .otp-label { color: #6b7280; font-size: 14px; margin-top: 15px; font-weight: 600; }
                    .info-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 6px; margin: 20px 0; color: #92400e; }
                    .warning-box { background: #fee2e2; border-left: 4px solid #ef4444; padding: 15px; border-radius: 6px; margin: 20px 0; color: #991b1b; }
                    .footer { background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 13px; border-top: 1px solid #e5e7eb; }
                </style>
            </head>
            <body>
                <div class="container">
                    ${getLogoHeader()}
                    <div class="header">
                         <div style="font-size: 48px;">🔐</div>
                         <h1>Secure Login</h1>
                         <p>Your One-Time Password</p>
                     </div>
                    <div class="content">
                        <p>Hi <strong>${name}</strong>,</p>
                        <p>Here's your OTP to securely sign in to your CrashKart account:</p>
                        
                        <div class="otp-box">
                            <div class="otp">${otp}</div>
                            <div class="otp-label">⏱️ Valid for 10 minutes</div>
                        </div>
                        
                        <div class="info-box">
                            <strong>🔒 Security Reminder:</strong><br>
                            Never share this code with anyone. CrashKart staff will never ask for your OTP.
                        </div>
                        
                        <div class="warning-box">
                            ⚠️ If you didn't request this code, please ignore this email and ensure your account is secure.
                        </div>
                        
                        <p style="margin-top: 30px; color: #6b7280; text-align: center;">
                            Questions? Contact support at <a href="mailto:crashkart.help@gmail.com" style="color: #7c3aed; text-decoration: none;">crashkart.help@gmail.com</a>
                        </p>
                    </div>

                    <div class="footer">
                        <p style="margin: 0;">© ${getCurrentYear()} CrashKart. All rights reserved.</p>
                        <p style="margin: 8px 0 0 0; font-size: 12px;">Crafted with ❤️ by ${getDeveloperName()}</p>
                        <p style="margin: 5px 0 0 0;">Your Shopping Destination</p>
                    </div>
                </div>
            </body>
            </html>
        `
    };
};

// Welcome Email - Vibrant
export const welcomeEmail = (name, crashCashBonus = 100) => {
    return {
        subject: '🎉 Welcome to CrashKart - ₹100 CrashCash Bonus Inside!',
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f9fafb; margin: 0; padding: 0; }
                    .container { max-width: 600px; margin: 0 auto; background: white; }
                    .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 40px 20px; text-align: center; }
                    .header h1 { margin: 10px 0; font-size: 32px; font-weight: bold; }
                    .header p { margin: 8px 0 0 0; font-size: 16px; opacity: 0.95; }
                    .content { padding: 30px; }
                    .benefits { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 25px 0; }
                    .benefit-card { background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b; }
                    .benefit-icon { font-size: 28px; margin-bottom: 8px; }
                    .benefit-text { font-weight: 600; color: #92400e; font-size: 14px; }
                    .cta-button { display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 14px 40px; text-decoration: none; border-radius: 8px; margin: 25px 0; font-weight: 600; font-size: 16px; }
                    .crashcash-box { background: linear-gradient(135deg, #fdba74 0%, #fb923c 100%); border: 3px solid #ea580c; padding: 25px; border-radius: 12px; margin: 25px 0; color: white; text-align: center; box-shadow: 0 4px 12px rgba(251, 146, 60, 0.4); }
                    .crashcash-amount { font-size: 48px; font-weight: bold; text-shadow: 2px 2px 4px rgba(0,0,0,0.2); margin: 10px 0; }
                    .bonus-box { background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); border-left: 4px solid #3b82f6; padding: 20px; border-radius: 6px; margin: 20px 0; color: #1e40af; }
                    .footer { background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 13px; border-top: 1px solid #e5e7eb; }
                    .how-to-use { background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b; }
                    .how-to-use ol { margin: 10px 0; padding-left: 20px; }
                    .how-to-use li { margin: 8px 0; color: #78350f; font-weight: 500; }
                </style>
            </head>
            <body>
                <div class="container">
                    ${getLogoHeader()}
                    <div class="header">
                         <div style="font-size: 48px;">🎉</div>
                         <h1>Welcome to CrashKart!</h1>
                         <p>Your Shopping Adventure Starts Now</p>
                     </div>
                     <div class="content">
                         <p>Hi <strong>${name}</strong>,</p>
                        <p>Welcome to CrashKart, your ultimate destination for amazing deals and quality products! We're thrilled to have you on board.</p>
                        
                        <div class="crashcash-box">
                            <div style="font-size: 40px; margin-bottom: 10px;">🎁</div>
                            <div style="font-size: 18px; font-weight: 600;">Welcome Bonus!</div>
                            <div class="crashcash-amount">₹${crashCashBonus}</div>
                            <div style="font-size: 16px;">CrashCash Added to Your Wallet!</div>
                            <div style="font-size: 13px; margin-top: 10px; opacity: 0.9;">Use it on your next purchase 🛍️</div>
                        </div>
                        
                        <div class="how-to-use">
                            <strong style="font-size: 16px; color: #92400e;">💡 How to Use Your CrashCash:</strong>
                            <ol>
                                <li>Add products to your cart</li>
                                <li>Go to checkout</li>
                                <li>Apply your CrashCash for instant discount</li>
                                <li>Save money on every order!</li>
                            </ol>
                            <p style="margin: 10px 0 0 0; font-size: 13px; color: #78350f;"><strong>💰 Earn More:</strong> Get CrashCash on every purchase - just like Flipkart SuperCoins!</p>
                        </div>
                        
                        <div class="benefits">
                            <div class="benefit-card">
                                <div class="benefit-icon">⚡</div>
                                <div class="benefit-text">Flash Sales & Deals</div>
                            </div>
                            <div class="benefit-card">
                                <div class="benefit-icon">💰</div>
                                <div class="benefit-text">CrashCash Rewards</div>
                            </div>
                            <div class="benefit-card">
                                <div class="benefit-icon">🚀</div>
                                <div class="benefit-text">Fast Delivery</div>
                            </div>
                            <div class="benefit-card">
                                <div class="benefit-icon">🎯</div>
                                <div class="benefit-text">Best Prices</div>
                            </div>
                        </div>
                        
                        <p style="text-align: center;">
                            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://crashkart.com'}/shop" class="cta-button">🛍️ Start Shopping Now</a>
                        </p>
                        
                        <p>If you have any questions or need help, our 24/7 customer support team is here for you.</p>
                     </div>

                     <div class="footer">
                        <p style="margin: 0;">© ${getCurrentYear()} CrashKart. All rights reserved.</p>
                        <p style="margin: 8px 0 0 0; font-size: 12px;">Crafted with ❤️ by ${getDeveloperName()}</p>
                        <p style="margin: 5px 0 0 0;">Your Shopping Destination</p>
                     </div>
                </div>
            </body>
            </html>
        `
    };
};

// Password Reset Email
// Password Reset Email - Vibrant
export const passwordResetEmail = (name, resetToken) => {
    return {
        subject: '🔐 Reset Your CrashKart Password',
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f9fafb; margin: 0; padding: 0; }
                    .container { max-width: 600px; margin: 0 auto; background: white; }
                    .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 40px 20px; text-align: center; }
                    .header h1 { margin: 10px 0; font-size: 28px; font-weight: bold; }
                    .header p { margin: 8px 0 0 0; font-size: 16px; opacity: 0.95; }
                    .content { padding: 30px; }
                    .reset-box { background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%); border: 2px solid #ef4444; padding: 25px; border-radius: 12px; margin: 20px 0; text-align: center; }
                    .reset-message { color: #991b1b; font-size: 16px; font-weight: 600; margin-bottom: 15px; }
                    .cta-button { display: inline-block; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 14px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; }
                    .warning-box { background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; border-radius: 6px; margin: 20px 0; color: #991b1b; font-size: 14px; }
                    .footer { background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 13px; border-top: 1px solid #e5e7eb; }
                </style>
            </head>
            <body>
                <div class="container">
                    ${getLogoHeader()}
                    <div class="header">
                         <div style="font-size: 48px;">🔐</div>
                         <h1>Reset Password</h1>
                         <p>Secure Your Account</p>
                     </div>
                    <div class="content">
                        <p>Hi <strong>${name}</strong>,</p>
                        <p>We received a request to reset your password. Click the button below to create a new password:</p>
                        
                        <div class="reset-box">
                            <div class="reset-message">🔑 Reset Your Password</div>
                            <a href="${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}" class="cta-button">Reset Password</a>
                        </div>
                        
                        <div class="warning-box">
                            <strong>⏰ Link Expiration:</strong><br>
                            This link is valid for 1 hour only. If it expires, you can request a new reset link.
                        </div>
                        
                        <div class="warning-box">
                            <strong>🔒 Security Note:</strong><br>
                            If you didn't request this password reset, you can safely ignore this email. Your account is secure.
                        </div>
                    </div>

                    <div class="footer">
                        <p style="margin: 0;">© ${getCurrentYear()} CrashKart. All rights reserved.</p>
                        <p style="margin: 8px 0 0 0; font-size: 12px;">Crafted with ❤️ by ${getDeveloperName()}</p>
                        <p style="margin: 5px 0 0 0;">Your Shopping Destination</p>
                    </div>
                </div>
            </body>
            </html>
        `
    };
};

// Password Changed Email - Vibrant
export const passwordChangedEmail = (name) => {
    return {
        subject: '✅ Your CrashKart Password Was Changed',
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f9fafb; margin: 0; padding: 0; }
                    .container { max-width: 600px; margin: 0 auto; background: white; }
                    .header { background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: white; padding: 40px 20px; text-align: center; }
                    .header h1 { margin: 10px 0; font-size: 28px; font-weight: bold; }
                    .header p { margin: 8px 0 0 0; font-size: 16px; opacity: 0.95; }
                    .content { padding: 30px; }
                    .success-box { background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%); border: 2px solid #22c55e; padding: 25px; border-radius: 12px; margin: 20px 0; text-align: center; }
                    .success-message { color: #065f46; font-size: 16px; font-weight: 600; }
                    .info-box { background: #f0fdf4; border-left: 4px solid #22c55e; padding: 15px; border-radius: 6px; margin: 20px 0; color: #065f46; font-size: 14px; }
                    .footer { background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 13px; border-top: 1px solid #e5e7eb; }
                </style>
            </head>
            <body>
                <div class="container">
                    ${getLogoHeader()}
                    <div class="header">
                         <div style="font-size: 48px;">✅</div>
                         <h1>Password Updated</h1>
                         <p>Account Secured</p>
                     </div>
                    <div class="content">
                        <p>Hi <strong>${name}</strong>,</p>
                        
                        <div class="success-box">
                            <div class="success-message">🔒 Your password has been successfully changed!</div>
                        </div>
                        
                        <div class="info-box">
                            <strong>ℹ️ What's Next:</strong><br>
                            You can now log in with your new password on CrashKart. Make sure to keep your password secure and don't share it with anyone.
                        </div>
                        
                        <div class="info-box">
                            <strong>🔐 Security Reminder:</strong><br>
                            If you didn't change your password, contact support immediately at crashkart.help@gmail.com
                        </div>
                    </div>

                    <div class="footer">
                        <p style="margin: 0;">© ${getCurrentYear()} CrashKart. All rights reserved.</p>
                        <p style="margin: 8px 0 0 0; font-size: 12px;">Crafted with ❤️ by ${getDeveloperName()}</p>
                        <p style="margin: 5px 0 0 0;">Your Shopping Destination</p>
                    </div>
                </div>
            </body>
            </html>
        `
    };
};

// Email Verification Email
// Email Verification Email - Vibrant
export const emailVerificationEmail = (name, verificationToken) => {
    return {
        subject: '✅ Verify Your CrashKart Email Address',
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f9fafb; margin: 0; padding: 0; }
                    .container { max-width: 600px; margin: 0 auto; background: white; }
                    .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 40px 20px; text-align: center; }
                    .header h1 { margin: 10px 0; font-size: 28px; font-weight: bold; }
                    .header p { margin: 8px 0 0 0; font-size: 16px; opacity: 0.95; }
                    .content { padding: 30px; }
                    .verify-box { background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%); border: 2px solid #10b981; padding: 25px; border-radius: 12px; margin: 20px 0; text-align: center; }
                    .verify-message { color: #065f46; font-size: 16px; font-weight: 600; margin-bottom: 15px; }
                    .cta-button { display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 14px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; }
                    .info-box { background: #f0fdf4; border-left: 4px solid #10b981; padding: 15px; border-radius: 6px; margin: 20px 0; color: #065f46; font-size: 14px; }
                    .footer { background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 13px; border-top: 1px solid #e5e7eb; }
                </style>
            </head>
            <body>
                <div class="container">
                    ${getLogoHeader()}
                    <div class="header">
                         <div style="font-size: 48px;">✅</div>
                         <h1>Verify Your Email</h1>
                         <p>Complete Your Registration</p>
                     </div>
                    <div class="content">
                        <p>Hi <strong>${name}</strong>,</p>
                        <p>Thank you for signing up! Click the button below to verify your email address and activate your CrashKart account:</p>
                        
                        <div class="verify-box">
                            <div class="verify-message">🔗 Verify Your Email Address</div>
                            <a href="${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${verificationToken}" class="cta-button">Verify Email</a>
                        </div>
                        
                        <div class="info-box">
                            <strong>ℹ️ What happens next:</strong><br>
                            Once you verify your email, you'll be able to log in and start shopping on CrashKart!
                        </div>
                        
                        <p style="color: #6b7280; font-size: 14px; text-align: center; margin-top: 20px;">
                            This link is valid for 24 hours. If you didn't create this account, please ignore this email.
                        </p>
                    </div>

                    <div class="footer">
                        <p style="margin: 0;">© ${getCurrentYear()} CrashKart. All rights reserved.</p>
                        <p style="margin: 8px 0 0 0; font-size: 12px;">Crafted with ❤️ by ${getDeveloperName()}</p>
                        <p style="margin: 5px 0 0 0;">Your Shopping Destination</p>
                    </div>
                </div>
            </body>
            </html>
        `
    };
};

// Order Cancelled Email
export const orderCancelledEmail = (name, orderData) => {
    return {
        subject: `Order Cancelled - ${orderData.orderId}`,
        html: `
            <!DOCTYPE html>
            <html>
            <body>
                <div style="max-width: 600px; margin: 0 auto; padding: 40px; background: white;">
                    ${getLogoHeader()}
                    <h1 style="color: #ef4444;">Order Cancelled</h1>
                    <p>Hi ${name},</p>
                    <p>Your order <strong>${orderData.orderId}</strong> has been cancelled.</p>
                    <p>Reason: ${orderData.reason || 'Not specified'}</p>
                    <p>If you have any questions, please contact our support team.</p>
                </div>
            </body>
            </html>
        `
    };
};

// Refund Processed Email
export const refundProcessedEmail = (name, refundData) => {
    return {
        subject: `Refund Processed - Order ${refundData.orderId}`,
        html: `
            <!DOCTYPE html>
            <html>
            <body>
                <div style="max-width: 600px; margin: 0 auto; padding: 40px; background: white; font-family: 'Segoe UI', Arial, sans-serif;">
                    ${getLogoHeader()}
                    <div style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); padding: 30px; border-radius: 8px; text-align: center; color: white; margin-bottom: 30px;">
                        <h1 style="margin: 0; font-size: 28px;">💰 Refund Processed</h1>
                    </div>
                    <p style="font-size: 16px; color: #1f2937;">Hi <strong>${name}</strong>,</p>
                    <p style="color: #4b5563;">Your refund for order <strong>${refundData.orderId}</strong> has been successfully processed.</p>
                    <div style="background: #f0fdf4; border-left: 4px solid #22c55e; padding: 20px; border-radius: 6px; margin: 20px 0;">
                        <p style="margin: 0 0 10px 0; color: #166534;"><strong>Refund Amount:</strong> ₹${refundData.amount}</p>
                        <p style="margin: 0 0 10px 0; color: #166534;"><strong>Refund Method:</strong> ${refundData.method || 'Original Payment Method'}</p>
                        <p style="margin: 0; color: #166534;"><strong>Processing Time:</strong> 3-5 business days</p>
                    </div>
                    <p style="color: #6b7280; font-size: 14px; background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 6px;">
                        ⏱️ The refund amount will be credited to your account within 3-5 business days depending on your bank.
                    </p>
                    <p style="color: #4b5563;">If you have any questions about your refund, please contact our support team at crashkart.help@gmail.com</p>
                    ${getEmailFooter()}
                </div>
            </body>
            </html>
        `
    };
};

// Return Approved Email
export const returnApprovedEmail = (name, returnData) => {
    return {
        subject: `Return Request Approved - Order ${returnData.orderId}`,
        html: `
            <!DOCTYPE html>
            <html>
            <body>
                <div style="max-width: 600px; margin: 0 auto; padding: 40px; background: white; font-family: 'Segoe UI', Arial, sans-serif;">
                    ${getLogoHeader()}
                    <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 30px; border-radius: 8px; text-align: center; color: white; margin-bottom: 30px;">
                        <h1 style="margin: 0; font-size: 28px;">✅ Return Approved</h1>
                    </div>
                    <p style="font-size: 16px; color: #1f2937;">Hi <strong>${name}</strong>,</p>
                    <p style="color: #4b5563;">Your return request for order <strong>${returnData.orderId}</strong> has been approved.</p>
                    <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 20px; border-radius: 6px; margin: 20px 0;">
                        <h3 style="margin: 0 0 15px 0; color: #1e40af;">Next Steps:</h3>
                        <ol style="margin: 0; padding-left: 20px; color: #1e40af;">
                            <li style="margin-bottom: 10px;">Our delivery partner will pick up the item from your address</li>
                            <li style="margin-bottom: 10px;">Expected pickup date: ${returnData.pickupDate || 'Within 2-3 business days'}</li>
                            <li style="margin-bottom: 10px;">Please keep the item ready in its original packaging</li>
                            <li>Refund will be processed after quality check (3-5 business days)</li>
                        </ol>
                    </div>
                    <p style="color: #6b7280; font-size: 14px; background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; border-radius: 6px;">
                        ⚠️ <strong>Important:</strong> Please ensure the product is in original condition with all tags and packaging intact.
                    </p>
                    <p style="color: #4b5563;">For any questions, contact us at crashkart.help@gmail.com</p>
                    ${getEmailFooter()}
                </div>
            </body>
            </html>
        `
    };
};

// Flash Sale Email - Vibrant
export const flashSaleEmail = (name, saleData) => {
    return {
        subject: '⚡ ${saleData.discount}% Flash Sale - Act Fast!',
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f9fafb; margin: 0; padding: 0; }
                    .container { max-width: 600px; margin: 0 auto; background: white; }
                    .header { background: linear-gradient(135deg, #ef4444 0%, #991b1b 100%); color: white; padding: 40px 20px; text-align: center; }
                    .header h1 { margin: 10px 0; font-size: 32px; font-weight: bold; }
                    .content { padding: 30px; }
                    .sale-badge { background: linear-gradient(135deg, #fecaca 0%, #fca5a5 100%); border: 3px dashed #ef4444; padding: 20px; text-align: center; border-radius: 12px; margin: 20px 0; }
                    .discount-text { font-size: 48px; font-weight: 900; color: #991b1b; line-height: 1; }
                    .sale-message { color: #7f1d1d; font-size: 18px; font-weight: 700; margin: 10px 0 0 0; }
                    .timer { background: #fee2e2; border-left: 4px solid #ef4444; padding: 15px; border-radius: 6px; margin: 20px 0; color: #991b1b; font-weight: 600; }
                    .cta-button { display: inline-block; background: linear-gradient(135deg, #ef4444 0%, #991b1b 100%); color: white; padding: 14px 40px; text-decoration: none; border-radius: 8px; margin: 25px 0; font-weight: 600; font-size: 16px; }
                    .footer { background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 13px; border-top: 1px solid #e5e7eb; }
                </style>
            </head>
            <body>
                <div class="container">
                    ${getLogoHeader()}
                    <div class="header">
                         <div style="font-size: 48px;">⚡</div>
                         <h1>FLASH SALE!</h1>
                         <p>Limited Time Only</p>
                     </div>
                    <div class="content">
                        <p>Hi <strong>${name}</strong>,</p>
                        
                        <div class="sale-badge">
                            <div class="discount-text">${saleData.discount}%</div>
                            <div class="sale-message">OFF NOW!</div>
                        </div>
                        
                        <p style="font-size: 16px; color: #1f2937; text-align: center; font-weight: 600; margin: 20px 0;">
                            🔥 Exclusive deals on selected items 🔥
                        </p>
                        
                        <div class="timer">
                            ⏰ Sale ends soon! Don't miss out on these amazing prices!
                        </div>
                        
                        <p style="text-align: center;">
                            <a href="${process.env.NEXT_PUBLIC_APP_URL}/shop" class="cta-button">🛍️ SHOP NOW</a>
                        </p>
                        
                        <p style="color: #6b7280; font-size: 14px; text-align: center;">
                            Hurry! These deals are available for a limited time only.
                        </p>
                    </div>

                    <div class="footer">
                        <p style="margin: 0;">© ${getCurrentYear()} CrashKart. All rights reserved.</p>
                        <p style="margin: 8px 0 0 0; font-size: 12px;">Crafted with ❤️ by ${getDeveloperName()}</p>
                        <p style="margin: 5px 0 0 0;">Your Shopping Destination</p>
                    </div>
                </div>
            </body>
            </html>
        `
    };
};

// Abandoned Cart Email - Vibrant
export const abandonedCartEmail = (name, cartData) => {
    return {
        subject: '🛒 Don\'t Miss Out! Complete Your Order',
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f9fafb; margin: 0; padding: 0; }
                    .container { max-width: 600px; margin: 0 auto; background: white; }
                    .header { background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%); color: white; padding: 40px 20px; text-align: center; }
                    .header h1 { margin: 10px 0; font-size: 32px; font-weight: bold; }
                    .content { padding: 30px; }
                    .cart-total { background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); border: 2px solid #3b82f6; padding: 20px; text-align: center; border-radius: 12px; margin: 20px 0; }
                    .total-amount { font-size: 42px; font-weight: 900; color: #1e40af; }
                    .total-label { color: #1e40af; font-weight: 600; margin-top: 8px; font-size: 14px; }
                    .reminder-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 6px; margin: 20px 0; color: #92400e; }
                    .cta-button { display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%); color: white; padding: 14px 40px; text-decoration: none; border-radius: 8px; margin: 25px 0; font-weight: 600; font-size: 16px; }
                    .footer { background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 13px; border-top: 1px solid #e5e7eb; }
                </style>
            </head>
            <body>
                <div class="container">
                    ${getLogoHeader()}
                    <div class="header">
                         <div style="font-size: 48px;">🛒</div>
                         <h1>Complete Your Order</h1>
                         <p>Your Cart is Waiting</p>
                     </div>
                    <div class="content">
                        <p>Hi <strong>${name}</strong>,</p>
                        <p>We noticed you left some amazing items in your cart. Your order is waiting for you!</p>
                        
                        <div class="cart-total">
                            <div class="total-amount">₹${cartData.total}</div>
                            <div class="total-label">Total Value</div>
                        </div>
                        
                        <div class="reminder-box">
                            ⏰ Don't wait too long! Popular items sell out fast.
                        </div>
                        
                        <p style="text-align: center;">
                            <a href="${process.env.NEXT_PUBLIC_APP_URL}/cart" class="cta-button">✓ Complete Purchase</a>
                        </p>
                        
                        <p style="color: #6b7280; font-size: 14px; text-align: center;">
                            Need help? Our support team is available 24/7.
                        </p>
                    </div>

                    <div class="footer">
                        <p style="margin: 0;">© ${getCurrentYear()} CrashKart. All rights reserved.</p>
                        <p style="margin: 8px 0 0 0; font-size: 12px;">Crafted with ❤️ by ${getDeveloperName()}</p>
                        <p style="margin: 5px 0 0 0;">Your Shopping Destination</p>
                    </div>
                </div>
            </body>
            </html>
        `
    };
};

// Back In Stock Email
export const backInStockEmail = (name, productData) => {
    return {
        subject: `${productData.productName} is Back in Stock!`,
        html: `
            <!DOCTYPE html>
            <html>
            <body>
                <div style="max-width: 600px; margin: 0 auto; padding: 40px; background: white;">
                    ${getLogoHeader()}
                    <h1 style="color: #22c55e;">✅ Back in Stock!</h1>
                    <p>Hi ${name},</p>
                    <p><strong>${productData.productName}</strong> is now back in stock!</p>
                    <a href="${process.env.NEXT_PUBLIC_APP_URL}/product/${productData.productId}" style="display: inline-block; background: #22c55e; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0;">View Product</a>
                </div>
            </body>
            </html>
        `
    };
};

// Price Drop Email
export const priceDropEmail = (name, productData) => {
    return {
        subject: `Price Drop: ${productData.productName}`,
        html: `
            <!DOCTYPE html>
            <html>
            <body>
                <div style="max-width: 600px; margin: 0 auto; padding: 40px; background: white;">
                    ${getLogoHeader()}
                    <h1 style="color: #f59e0b;">💰 Price Drop!</h1>
                    <p>Hi ${name},</p>
                    <p><strong>${productData.productName}</strong> price has dropped!</p>
                    <p>New Price: <span style="font-size: 24px; color: #ef4444; font-weight: bold;">₹${productData.newPrice}</span></p>
                    <p style="text-decoration: line-through; color: #6b7280;">Old Price: ₹${productData.oldPrice}</p>
                    <a href="${process.env.NEXT_PUBLIC_APP_URL}/product/${productData.productId}" style="display: inline-block; background: #f59e0b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0;">Buy Now</a>
                </div>
            </body>
            </html>
        `
    };
};

// Account Deactivation Warning Email
export const accountDeactivationWarningEmail = (name) => {
    return {
        subject: 'Your Account Will Be Deactivated',
        html: `
            <!DOCTYPE html>
            <html>
            <body>
                <div style="max-width: 600px; margin: 0 auto; padding: 40px; background: white;">
                    ${getLogoHeader()}
                    <h1 style="color: #ef4444;">⚠️ Account Deactivation Notice</h1>
                    <p>Hi ${name},</p>
                    <p>Your account has been inactive for 90 days and will be deactivated.</p>
                    <a href="${process.env.NEXT_PUBLIC_APP_URL}/profile" style="display: inline-block; background: #ef4444; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0;">Keep Account Active</a>
                </div>
            </body>
            </html>
        `
    };
};

// CrashCash Earned Email
export const crashCashEarnedEmail = (name, rewardData) => {
    return {
        subject: '🎉 You Earned CrashCash!',
        html: `
            <!DOCTYPE html>
            <html>
            <body>
                <div style="max-width: 600px; margin: 0 auto; padding: 40px; background: white;">
                    ${getLogoHeader()}
                    <h1 style="color: #fbbf24;">🎉 CrashCash Earned!</h1>
                    <p>Hi ${name},</p>
                    <p>You've earned <strong style="font-size: 24px; color: #fbbf24;">₹${rewardData.amount}</strong> in CrashCash!</p>
                    <p>Order: ${rewardData.orderId}</p>
                    <a href="${process.env.NEXT_PUBLIC_APP_URL}/crash-cash" style="display: inline-block; background: #fbbf24; color: #333; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0;">View CrashCash</a>
                </div>
            </body>
            </html>
        `
    };
};

// Birthday Email
export const birthdayEmail = (name, rewardData) => {
    return {
        subject: '🎂 Happy Birthday! Special Gift Inside',
        html: `
            <!DOCTYPE html>
            <html>
            <body>
                <div style="max-width: 600px; margin: 0 auto; padding: 40px; background: white;">
                    ${getLogoHeader()}
                    <h1 style="color: #ec4899;">🎂 Happy Birthday ${name}!</h1>
                    <p>We have a special birthday gift for you!</p>
                    <p style="font-size: 18px; color: #ec4899; font-weight: bold;">₹${rewardData.amount} Voucher</p>
                    <p>Coupon Code: ${rewardData.code}</p>
                    <a href="${process.env.NEXT_PUBLIC_APP_URL}/shop" style="display: inline-block; background: #ec4899; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0;">Shop Now</a>
                </div>
            </body>
            </html>
        `
    };
};

// Review Request Email
export const reviewRequestEmail = (name, orderData) => {
    return {
        subject: `How was your experience with order ${orderData.orderId}?`,
        html: `
            <!DOCTYPE html>
            <html>
            <body>
                <div style="max-width: 600px; margin: 0 auto; padding: 40px; background: white;">
                    ${getLogoHeader()}
                    <h1>Share Your Experience</h1>
                    <p>Hi ${name},</p>
                    <p>We'd love to hear about your experience with order <strong>${orderData.orderId}</strong>.</p>
                    <a href="${process.env.NEXT_PUBLIC_APP_URL}/my-orders/${orderData.orderId}/review" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0;">Leave a Review</a>
                </div>
            </body>
            </html>
        `
    };
};

// Newsletter Welcome Email
export const newsletterWelcomeEmail = (name) => {
    return {
        subject: 'Welcome to CrashKart Newsletter!',
        html: `
            <!DOCTYPE html>
            <html>
            <body>
                <div style="max-width: 600px; margin: 0 auto; padding: 40px; background: white;">
                    ${getLogoHeader()}
                    <h1>Welcome to Our Newsletter!</h1>
                    <p>Hi ${name},</p>
                    <p>Thank you for subscribing to our newsletter. You'll now receive exclusive deals and updates!</p>
                </div>
            </body>
            </html>
        `
    };
};

// Promotional Newsletter Email
export const promotionalNewsletterEmail = (name, promoData) => {
    return {
        subject: promoData.subject || 'Exclusive Offers Just For You',
        html: `
            <!DOCTYPE html>
            <html>
            <body>
                <div style="max-width: 600px; margin: 0 auto; padding: 40px; background: white;">
                    ${getLogoHeader()}
                    <h1>${promoData.title}</h1>
                    <p>Hi ${name},</p>
                    <p>${promoData.message}</p>
                    <a href="${promoData.link}" style="display: inline-block; background: #ef4444; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0;">Shop Now</a>
                </div>
            </body>
            </html>
        `
    };
};

// Win Back Inactive User Email
export const winBackInactiveUserEmail = (name, offerData) => {
    return {
        subject: offerData.subject || 'We Miss You! Special Offer Inside',
        html: `
            <!DOCTYPE html>
            <html>
            <body>
                <div style="max-width: 600px; margin: 0 auto; padding: 40px; background: white;">
                    ${getLogoHeader()}
                    <h1>We Miss You, ${name}!</h1>
                    <p>We noticed you haven't visited us in a while. Here's a special offer just for you:</p>
                    <p style="font-size: 24px; font-weight: bold; color: #ef4444;">${offerData.discount}% OFF</p>
                    <p>Use code: <strong>${offerData.code}</strong></p>
                    <a href="${offerData.link}" style="display: inline-block; background: #ef4444; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0;">Shop Now</a>
                </div>
            </body>
            </html>
        `
    };
};

// Special Offer Email
export const specialOfferEmail = (name, offerData) => {
    return {
        subject: offerData.subject || 'Special Offer Just For You!',
        html: `
            <!DOCTYPE html>
            <html>
            <body>
                <div style="max-width: 600px; margin: 0 auto; padding: 40px; background: white;">
                    ${getLogoHeader()}
                    <h1 style="color: #ef4444;">${offerData.title}</h1>
                    <p>Hi ${name},</p>
                    <p>${offerData.description}</p>
                    <p style="font-size: 24px; color: #ef4444; font-weight: bold;">${offerData.discount}% OFF</p>
                    <p>Code: <strong>${offerData.code}</strong></p>
                    <a href="${offerData.link}" style="display: inline-block; background: #ef4444; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0;">Redeem Now</a>
                </div>
            </body>
            </html>
        `
    };
};

// Weekly Deals Email
export const weeklyDealsEmail = (name, dealsData) => {
    return {
        subject: 'This Week\'s Best Deals',
        html: `
            <!DOCTYPE html>
            <html>
            <body>
                <div style="max-width: 600px; margin: 0 auto; padding: 40px; background: white;">
                    ${getLogoHeader()}
                    <h1>This Week's Best Deals</h1>
                    <p>Hi ${name},</p>
                    <p>Check out this week's hottest deals:</p>
                    <ul>
                        ${dealsData.deals.map(deal => `<li>${deal.name} - ${deal.discount}% OFF</li>`).join('')}
                    </ul>
                    <a href="${dealsData.link}" style="display: inline-block; background: #ef4444; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0;">View All Deals</a>
                </div>
            </body>
            </html>
        `
    };
};

// Order Status Update Email - Professional & Vibrant
export const orderStatusEmail = (name, orderData) => {
    const {
        orderId,
        orderStatus,
        status,
        items = [],
        total,
        address,
        trackingLink = '#'
    } = orderData;

    // Use orderStatus if available, fallback to status
    const currentStatus = (orderStatus || status || 'ORDER_PLACED').toUpperCase();

    // Status configurations with colors and icons
    const statusConfig = {
        'ORDER_PLACED': {
            color: '#f59e0b',
            bgColor: '#fef3c7',
            icon: '📦',
            title: 'Order Confirmed!',
            message: 'Your order has been placed successfully.',
            textColor: '#92400e'
        },
        'PROCESSING': {
            color: '#3b82f6',
            bgColor: '#dbeafe',
            icon: '⚙️',
            title: 'Processing Your Order',
            message: 'We\'re preparing your items for shipment.',
            textColor: '#1e40af'
        },
        'SHIPPED': {
            color: '#10b981',
            bgColor: '#d1fae5',
            icon: '🚚',
            title: 'Order Shipped!',
            message: 'Your package is on its way to you!',
            textColor: '#065f46'
        },
        'DELIVERED': {
            color: '#06b6d4',
            bgColor: '#cffafe',
            icon: '✅',
            title: 'Order Delivered!',
            message: 'Your order has been successfully delivered.',
            textColor: '#164e63'
        },
        'PAYMENT_PENDING': {
            color: '#ef4444',
            bgColor: '#fee2e2',
            icon: '💳',
            title: 'Payment Pending',
            message: 'Please complete the payment for your order.',
            textColor: '#991b1b'
        }
    };

    const config = statusConfig[currentStatus] || statusConfig['ORDER_PLACED'];

    const itemsHTML = items && items.length > 0 ? items.map(item => `
        <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 12px; text-align: left;">
                ${getProductImageHTML(item, '50px')}
                <span>${item.name}</span>
            </td>
            <td style="padding: 12px; text-align: center;">${item.quantity}</td>
            <td style="padding: 12px; text-align: right;">₹${(item.price * item.quantity).toFixed(2)}</td>
        </tr>
    `).join('') : '<tr><td colspan="3" style="padding: 12px; text-align: center; color: #6b7280;">No items to display</td></tr>';

    return {
        subject: `${config.icon} ${config.title} - Order ${orderId.substring(0, 8)}`,
        html: `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background: #f9fafb; }
                    .container { max-width: 600px; margin: 0 auto; background: white; }
                    .header { background: linear-gradient(135deg, ${config.color} 0%, ${config.color}dd 100%); color: white; padding: 40px 20px; text-align: center; }
                    .header h1 { margin: 10px 0; font-size: 28px; font-weight: bold; }
                    .header p { margin: 8px 0; font-size: 16px; opacity: 0.95; }
                    .status-badge { background: ${config.bgColor}; color: ${config.textColor}; padding: 15px 20px; border-radius: 8px; margin: 20px 0; text-align: center; border-left: 4px solid ${config.color}; }
                    .status-badge .status-icon { font-size: 32px; margin-bottom: 8px; }
                    .status-badge .status-text { font-weight: 600; font-size: 16px; }
                    .content { padding: 30px; }
                    .section { margin: 25px 0; }
                    .section-title { font-size: 16px; font-weight: 700; color: #1f2937; margin-bottom: 15px; border-bottom: 2px solid ${config.color}; padding-bottom: 10px; }
                    .order-info { background: #f3f4f6; padding: 15px; border-radius: 6px; margin: 15px 0; }
                    .order-info-item { display: flex; justify-content: space-between; padding: 8px 0; }
                    .order-info-label { color: #6b7280; font-weight: 600; }
                    .order-info-value { color: #1f2937; font-weight: 500; }
                    .items-table { width: 100%; border-collapse: collapse; margin: 15px 0; }
                    .items-table th { background: #f3f4f6; padding: 12px; text-align: left; font-weight: 600; color: #1f2937; border-bottom: 2px solid #e5e7eb; }
                    .items-table td { padding: 12px; }
                    .total-section { background: #f3f4f6; padding: 15px; border-radius: 6px; text-align: right; }
                    .total-row { display: flex; justify-content: space-between; padding: 8px 0; font-weight: 600; font-size: 16px; }
                    .total-amount { color: ${config.color}; font-size: 20px; }
                    .button { display: inline-block; background: linear-gradient(135deg, ${config.color} 0%, ${config.color}dd 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 15px 0; font-weight: 600; text-align: center; transition: transform 0.3s; }
                    .button:hover { transform: scale(1.05); }
                    .address-box { background: #f0fdf4; border-left: 4px solid #22c55e; padding: 15px; border-radius: 4px; margin: 15px 0; }
                    .footer { background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 13px; border-top: 1px solid #e5e7eb; }
                    .divider { height: 1px; background: #e5e7eb; margin: 20px 0; }
                </style>
            </head>
            <body>
                <div class="container">
                    ${getLogoHeader()}
                    
                    <div class="header">
                        <div style="font-size: 48px;">${config.icon}</div>
                        <h1>${config.title}</h1>
                        <p>${config.message}</p>
                    </div>

                    <div class="content">
                        <p>Hi <strong>${name || 'Customer'}</strong>,</p>
                        
                        <div class="status-badge">
                            <div class="status-icon">${config.icon}</div>
                            <div class="status-text">Order Status: ${currentStatus.replace(/_/g, ' ')}</div>
                        </div>

                        <div class="section">
                            <div class="section-title">📋 Order Information</div>
                            <div class="order-info">
                                <div class="order-info-item">
                                    <span class="order-info-label">Order ID:</span>
                                    <span class="order-info-value">${orderId}</span>
                                </div>
                                <div class="order-info-item">
                                    <span class="order-info-label">Status:</span>
                                    <span class="order-info-value" style="color: ${config.color}; font-weight: bold;">${currentStatus.replace(/_/g, ' ')}</span>
                                </div>
                                ${trackingLink && trackingLink !== '#' ? `
                                <div class="order-info-item">
                                    <span class="order-info-label">Action:</span>
                                    <a href="${trackingLink}" style="color: ${config.color}; text-decoration: none; font-weight: 600;">Track Order →</a>
                                </div>
                                ` : ''}
                            </div>
                        </div>

                        ${items && items.length > 0 ? `
                        <div class="section">
                            <div class="section-title">📦 Order Items</div>
                            <table class="items-table">
                                <thead>
                                    <tr>
                                        <th>Product</th>
                                        <th>Qty</th>
                                        <th style="text-align: right;">Price</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${itemsHTML}
                                </tbody>
                            </table>
                        </div>
                        ` : ''}

                        ${total ? `
                        <div class="total-section">
                            <div class="total-row">
                                <span>Total Amount:</span>
                                <span class="total-amount">₹${total.toFixed(2)}</span>
                            </div>
                        </div>
                        ` : ''}

                        ${address ? `
                        <div class="section">
                            <div class="section-title">📍 Delivery Address</div>
                            <div class="address-box">
                                <p style="margin: 0; font-weight: 600; color: #1f2937;">${address.fullName || 'Customer'}</p>
                                <p style="margin: 5px 0 0 0; color: #6b7280;">
                                    ${address.street}<br>
                                    ${address.city}, ${address.state} ${address.zipCode}<br>
                                    ${address.country || 'India'}
                                </p>
                                ${address.phone ? `<p style="margin: 10px 0 0 0; color: #6b7280;">📱 ${address.phone}</p>` : ''}
                            </div>
                        </div>
                        ` : ''}

                        ${trackingLink && trackingLink !== '#' ? `
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${trackingLink}" class="button">📍 Track Your Order</a>
                        </div>
                        ` : ''}

                        <div class="divider"></div>

                        <p style="color: #6b7280; font-size: 14px;">
                            If you have any questions about your order, please don't hesitate to contact our support team at 
                            <a href="mailto:crashkart.help@gmail.com" style="color: ${config.color}; text-decoration: none;">crashkart.help@gmail.com</a>
                        </p>

                        <p style="margin-top: 20px; color: #1f2937; font-weight: 600;">
                            Thank you for shopping with CrashKart! 🙏
                        </p>
                    </div>

                    <div class="footer">
                        <p style="margin: 0;">© ${getCurrentYear()} CrashKart. All rights reserved.</p>
                        <p style="margin: 8px 0 0 0; font-size: 12px;">Crafted with ❤️ by ${getDeveloperName()}</p>
                        <p style="margin: 5px 0 0 0;">Your Shopping Destination</p>
                    </div>
                </div>
            </body>
            </html>
        `
    };
};
