import { prisma } from '@/lib/prisma'
import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
    },
})

export async function POST(request) {
    try {
        const { message, messageType, mediaUrl, mediaType, mediaDuration, orderId } = await request.json()

        // Get user ID from session/token
        const headers = request.headers
        const token = headers.get('authorization')?.split(' ')[1]
        let userId = null

        if (token) {
            try {
                const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString())
                userId = payload.id
            } catch (error) {
                console.log('Could not decode token')
            }
        }

        if (!userId) {
            return Response.json(
                { success: false, error: 'User not authenticated' },
                { status: 401 }
            )
        }

        // Validate video duration
        if (messageType === 'video' && mediaDuration > 120) {
            return Response.json(
                { success: false, error: 'Video must be 2 minutes or less' },
                { status: 400 }
            )
        }

        // Save chat message
        const chatMessage = await prisma.chatBotMessage.create({
            data: {
                userId,
                message,
                messageType,
                mediaUrl,
                mediaType,
                mediaDuration,
                isBot: false
            }
        })

        // If it contains issue description and is related to an order, create complaint
        let complaintId = null
        if (orderId && message && message.toLowerCase().includes('issue')) {
            try {
                const complaint = await prisma.complaint.create({
                    data: {
                        orderId,
                        userId,
                        subject: 'Chat Support - ' + message.substring(0, 50),
                        description: message,
                        category: 'other',
                        images: mediaUrl ? [mediaUrl] : [],
                        status: 'open',
                        priority: 'normal'
                    }
                })
                complaintId = complaint.id

                // Send email notification to admin
                const adminEmail = 'crashkart.help@gmail.com'
                const user = await prisma.user.findUnique({
                    where: { id: userId },
                    select: { email: true, name: true }
                })

                const emailContent = `
                    <h2>New Chat Support Complaint</h2>
                    <p><strong>Customer:</strong> ${user?.name || 'N/A'}</p>
                    <p><strong>Email:</strong> ${user?.email || 'N/A'}</p>
                    <p><strong>Order ID:</strong> ${orderId}</p>
                    <p><strong>Message:</strong></p>
                    <p>${message}</p>
                    ${mediaUrl ? `<p><strong>Media Attached:</strong> <a href="${mediaUrl}">${mediaType}</a></p>` : ''}
                    <p><a href="${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/admin/complaints/${complaint.id}">View in Admin Dashboard</a></p>
                `

                await transporter.sendMail({
                    from: process.env.EMAIL_USER,
                    to: adminEmail,
                    subject: `New Chat Support Complaint from Chat`,
                    html: emailContent,
                })
            } catch (error) {
                console.error('Error creating complaint from chat:', error)
                // Don't fail the request, just log it
            }
        }

        // Generate bot response
        let botResponse = 'Thank you for reaching out! '

        if (messageType === 'image') {
            botResponse += 'We\'ve received your image. Our team will review it and get back to you shortly. '
        } else if (messageType === 'video') {
            botResponse += `We\'ve received your video (${Math.floor(mediaDuration / 60)}:${String(mediaDuration % 60).padStart(2, '0')}). Our team will review it and assist you soon. `
        } else {
            botResponse += 'We\'ve received your message. '
        }

        if (orderId) {
            botResponse += 'We\'ll look into your order details and assist you shortly. '
        }

        if (complaintId) {
            botResponse += 'A complaint has been created and our support team will contact you within 24 hours. '
        } else {
            botResponse += 'Our support team will contact you as soon as possible. '
        }

        // Save bot response
        await prisma.chatBotMessage.create({
            data: {
                userId,
                message: botResponse,
                messageType: 'text',
                isBot: true,
                complaintId
            }
        })

        return Response.json(
            {
                success: true,
                response: botResponse,
                complaintId,
                chatMessageId: chatMessage.id
            },
            { status: 201 }
        )
    } catch (error) {
        console.error('Error in chatbot:', error)
        return Response.json(
            { success: false, error: error.message },
            { status: 500 }
        )
    }
}
