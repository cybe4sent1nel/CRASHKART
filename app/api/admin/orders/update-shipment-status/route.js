import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { sendOrderStatusEmail } from '@/lib/email';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

/**
 * Admin endpoint to update status for individual shipments/products
 * This allows admin to update each product status independently in a multi-product order
 * 
 * POST /api/admin/orders/update-shipment-status
 */
export async function POST(request) {
    try {
        const {
            orderId,
            shipmentId, // Unique ID for the product shipment
            status,     // New status: ORDER_PLACED, PROCESSING, SHIPPED, DELIVERED
            trackingNumber,
            estimatedDelivery
        } = await request.json();

        // Validation
        if (!orderId || !shipmentId || !status) {
            return NextResponse.json(
                { error: 'Missing required fields: orderId, shipmentId, status' },
                { status: 400 }
            );
        }

        // Find the order item (shipment) by shipmentId
        const orderItem = await prisma.orderItem.findUnique({
            where: { shipmentId }
        });

        if (!orderItem) {
            return NextResponse.json(
                { error: 'Shipment not found' },
                { status: 404 }
            );
        }

        // Verify shipment belongs to the order
        if (orderItem.orderId !== orderId) {
            return NextResponse.json(
                { error: 'Shipment does not belong to this order' },
                { status: 400 }
            );
        }

        // Update the shipment status
        const updatedOrderItem = await prisma.orderItem.update({
            where: { shipmentId },
            data: {
                status,
                trackingNumber: trackingNumber || orderItem.trackingNumber,
                estimatedDelivery: estimatedDelivery ? new Date(estimatedDelivery) : orderItem.estimatedDelivery,
                ...(status === 'DELIVERED' && { deliveredAt: new Date() })
            },
            include: {
                product: true
            }
        });

        // Get order and all items for context
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                user: true,
                orderItems: {
                    include: {
                        product: true
                    }
                },
                address: true
            }
        });

        // Send update email to customer about this shipment
        try {
            const emailData = {
                orderId: order.id,
                status: status,
                shipmentId: shipmentId,
                items: [{
                    name: updatedOrderItem.product?.name || 'Product',
                    quantity: updatedOrderItem.quantity,
                    price: updatedOrderItem.price,
                    status: status,
                    trackingNumber: updatedOrderItem.trackingNumber
                }],
                subtotal: order.total,
                total: order.total,
                address: order.address,
                customerName: order.user?.name || order.user?.email || 'Customer',
                customerEmail: order.user?.email,
                paymentMethod: order.paymentMethod,
                trackingLink: `${process.env.NEXT_PUBLIC_APP_URL}/track/${orderId}`
            };

            await sendOrderStatusEmail(
                order.user.email,
                emailData,
                order.user.name
            );
        } catch (emailError) {
            console.warn('Failed to send status update email:', emailError.message);
        }

        return NextResponse.json({
            success: true,
            message: `Shipment ${shipmentId} status updated to ${status}`,
            shipment: {
                shipmentId: updatedOrderItem.shipmentId,
                status: updatedOrderItem.status,
                trackingNumber: updatedOrderItem.trackingNumber,
                estimatedDelivery: updatedOrderItem.estimatedDelivery,
                deliveredAt: updatedOrderItem.deliveredAt
            }
        });
    } catch (error) {
        console.error('Shipment status update error:', error);
        return NextResponse.json(
            { error: 'Failed to update shipment status' },
            { status: 500 }
        );
    }
}

/**
 * GET /api/admin/orders/update-shipment-status?shipmentId=xyz
 * Get shipment details
 */
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const shipmentId = searchParams.get('shipmentId');

        if (!shipmentId) {
            return NextResponse.json(
                { error: 'Shipment ID is required' },
                { status: 400 }
            );
        }

        const shipment = await prisma.orderItem.findUnique({
            where: { shipmentId },
            include: {
                order: {
                    include: {
                        user: true,
                        address: true
                    }
                },
                product: true
            }
        });

        if (!shipment) {
            return NextResponse.json(
                { error: 'Shipment not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            shipment
        });
    } catch (error) {
        console.error('Get shipment error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch shipment' },
            { status: 500 }
        );
    }
}
