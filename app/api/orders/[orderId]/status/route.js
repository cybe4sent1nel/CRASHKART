/**
 * Order Status Update with Automatic Email Triggers
 */

import { PrismaClient } from '@prisma/client';
import { getCurrentSession } from '@/lib/session';
import { triggerOrderStatusEmail } from '@/lib/emailTriggerService';

// Prevent Next.js from attempting to pre-render this route
export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

export async function PATCH(req, { params }) {
    try {
        const session = await getCurrentSession();
        
        // Check admin authorization
        if (!session || !session.user?.email?.includes('@gmail.com')) {
            return Response.json(
                { message: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { orderId } = await params;
        const { status } = await req.json();

        if (!status) {
            return Response.json(
                { message: 'Status is required' },
                { status: 400 }
            );
        }

        // Fetch current order
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                user: {
                    select: { id: true, email: true, name: true }
                },
                address: true
            }
        });

        if (!order) {
            return Response.json(
                { message: 'Order not found' },
                { status: 404 }
            );
        }

        const previousStatus = order.status;

        // Update order status
        const updatedOrder = await prisma.order.update({
            where: { id: orderId },
            data: {
                status: status,
                updatedAt: new Date()
            },
            include: {
                orderItems: true,
                user: true,
                address: true
            }
        });

        // Trigger automatic status email
        try {
            const emailSent = await triggerOrderStatusEmail(
                updatedOrder,
                previousStatus,
                status,
                updatedOrder.user
            );

            console.log(`Order ${orderId} status updated: ${previousStatus} → ${status}, Email sent: ${emailSent}`);
        } catch (emailError) {
            console.error('Error triggering status email:', emailError.message);
            // Don't fail the status update if email fails
        }

        return Response.json(
            {
                success: true,
                message: `Order status updated to ${status}`,
                order: {
                    id: updatedOrder.id,
                    status: updatedOrder.status,
                    updatedAt: updatedOrder.updatedAt
                }
            },
            { status: 200 }
        );

    } catch (error) {
        console.error('Status update error:', error);
        return Response.json(
            { message: error.message || 'Failed to update order status' },
            { status: 500 }
        );
    }
}

export async function GET(req, { params }) {
    try {
        const { orderId } = await params;

        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                orderItems: {
                    include: { product: true }
                },
                user: true,
                address: true
            }
        });

        if (!order) {
            return Response.json(
                { message: 'Order not found' },
                { status: 404 }
            );
        }

        return Response.json(
            { success: true, order },
            { status: 200 }
        );

    } catch (error) {
        console.error('Fetch order error:', error);
        return Response.json(
            { message: error.message || 'Failed to fetch order' },
            { status: 500 }
        );
    }
}
