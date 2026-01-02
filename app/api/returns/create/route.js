import { prisma } from '@/lib/prisma'
import { getCurrentSession } from '@/lib/session'
import nodemailer from 'nodemailer'

// Prevent Next.js from attempting to pre-render this route
export const dynamic = 'force-dynamic'

export async function POST(req) {
    try {
        const { authOptions } = await import('@/lib/auth');
        const session = await getCurrentSession();
        
        if (!session?.user?.email) {
            return Response.json(
                { message: 'Unauthorized' },
                { status: 401 }
            )
        }

        const body = await req.json()
        const {
            orderId,
            issue,
            description,
            images,
            videos,
            customerName,
            customerMobile,
            bankAccountNo,
            ifscCode,
            requestType
        } = body

        // Validate required fields
        if (!orderId || !issue || !customerName || !customerMobile) {
            return Response.json(
                { message: 'Missing required fields' },
                { status: 400 }
            )
        }

        if (!images || images.length < 2 || images.length > 4) {
            return Response.json(
                { message: 'Please upload 2-4 images' },
                { status: 400 }
            )
        }

        // Get order details
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                orderItems: {
                    include: {
                        product: true
                    }
                },
                address: true,
                user: true
            }
        })

        if (!order) {
            return Response.json(
                { message: 'Order not found' },
                { status: 404 }
            )
        }

        // Check if order is delivered
        if (order.status !== 'DELIVERED') {
            return Response.json(
                { message: 'Return/Replace only available for delivered orders' },
                { status: 400 }
            )
        }

        // Check if within 7 days of delivery
        const deliveryDate = order.updatedAt // or use a specific deliveredAt field
        const daysSinceDelivery = Math.floor((Date.now() - new Date(deliveryDate).getTime()) / (1000 * 60 * 60 * 24))
        
        if (daysSinceDelivery > 7) {
            return Response.json(
                { message: 'Return/Replace window has expired (7 days)' },
                { status: 400 }
            )
        }

        // Check if return request already exists
        const existingReturn = await prisma.returnRequest.findUnique({
            where: { orderId }
        })

        if (existingReturn) {
            return Response.json(
                { message: 'Return request already exists for this order' },
                { status: 400 }
            )
        }

        // Validate bank details for COD orders
        if (order.paymentMethod === 'COD') {
            if (!bankAccountNo || !ifscCode) {
                return Response.json(
                    { message: 'Bank details required for COD refunds' },
                    { status: 400 }
                )
            }
        }

        // Generate RMA number
        const rmaNumber = `RMA-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`

        // Create return request
        const returnRequest = await prisma.returnRequest.create({
            data: {
                orderId,
                userId: order.userId,
                productId: order.orderItems[0].productId, // For first product (can be enhanced for multi-product)
                quantity: order.orderItems[0].quantity,
                issue,
                description: description || `Issue: ${issue}`,
                images,
                videos: videos || [],
                requestType: requestType || 'return',
                refundAmount: order.total,
                refundMethod: order.paymentMethod === 'COD' ? 'cod' : order.paymentMethod.toLowerCase(),
                customerName,
                customerMobile,
                bankAccountNo: bankAccountNo || null,
                ifscCode: ifscCode || null,
                rmaNumber,
                status: 'requested'
            }
        })

        // Send email to support team
        await sendReturnNotificationEmail({
            order,
            returnRequest,
            customerName,
            customerMobile,
            issue,
            description,
            images,
            videos,
            bankAccountNo,
            ifscCode
        })

        // Send confirmation email to customer
        await sendCustomerConfirmationEmail({
            customerEmail: order.user.email,
            customerName,
            orderId,
            rmaNumber,
            requestType: requestType || 'return'
        })

        return Response.json({
            success: true,
            message: 'Return/Replace request submitted successfully',
            rmaNumber,
            returnRequest
        })

    } catch (error) {
        console.error('Return request error:', error)
        return Response.json(
            { message: error.message || 'Failed to submit return request' },
            { status: 500 }
        )
    }
}

