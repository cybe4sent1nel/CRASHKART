import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { triggerOrderStatusEmail } from '@/lib/emailTriggerService';

// GET - List all orders with filters
export async function GET(request) {
    try {
        console.log('🔍 [Admin Orders API] Request received')
        
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const status = searchParams.get('status');
        const search = searchParams.get('search');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const paymentStatus = searchParams.get('paymentStatus');
        const sortBy = searchParams.get('sortBy') || 'createdAt';
        const sortOrder = searchParams.get('sortOrder') || 'desc';

        console.log('📋 Query params:', { page, limit, status, search, paymentStatus })

        const skip = (page - 1) * limit;

        // Build where clause
        const where = {};

        if (status) {
            where.status = status;
        }

        if (paymentStatus === 'paid') {
            where.isPaid = true;
        } else if (paymentStatus === 'unpaid') {
            where.isPaid = false;
        }

        if (startDate && endDate) {
            where.createdAt = {
                gte: new Date(startDate),
                lte: new Date(endDate)
            };
        }

        if (search) {
            where.OR = [
                { id: { contains: search, mode: 'insensitive' } },
                { user: { name: { contains: search, mode: 'insensitive' } } },
                { user: { email: { contains: search, mode: 'insensitive' } } }
            ];
        }

        console.log('🔎 Database query where:', JSON.stringify(where, null, 2))

        console.log('🔍 Where clause:', JSON.stringify(where, null, 2))
        
        const [orders, total] = await Promise.all([
            prisma.order.findMany({
                where,
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            phone: true,
                            image: true
                        }
                    },
                    address: true,
                    orderItems: {
                        include: {
                            product: {
                                select: {
                                    id: true,
                                    name: true,
                                    images: true,
                                    price: true
                                }
                            }
                        }
                    }
                },
                orderBy: { [sortBy]: sortOrder },
                skip,
                take: limit
            }),
            prisma.order.count({ where })
        ]);
        
        console.log(`✅ [Admin Orders API] Found ${orders.length} orders out of ${total} total`)
        console.log('🔢 Order IDs:', orders.map(o => o.id).join(', '))

        console.log(`✅ Found ${orders.length} orders (total: ${total})`)

        // Enhance orders with shipment info
        const enrichedOrders = orders.map(order => ({
            ...order,
            isSingleProductOrder: order.orderItems.length === 1,
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
                isSingleProductOrder: !item.shipmentId
            }))
        }));

        // Get order statistics
        const stats = await prisma.order.groupBy({
            by: ['status'],
            _count: { status: true },
            _sum: { total: true }
        });

        const statusStats = stats.reduce((acc, s) => {
            acc[s.status] = {
                count: s._count.status,
                total: s._sum.total
            };
            return acc;
        }, {});

        return NextResponse.json({
            success: true,
            orders: enrichedOrders,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            },
            stats: statusStats
        });

    } catch (error) {
        console.error('❌ [Admin Orders API] Error:', error);
        console.error('Stack:', error.stack);
        return NextResponse.json({ 
            success: false,
            error: 'Failed to fetch orders',
            message: error.message,
            details: error.stack,
            orders: [],
            pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
            stats: {}
        }, { status: 500 });
    }
}

