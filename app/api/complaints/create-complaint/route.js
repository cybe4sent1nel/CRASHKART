import { prisma } from '@/lib/prisma';
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
    },
});

export async function POST(request) {
    try {
        const { orderId, userId, subject, description, category, images } = await request.json();

        // Create complaint
        const complaint = await prisma.complaint.create({
            data: {
                orderId,
                userId,
                subject,
                description,
                category: category || 'other',
                images: images || [],
                status: 'open',
                priority: 'normal',
            },
        });

        // Send email to admin
        const adminEmail = 'crashkart.help@gmail.com';
        const userEmail = await prisma.user.findUnique({
            where: { id: userId },
            select: { email: true, name: true }
        });

        const emailContent = `
            <h2>New Complaint Received</h2>
            <p><strong>Order ID:</strong> ${orderId}</p>
            <p><strong>Customer:</strong> ${userEmail?.name || 'N/A'}</p>
            <p><strong>Customer Email:</strong> ${userEmail?.email || 'N/A'}</p>
            <p><strong>Subject:</strong> ${subject}</p>
            <p><strong>Category:</strong> ${category}</p>
            <p><strong>Description:</strong></p>
            <p>${description}</p>
            ${images && images.length > 0 ? `
                <p><strong>Attached Images:</strong></p>
                <ul>
                    ${images.map(img => `<li><a href="${img}">${img}</a></li>`).join('')}
                </ul>
            ` : ''}
            <p><a href="${process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')}/admin/complaints/${complaint.id}">View in Admin Dashboard</a></p>
        `;

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: adminEmail,
            subject: `New Complaint: ${subject}`,
            html: emailContent,
        });

        return Response.json(
            { success: true, complaint, message: 'Complaint submitted successfully. We will contact you soon.' },
            { status: 201 }
        );
    } catch (error) {
        console.error('Error creating complaint:', error);
        return Response.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