async function sendReturnNotificationEmail(data) {
    const {
        order,
        returnRequest,
        customerName,
        customerMobile,
        issue,
        description,
        images,
        videos,
        bankAccountNo,
        ifscCode
    } = data

    const transporter = nodemailer.createTransporter({
        service: process.env.EMAIL_SERVICE || 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    })

    const isCOD = order.paymentMethod === 'COD'
    const requestTypeLabel = returnRequest.requestType === 'return' ? 'RETURN' : 'REPLACEMENT'

    const productsHTML = order.orderItems.map(item => `
        <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.product.name}</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">₹${item.price.toFixed(2)}</td>
        </tr>
    `).join('')

    const imagesHTML = images.map((url, index) => `
        <div style="display: inline-block; margin: 5px;">
            <img src="${url}" alt="Issue ${index + 1}" style="width: 150px; height: 150px; object-fit: cover; border-radius: 8px; border: 2px solid #ddd;" />
        </div>
    `).join('')

    const videosHTML = videos && videos.length > 0 ? videos.map((url, index) => `
        <div style="margin: 10px 0;">
            <a href="${url}" style="color: #9333ea; text-decoration: none; font-weight: 600;">📹 View Video ${index + 1}</a>
        </div>
    `).join('') : '<p style="color: #666;">No videos uploaded</p>'

    const bankDetailsHTML = isCOD ? `
        <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
            <h3 style="margin: 0 0 10px 0; color: #92400e;">Bank Details for Refund</h3>
            <p style="margin: 5px 0;"><strong>Account Number:</strong> ${bankAccountNo}</p>
            <p style="margin: 5px 0;"><strong>IFSC Code:</strong> ${ifscCode}</p>
        </div>
    ` : `
        <div style="background: #d1fae5; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
            <p style="margin: 0; color: #065f46;"><strong>Refund Method:</strong> Original payment method (${order.paymentMethod})</p>
        </div>
    `

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: 'crashkart.help@gmail.com',
        subject: `🔴 URGENT: ${requestTypeLabel} Request - ${returnRequest.rmaNumber}`,
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 650px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #ec4899 0%, #9333ea 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
                    .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
                    .section { margin: 25px 0; padding: 20px; background: #f9fafb; border-radius: 8px; border-left: 4px solid #ec4899; }
                    .label { font-weight: 600; color: #4b5563; display: inline-block; min-width: 140px; }
                    table { width: 100%; border-collapse: collapse; margin: 15px 0; }
                    th { background: #f3f4f6; padding: 12px; text-align: left; font-weight: 600; border-bottom: 2px solid #e5e7eb; }
                    .footer { background: #f9fafb; padding: 20px; text-align: center; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb; border-top: none; }
                    .badge { display: inline-block; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase; }
                    .badge-urgent { background: #fee2e2; color: #991b1b; }
                    .badge-return { background: #dbeafe; color: #1e40af; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1 style="margin: 0; font-size: 28px;">⚠️ ${requestTypeLabel} REQUEST</h1>
                        <p style="margin: 10px 0 0 0; opacity: 0.9; font-size: 14px;">Immediate Action Required</p>
                    </div>
                    
                    <div class="content">
                        <div style="text-align: center; margin-bottom: 20px;">
                            <span class="badge badge-urgent">URGENT</span>
                            <span class="badge badge-return">${requestTypeLabel}</span>
                        </div>

                        <div class="section">
                            <h2 style="margin-top: 0; color: #9333ea;">📋 Request Details</h2>
                            <p><span class="label">RMA Number:</span> <strong>${returnRequest.rmaNumber}</strong></p>
                            <p><span class="label">Order ID:</span> ${order.id}</p>
                            <p><span class="label">Request Type:</span> ${requestTypeLabel}</p>
                            <p><span class="label">Issue:</span> ${issue}</p>
                            ${description ? `<p><span class="label">Description:</span> ${description}</p>` : ''}
                            <p><span class="label">Request Date:</span> ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</p>
                        </div>

                        <div class="section">
                            <h2 style="margin-top: 0; color: #9333ea;">👤 Customer Information</h2>
                            <p><span class="label">Name:</span> ${customerName}</p>
                            <p><span class="label">Email:</span> ${order.user.email}</p>
                            <p><span class="label">Mobile:</span> ${customerMobile}</p>
                            <p><span class="label">Address:</span> ${order.address.street}, ${order.address.city}, ${order.address.state} - ${order.address.zip}</p>
                        </div>

                        <div class="section">
                            <h2 style="margin-top: 0; color: #9333ea;">📦 Order Information</h2>
                            <table>
                                <thead>
                                    <tr>
                                        <th>Product</th>
                                        <th style="text-align: center;">Quantity</th>
                                        <th style="text-align: right;">Price</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${productsHTML}
                                </tbody>
                            </table>
                            <p style="text-align: right; font-size: 18px; font-weight: 600; color: #9333ea; margin-top: 15px;">
                                Total: ₹${order.total.toFixed(2)}
                            </p>
                            <p><span class="label">Payment Method:</span> ${order.paymentMethod}</p>
                            <p><span class="label">Order Date:</span> ${new Date(order.createdAt).toLocaleDateString('en-IN')}</p>
                        </div>

                        ${bankDetailsHTML}

                        <div class="section">
                            <h2 style="margin-top: 0; color: #9333ea;">📸 Uploaded Media</h2>
                            <h3 style="margin-bottom: 10px; font-size: 16px;">Images (${images.length}):</h3>
                            <div style="text-align: center;">
                                ${imagesHTML}
                            </div>
                            <h3 style="margin: 20px 0 10px 0; font-size: 16px;">Videos (${videos?.length || 0}):</h3>
                            ${videosHTML}
                        </div>

                        <div style="background: #fef2f2; padding: 20px; border-radius: 8px; border-left: 4px solid #ef4444; margin-top: 25px;">
                            <h3 style="margin: 0 0 10px 0; color: #991b1b;">⚡ Action Required</h3>
                            <ol style="margin: 10px 0; padding-left: 20px; color: #7f1d1d;">
                                <li>Review the issue and uploaded media</li>
                                <li>Contact customer if more information needed</li>
                                <li>Approve/Reject the ${requestTypeLabel.toLowerCase()} request</li>
                                <li>Arrange pickup if approved</li>
                                <li>Process refund/replacement after verification</li>
                            </ol>
                        </div>
                    </div>
                    
                    <div class="footer">
                        <p style="margin: 0; color: #6b7280; font-size: 14px;">
                            This is an automated notification from CrashKart Support System
                        </p>
                        <p style="margin: 5px 0 0 0; color: #9ca3af; font-size: 12px;">
                            Developer: ${process.env.NEXT_PUBLIC_DEVELOPER_NAME || 'Fahad Khan (cybe4sent1nel)'}
                        </p>
                    </div>
                </div>
            </body>
            </html>
        `
    }

    await transporter.sendMail(mailOptions)
}

async function sendCustomerConfirmationEmail(data) {
    const { customerEmail, customerName, orderId, rmaNumber, requestType } = data

    const transporter = nodemailer.createTransporter({
        service: process.env.EMAIL_SERVICE || 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    })

    const requestTypeLabel = requestType === 'return' ? 'Return' : 'Replacement'

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: customerEmail,
        subject: `✅ ${requestTypeLabel} Request Submitted - ${rmaNumber}`,
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #ec4899 0%, #9333ea 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
                    .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
                    .success-box { background: #d1fae5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981; }
                    .info-box { background: #dbeafe; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6; }
                    .footer { background: #f9fafb; padding: 20px; text-align: center; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb; border-top: none; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1 style="margin: 0;">✅ ${requestTypeLabel} Request Received</h1>
                        <p style="margin: 10px 0 0 0; opacity: 0.9;">We're processing your request</p>
                    </div>
                    
                    <div class="content">
                        <p>Dear ${customerName},</p>
                        
                        <div class="success-box">
                            <p style="margin: 0; font-size: 16px;"><strong>Your ${requestTypeLabel.toLowerCase()} request has been successfully submitted!</strong></p>
                        </div>

                        <p>We have received your ${requestTypeLabel.toLowerCase()} request and our team will review it shortly.</p>

                        <div class="info-box">
                            <p style="margin: 0 0 10px 0;"><strong>Request Details:</strong></p>
                            <p style="margin: 5px 0;"><strong>RMA Number:</strong> ${rmaNumber}</p>
                            <p style="margin: 5px 0;"><strong>Order ID:</strong> ${orderId.slice(-8).toUpperCase()}</p>
                            <p style="margin: 5px 0;"><strong>Request Type:</strong> ${requestTypeLabel}</p>
                        </div>

                        <h3>What happens next?</h3>
                        <ol>
                            <li>Our team will review your request within 24-48 hours</li>
                            <li>You will receive an email once your request is approved</li>
                            <li>Pickup will be arranged at your registered address</li>
                            <li>Refund will be processed after product verification</li>
                        </ol>

                        <p><strong>Please keep your RMA number (${rmaNumber}) handy for tracking.</strong></p>

                        <p style="margin-top: 30px;">If you have any questions, feel free to contact our support team.</p>

                        <p>Best regards,<br><strong>CrashKart Support Team</strong></p>
                    </div>
                    
                    <div class="footer">
                        <p style="margin: 0; color: #6b7280; font-size: 14px;">
                            © 2025 CrashKart. All rights reserved.
                        </p>
                        <p style="margin: 5px 0 0 0; color: #9ca3af; font-size: 12px;">
                            This is an automated email. Please do not reply.
                        </p>
                    </div>
                </div>
            </body>
            </html>
        `
    }

    await transporter.sendMail(mailOptions)
}