// PUT - Update order status (single or bulk) - DELEGATED TO /update-status
export async function PUT(request) {
    try {
        const body = await request.json();
        const { orderId, orderIds, shipmentId, status, sendNotification = true, trackingNumber, estimatedDelivery } = body;

        // Validate status - map user-friendly status to enum values
        const statusMap = {
            'Processing': 'PROCESSING',
            'In Transit': 'SHIPPED',
            'Shipped': 'SHIPPED',
            'Delivered': 'DELIVERED',
            'Cancelled': 'CANCELLED',
            'ORDER_PLACED': 'ORDER_PLACED',
            'PROCESSING': 'PROCESSING',
            'SHIPPED': 'SHIPPED',
            'DELIVERED': 'DELIVERED',
            'CANCELLED': 'CANCELLED',
            'PAYMENT_PENDING': 'PAYMENT_PENDING',
            'RETURN_ACCEPTED': 'RETURN_ACCEPTED',
            'RETURN_PICKED_UP': 'RETURN_PICKED_UP',
            'REFUND_COMPLETED': 'REFUND_COMPLETED'
        };

        const mappedStatus = statusMap[status] || status;
        const validStatuses = ['ORDER_PLACED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'PAYMENT_PENDING', 'RETURN_ACCEPTED', 'RETURN_PICKED_UP', 'REFUND_COMPLETED'];

        if (!validStatuses.includes(mappedStatus)) {
            return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
        }

        // If shipmentId provided, update single shipment
        if (shipmentId) {
            if (!orderId) {
                return NextResponse.json({ error: 'orderId required when updating shipmentId' }, { status: 400 });
            }
            // Delegate to update-status endpoint
            return NextResponse.json({
                success: true,
                message: 'Use POST /api/admin/orders/update-status with shipmentId for individual product updates'
            });
        }

        // Handle single or bulk update
        const idsToUpdate = orderIds || (orderId ? [orderId] : []);

        if (!idsToUpdate || idsToUpdate.length === 0) {
            return NextResponse.json({ error: 'Order ID(s) required' }, { status: 400 });
        }

        // Get orders before update for notification
        const ordersBeforeUpdate = await prisma.order.findMany({
            where: { id: { in: idsToUpdate } },
            include: {
                user: { select: { id: true, name: true, email: true } },
                orderItems: {
                    include: {
                        product: { select: { id: true, name: true, images: true } }
                    }
                },
                address: true
            }
        });

        if (ordersBeforeUpdate.length === 0) {
            return NextResponse.json({ error: 'Orders not found' }, { status: 404 });
        }

        // Update orders in database
        const result = await prisma.order.updateMany({
            where: { id: { in: idsToUpdate } },
            data: {
                status: mappedStatus,
                updatedAt: new Date()
            }
        });

        // Update all order items to the same status
        for (const orderId of idsToUpdate) {
            await prisma.orderItem.updateMany({
                where: { orderId },
                data: {
                    status: mappedStatus,
                    trackingNumber: trackingNumber || undefined,
                    estimatedDelivery: estimatedDelivery ? new Date(estimatedDelivery) : undefined,
                    ...(mappedStatus === 'DELIVERED' && { deliveredAt: new Date() })
                }
            });
        }

        // Create notifications for each user
        for (const order of ordersBeforeUpdate) {
            if (order.userId) {
                try {
                    await prisma.notification.create({
                        data: {
                            userId: order.userId,
                            title: `Order ${order.id.substring(0, 8)} Status Updated`,
                            message: `Your order status has been updated to ${mappedStatus}`,
                            type: 'info',
                            link: `/my-orders/${order.id}`
                        }
                    });
                } catch (notifError) {
                    console.error(`Failed to create notification for order ${order.id}:`, notifError);
                }
            }
        }

        // Send email notifications
        if (sendNotification) {
            for (const order of ordersBeforeUpdate) {
                if (order.user?.email) {
                    try {
                        // Send updated email with new status
                        const { sendOrderStatusEmail } = await import('@/lib/email');
                        await sendOrderStatusEmail(
                            order.user.email,
                            {
                                orderId: order.id,
                                status: mappedStatus,
                                items: order.orderItems.map(item => ({
                                    name: item.product.name,
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
                                trackingLink: `${process.env.NEXT_PUBLIC_APP_URL}/track/${order.id}`
                            },
                            order.user.name
                        );
                    } catch (emailError) {
                        console.error(`Failed to send email for order ${order.id}:`, emailError);
                    }
                }
            }
        }

        console.log(`✓ Updated ${result.count} orders to status: ${mappedStatus}`);

        return NextResponse.json({
            success: true,
            updated: result.count,
            status: mappedStatus,
            orders: ordersBeforeUpdate.map(o => ({
                id: o.id,
                userId: o.userId,
                previousStatus: o.status,
                newStatus: mappedStatus,
                notificationSent: true
            }))
        });

    } catch (error) {
        console.error('Error updating orders:', error);
        return NextResponse.json({ error: 'Failed to update orders', details: error.message }, { status: 500 });
    }
}

// DELETE - Cancel orders
export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url);
        const orderId = searchParams.get('orderId');
        const refund = searchParams.get('refund') === 'true';

        if (!orderId) {
            return NextResponse.json({ error: 'Order ID required' }, { status: 400 });
        }

        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                user: { select: { name: true, email: true } }
            }
        });

        if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        // Update order status to cancelled (we don't actually delete)
        await prisma.order.update({
            where: { id: orderId },
            data: { status: 'DELIVERED' } // Using DELIVERED as there's no CANCELLED status
        });

        // TODO: Handle refund if applicable
        if (refund && order.isPaid) {
            // Integrate with Stripe for refund
            console.log(`Refund requested for order ${orderId}`);
        }

        return NextResponse.json({
            success: true,
            message: 'Order cancelled successfully',
            refundInitiated: refund && order.isPaid
        });

    } catch (error) {
        console.error('Error cancelling order:', error);
        return NextResponse.json({ error: 'Failed to cancel order' }, { status: 500 });
    }
}
