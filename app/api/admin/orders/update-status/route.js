import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { sendOrderStatusEmail } from '@/lib/email';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

/**
 * Update order or shipment status
 * 
 * Request body:
 * {
 *   orderId: string (required)
 *   shipmentId?: string (optional - if provided, update only that shipment/product)
 *   status: string (required) - ORDER_PLACED, PROCESSING, SHIPPED, DELIVERED, CANCELLED, PAYMENT_PENDING
 *   trackingNumber?: string
 *   estimatedDelivery?: string (ISO date)
 * }
 * 
 * Behavior:
 * - If shipmentId is provided: Update only that product's status (multi-product order)
 * - If shipmentId is NOT provided: Update entire order and all products
 */
export async function POST(request) {
    try {
        const {
            orderId,
            shipmentId,
            status,
            trackingNumber,
            estimatedDelivery
        } = await request.json();

        // Validation
        if (!orderId || !status) {
            return NextResponse.json(
                { error: 'Missing required fields: orderId, status' },
                { status: 400 }
            );
        }

        const validStatuses = ['ORDER_PLACED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'PAYMENT_PENDING'];
        if (!validStatuses.includes(status)) {
            return NextResponse.json(
                { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
                { status: 400 }
            );
        }

        // Fetch the order with all items
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

        if (!order) {
            return NextResponse.json(
                { error: 'Order not found' },
                { status: 404 }
            );
        }

        let updatedItems = [];

        if (shipmentId) {
            // UPDATE SINGLE SHIPMENT/PRODUCT (multi-product order scenario)
            const orderItem = order.orderItems.find(item => item.shipmentId === shipmentId);
            
            if (!orderItem) {
                return NextResponse.json(
                    { error: 'Shipment not found in this order' },
                    { status: 404 }
                );
            }

            const updatedItem = await prisma.orderItem.update({
                where: { id: orderItem.id },
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

            updatedItems = [updatedItem];

            // Send email notification for this shipment update
            try {
                const emailData = {
                    orderId: order.id,
                    shipmentId: shipmentId,
                    status: status,
                    items: [{
                        name: updatedItem.product?.name || 'Product',
                        quantity: updatedItem.quantity,
                        price: updatedItem.price,
                        shipmentId: shipmentId
                    }],
                    subtotal: order.total,
                    total: order.total,
                    address: order.address,
                    customerName: order.user?.name || 'Customer',
                    customerEmail: order.user?.email,
                    paymentMethod: order.paymentMethod,
                    trackingNumber: updatedItem.trackingNumber,
                    trackingLink: `${process.env.NEXT_PUBLIC_APP_URL}/track/${orderId}`
                };

                await sendOrderStatusEmail(order.user.email, emailData, order.user.name);
            } catch (emailError) {
                console.warn('Failed to send shipment status email:', emailError.message);
            }

        } else {
            // UPDATE ENTIRE ORDER - all products/shipments get the same status
            await prisma.order.update({
                where: { id: orderId },
                data: {
                    status: status,
                    updatedAt: new Date()
                }
            });

            // Update all OrderItems to the same status
            const updatedOrderItems = await prisma.orderItem.updateMany({
                where: { orderId: orderId },
                data: {
                    status: status,
                    trackingNumber: trackingNumber || undefined,
                    estimatedDelivery: estimatedDelivery ? new Date(estimatedDelivery) : undefined,
                    ...(status === 'DELIVERED' && { deliveredAt: new Date() })
                }
            });

            // Fetch updated items to return
            updatedItems = await prisma.orderItem.findMany({
                where: { orderId: orderId },
                include: { product: true }
            });

            // Send email notification for entire order
            try {
                const emailData = {
                    orderId: order.id,
                    status: status,
                    items: updatedItems.map(item => ({
                        name: item.product?.name || 'Product',
                        quantity: item.quantity,
                        price: item.price,
                        shipmentId: item.shipmentId
                    })),
                    subtotal: order.total,
                    total: order.total,
                    address: order.address,
                    customerName: order.user?.name || 'Customer',
                    customerEmail: order.user?.email,
                    paymentMethod: order.paymentMethod,
                    trackingNumber: trackingNumber,
                    trackingLink: `${process.env.NEXT_PUBLIC_APP_URL}/track/${orderId}`
                };

                await sendOrderStatusEmail(order.user.email, emailData, order.user.name);
            } catch (emailError) {
                console.warn('Failed to send order status email:', emailError.message);
            }
        }

        return NextResponse.json({
            success: true,
            message: shipmentId 
                ? `Shipment ${shipmentId} status updated to ${status}`
                : `Order ${orderId} status updated to ${status}`,
            orderId: orderId,
            shipmentId: shipmentId || null,
            status: status,
            updatedItems: updatedItems.map(item => ({
                itemId: item.id,
                shipmentId: item.shipmentId,
                productId: item.productId,
                productName: item.product?.name,
                status: item.status,
                trackingNumber: item.trackingNumber,
                deliveredAt: item.deliveredAt
            }))
        });

    } catch (error) {
        console.error('Status update error:', error);
        return NextResponse.json(
            { error: 'Failed to update status', details: error.message },
            { status: 500 }
        );
    }
}

/**
 * GET status details for order or shipment
 * Query params:
 * - orderId (required)
 * - shipmentId (optional)
 */
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const orderId = searchParams.get('orderId');
        const shipmentId = searchParams.get('shipmentId');

        if (!orderId) {
            return NextResponse.json(
                { error: 'orderId is required' },
                { status: 400 }
            );
        }

        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                user: {
                    select: { id: true, name: true, email: true, phone: true }
                },
                orderItems: {
                    include: { product: true }
                },
                address: true
            }
        });

        if (!order) {
            return NextResponse.json(
                { error: 'Order not found' },
                { status: 404 }
            );
        }

        if (shipmentId) {
            // Return specific shipment details
            const shipment = order.orderItems.find(item => item.shipmentId === shipmentId);
            
            if (!shipment) {
                return NextResponse.json(
                    { error: 'Shipment not found' },
                    { status: 404 }
                );
            }

            return NextResponse.json({
                success: true,
                orderId: orderId,
                shipmentId: shipmentId,
                shipment: {
                    id: shipment.id,
                    shipmentId: shipment.shipmentId,
                    productId: shipment.productId,
                    productName: shipment.product?.name,
                    quantity: shipment.quantity,
                    price: shipment.price,
                    status: shipment.status,
                    trackingNumber: shipment.trackingNumber,
                    estimatedDelivery: shipment.estimatedDelivery,
                    deliveredAt: shipment.deliveredAt,
                    createdAt: shipment.createdAt,
                    updatedAt: shipment.updatedAt
                },
                order: {
                    id: order.id,
                    status: order.status,
                    total: order.total,
                    createdAt: order.createdAt
                }
            });
        }

        // Return entire order details
        return NextResponse.json({
            success: true,
            orderId: orderId,
            order: {
                id: order.id,
                total: order.total,
                status: order.status,
                isPaid: order.isPaid,
                paymentMethod: order.paymentMethod,
                createdAt: order.createdAt,
                updatedAt: order.updatedAt,
                user: order.user,
                address: {
                    name: order.address?.name,
                    street: order.address?.street,
                    city: order.address?.city,
                    state: order.address?.state,
                    zip: order.address?.zip,
                    country: order.address?.country
                }
            },
            shipments: order.orderItems.map(item => ({
                id: item.id,
                shipmentId: item.shipmentId,
                productId: item.productId,
                productName: item.product?.name,
                quantity: item.quantity,
                price: item.price,
                status: item.status,
                trackingNumber: item.trackingNumber,
                estimatedDelivery: item.estimatedDelivery,
                deliveredAt: item.deliveredAt,
                isSingleProductOrder: !item.shipmentId,
                createdAt: item.createdAt
            }))
        });

    } catch (error) {
        console.error('Get status error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch status' },
            { status: 500 }
        );
    }
}
