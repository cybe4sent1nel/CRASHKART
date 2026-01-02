import nodemailer from 'nodemailer'

// Create reusable transporter
const createTransporter = () => {
    return nodemailer.createTransporter({
        service: process.env.EMAIL_SERVICE || 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    })
}

/**
 * Send Order Placed Confirmation Email
 * @param {Object} data - Email data
 * @param {Object} data.order - Order object with items, address, user
 * @param {string} data.customerEmail - Customer email address
 * @param {string} data.customerName - Customer name
 */
export async function sendOrderPlacedEmail(data) {
    const { order, customerEmail, customerName } = data

    const transporter = createTransporter()

    const productsHTML = order.orderItems.map(item => `
        <tr>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
                <div style="display: flex; align-items: center; gap: 10px;">
                    ${item.product?.images?.[0] ? `
                        <img src="${item.product.images[0]}" alt="${item.product.name}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px; border: 1px solid #e5e7eb;" />
                    ` : ''}
                    <div>
                        <p style="font-weight: 600; margin: 0; color: #1f2937;">${item.product?.name || 'Product'}</p>
                        <p style="font-size: 14px; color: #6b7280; margin: 5px 0 0 0;">Qty: ${item.quantity}</p>
                    </div>
                </div>
            </td>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600;">
                ₹${item.price.toFixed(2)}
            </td>
        </tr>
    `).join('')

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: customerEmail,
        subject: `🎉 Order Confirmed - ${order.id.slice(-8).toUpperCase()}`,
        headers: {
            'Content-Type': 'text/html; charset=UTF-8'
        },
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    body {
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                        line-height: 1.6;
                        color: #333;
                        margin: 0;
                        padding: 0;
                        background: #f9fafb;
                    }
                    .container {
                        max-width: 600px;
                        margin: 20px auto;
                        background: #ffffff;
                        border-radius: 16px;
                        overflow: hidden;
                        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                    }
                    .header {
                        background: linear-gradient(135deg, #ec4899 0%, #9333ea 100%);
                        color: white;
                        padding: 40px 30px;
                        text-align: center;
                    }
                    .header h1 {
                        margin: 0 0 10px 0;
                        font-size: 32px;
                    }
                    .header p {
                        margin: 0;
                        opacity: 0.9;
                        font-size: 16px;
                    }
                    .content {
                        padding: 30px;
                    }
                    .success-box {
                        background: #d1fae5;
                        border-left: 4px solid #10b981;
                        padding: 20px;
                        border-radius: 8px;
                        margin-bottom: 25px;
                    }
                    .success-box p {
                        margin: 0;
                        color: #065f46;
                        font-size: 16px;
                    }
                    .info-box {
                        background: #f3f4f6;
                        padding: 20px;
                        border-radius: 8px;
                        margin-bottom: 25px;
                    }
                    .info-box h3 {
                        margin: 0 0 15px 0;
                        color: #1f2937;
                        font-size: 18px;
                    }
                    .info-row {
                        display: flex;
                        justify-content: space-between;
                        margin-bottom: 10px;
                        font-size: 14px;
                    }
                    .info-row strong {
                        color: #4b5563;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin: 20px 0;
                    }
                    th {
                        background: #f9fafb;
                        padding: 12px;
                        text-align: left;
                        font-weight: 600;
                        color: #4b5563;
                        border-bottom: 2px solid #e5e7eb;
                    }
                    .total-row {
                        background: #f9fafb;
                        font-weight: 600;
                        color: #1f2937;
                    }
                    .button {
                        display: inline-block;
                        padding: 14px 28px;
                        background: linear-gradient(135deg, #ec4899 0%, #9333ea 100%);
                        color: white;
                        text-decoration: none;
                        border-radius: 8px;
                        font-weight: 600;
                        margin: 20px 0;
                        text-align: center;
                    }
                    .footer {
                        background: #f9fafb;
                        padding: 30px;
                        text-align: center;
                        border-top: 1px solid #e5e7eb;
                    }
                    .footer p {
                        margin: 5px 0;
                        color: #6b7280;
                        font-size: 14px;
                    }
                    .social-links {
                        margin-top: 20px;
                    }
                    .social-links a {
                        display: inline-block;
                        margin: 0 10px;
                        color: #9333ea;
                        text-decoration: none;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🎉 Order Confirmed!</h1>
                        <p>Thank you for shopping with CrashKart</p>
                    </div>
                    
                    <div class="content">
                        <p style="font-size: 16px; color: #1f2937;">Dear ${customerName},</p>
                        
                        <div class="success-box">
                            <p><strong>✓ Your order has been successfully placed!</strong></p>
                        </div>

                        <p style="color: #4b5563;">We're excited to get your order to you as soon as possible. Here are the details:</p>

                        <div class="info-box">
                            <h3>📋 Order Information</h3>
                            <div class="info-row">
                                <span><strong>Order ID:</strong></span>
                                <span>${order.id.slice(-8).toUpperCase()}</span>
                            </div>
                            <div class="info-row">
                                <span><strong>Order Date:</strong></span>
                                <span>${new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                            </div>
                            <div class="info-row">
                                <span><strong>Payment Method:</strong></span>
                                <span>${order.paymentMethod}</span>
                            </div>
                            <div class="info-row">
                                <span><strong>Payment Status:</strong></span>
                                <span style="color: ${order.isPaid ? '#10b981' : '#f59e0b'};">${order.isPaid ? 'Paid' : 'Pending'}</span>
                            </div>
                        </div>

                        <h3 style="color: #1f2937; margin-top: 30px;">📦 Order Items</h3>
                        <table>
                            <thead>
                                <tr>
                                    <th>Product</th>
                                    <th style="text-align: right;">Price</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${productsHTML}
                                <tr class="total-row">
                                    <td style="padding: 15px;">Total Amount</td>
                                    <td style="padding: 15px; text-align: right; font-size: 18px; color: #9333ea;">₹${order.total.toFixed(2)}</td>
                                </tr>
                            </tbody>
                        </table>

                        <div class="info-box">
                            <h3>📍 Delivery Address</h3>
                            <p style="margin: 0; color: #4b5563; line-height: 1.8;">
                                <strong>${order.address?.name}</strong><br>
                                ${order.address?.street}<br>
                                ${order.address?.city}, ${order.address?.state} - ${order.address?.zip}<br>
                                ${order.address?.country}<br>
                                📞 ${order.address?.phone}
                            </p>
                        </div>

                        <div style="text-align: center;">
                            <a href="${process.env.NEXT_PUBLIC_APP_URL}/my-orders" class="button">
                                Track Your Order
                            </a>
                        </div>

                        <div style="background: #fef3c7; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b; margin-top: 25px;">
                            <p style="margin: 0; color: #92400e; font-size: 14px;">
                                <strong>💰 CrashCash Earned!</strong><br>
                                You've earned CrashCash rewards with this order. Check your wallet to see your balance!
                            </p>
                        </div>

                        <h3 style="color: #1f2937; margin-top: 30px;">What's Next?</h3>
                        <ol style="color: #4b5563; padding-left: 20px;">
                            <li>We'll prepare your order for shipment</li>
                            <li>You'll receive a shipping confirmation email</li>
                            <li>Track your order in real-time from My Orders page</li>
                            <li>Your order will be delivered within 3-5 business days</li>
                        </ol>

                        <p style="margin-top: 30px; color: #4b5563;">
                            If you have any questions, feel free to contact our support team at 
                            <a href="mailto:crashkart.help@gmail.com" style="color: #9333ea;">crashkart.help@gmail.com</a>
                        </p>

                        <p style="margin-top: 30px; color: #1f2937;">
                            Thank you for choosing CrashKart!<br>
                            <strong>Happy Shopping! 🎉</strong>
                        </p>
                    </div>
                    
                    <div class="footer">
                        <p><strong>CrashKart</strong></p>
                        <p>Your Ultimate Gadget Shopping Destination</p>
                        <div class="social-links">
                            <a href="${process.env.NEXT_PUBLIC_APP_URL}">Visit Website</a> |
                            <a href="${process.env.NEXT_PUBLIC_APP_URL}/support">Get Support</a> |
                            <a href="${process.env.NEXT_PUBLIC_APP_URL}/my-orders">Track Orders</a>
                        </div>
                        <p style="margin-top: 20px; font-size: 12px; color: #9ca3af;">
                            This is an automated email. Please do not reply to this message.
                        </p>
                        <p style="font-size: 12px; color: #9ca3af;">
                            Developer: ${process.env.NEXT_PUBLIC_DEVELOPER_NAME || 'Fahad Khan (cybe4sent1nel)'}
                        </p>
                    </div>
                </div>
            </body>
            </html>
        `
    }

    await transporter.sendMail(mailOptions)
    console.log('📧 Order placed email sent to:', customerEmail)
}

/**
 * Send Invoice via Email
 * @param {Object} data - Email data
 * @param {string} data.customerEmail - Customer email
 * @param {string} data.customerName - Customer name
 * @param {Buffer} data.invoicePDF - Invoice PDF buffer
 * @param {string} data.orderId - Order ID
 */
export async function sendInvoiceEmail(data) {
    const { customerEmail, customerName, invoicePDF, orderId } = data

    const transporter = createTransporter()

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: customerEmail,
        subject: `Invoice for Order ${orderId.slice(-8).toUpperCase()}`,
        headers: {
            'Content-Type': 'text/html; charset=UTF-8'
        },
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; padding: 20px;">
                <div style="max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #9333ea;">Your CrashKart Invoice</h2>
                    <p>Dear ${customerName},</p>
                    <p>Please find attached the invoice for your order <strong>${orderId.slice(-8).toUpperCase()}</strong>.</p>
                    <p>Thank you for shopping with CrashKart!</p>
                    <br>
                    <p>Best regards,<br><strong>CrashKart Team</strong></p>
                </div>
            </body>
            </html>
        `,
        attachments: [
            {
                filename: `CrashKart_Invoice_${orderId.slice(-8).toUpperCase()}.pdf`,
                content: invoicePDF
            }
        ]
    }

    await transporter.sendMail(mailOptions)
    console.log('📧 Invoice email sent to:', customerEmail)
}
