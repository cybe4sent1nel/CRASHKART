import { prisma } from '@/lib/prisma';
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
    },
});

export async function PATCH(request) {
    try {
        const { complaintId, status, priority, resolution, assignedTo } = await request.json();

        const complaint = await prisma.complaint.update({
            where: { id: complaintId },
            data: {
                status: status || undefined,
                priority: priority || undefined,
                resolution: resolution || undefined,
                assignedTo: assignedTo || undefined,
                resolvedAt: status === 'resolved' ? new Date() : undefined,
            },
            include: {
                order: true,
            },
        });

        // Send update email to customer
        const user = await prisma.user.findUnique({
            where: { id: complaint.userId },
            select: { email: true, name: true }
        });

        if (user?.email) {
            const emailContent = `
                <h2>Complaint Status Update</h2>
                <p>Hi ${user.name},</p>
                <p>Your complaint has been updated.</p>
                <p><strong>Subject:</strong> ${complaint.subject}</p>
                <p><strong>Status:</strong> ${status || complaint.status}</p>
                <p><strong>Priority:</strong> ${priority || complaint.priority}</p>
                ${resolution ? `<p><strong>Resolution:</strong> ${resolution}</p>` : ''}
                <p>Thank you for your patience. If you have any questions, please reply to this email.</p>
            `;

            await transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: user.email,
                subject: `Complaint Status Update: ${complaint.subject}`,
                html: emailContent,
            });
        }

        return Response.json(
            { success: true, complaint },
            { status: 200 }
        );
    } catch (error) {
        console.error('Error updating complaint:', error);
        return Response.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
