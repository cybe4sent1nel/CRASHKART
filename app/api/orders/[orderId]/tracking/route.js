import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { 
  sendOrderShippedEmail, 
  sendOrderDeliveredEmail,
  sendOrderCancelledEmail,
  sendRefundProcessedEmail,
  sendReturnApprovedEmail,
  sendReviewRequestEmail 
} from '@/lib/email';

const prisma = new PrismaClient();

/**
 * GET /api/orders/[orderId]/tracking - Get order tracking details
 */
export async function GET(request, { params }) {
  try {
    const { orderId } = params;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
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
        },
        address: true,
        store: {
          select: {
            name: true,
            email: true,
            contact: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    // Generate tracking timeline based on order status
    const trackingTimeline = generateTrackingTimeline(order);

    // Calculate estimated delivery
    const estimatedDelivery = calculateEstimatedDelivery(order);

    return NextResponse.json({
      success: true,
      order: {
        ...order,
        trackingTimeline,
        estimatedDelivery
      },
      timestamp: new Date().toISOString()
    }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error) {
    console.error('Get order tracking error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get tracking info' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/orders/[orderId]/tracking - Update order status
 */
export async function PATCH(request, { params }) {
  try {
    const { orderId } = params;
    const { status, trackingNumber, carrier, notes, sendNotification = true } = await request.json();

    if (!status) {
      return NextResponse.json(
        { success: false, error: 'Status is required' },
        { status: 400 }
      );
    }

    // Validate status
    const validStatuses = ['ORDER_PLACED', 'PROCESSING', 'SHIPPED', 'DELIVERED'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status' },
        { status: 400 }
      );
    }

    // Get current order
    const currentOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: {
          select: { name: true, email: true }
        },
        orderItems: {
          include: {
            product: {
              select: { name: true, images: true }
            }
          }
        },
        address: true
      }
    });

    if (!currentOrder) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    // Update order status
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status }
    });

    // Send email notifications based on status change
    if (sendNotification && currentOrder.user.email) {
      const orderData = {
        orderId,
        trackingNumber,
        carrier,
        items: currentOrder.orderItems.map(item => ({
          name: item.product.name,
          quantity: item.quantity,
          price: item.price,
          image: item.product.images?.[0]
        })),
        estimatedDelivery: calculateEstimatedDelivery(updatedOrder)
      };

      switch (status) {
        case 'SHIPPED':
          await sendOrderShippedEmail(
            currentOrder.user.email,
            orderData,
            currentOrder.user.name || 'Customer'
          );
          break;
        case 'DELIVERED':
          await sendOrderDeliveredEmail(
            currentOrder.user.email,
            orderData,
            currentOrder.user.name || 'Customer'
          );
          // Send review request after a delay (in production, use a job queue)
          setTimeout(async () => {
            await sendReviewRequestEmail(
              currentOrder.user.email,
              orderData,
              currentOrder.user.name || 'Customer'
            );
          }, 2 * 24 * 60 * 60 * 1000); // 2 days
          break;
        case 'CANCELLED':
          await sendOrderCancelledEmail(
            currentOrder.user.email,
            {
              orderId,
              reason: updatedOrder.cancellationReason || 'Not specified',
              refundMethod: updatedOrder.paymentMethod === 'COD' ? 'N/A (No payment was made)' : 'Original payment method',
              refundTimeline: updatedOrder.paymentMethod === 'COD' ? 'N/A' : '5-7 business days'
            },
            currentOrder.user.name || 'Customer'
          );
          break;
        case 'REFUND_PROCESSED':
          await sendRefundProcessedEmail(
            currentOrder.user.email,
            {
              orderId,
              refundAmount: updatedOrder.total,
              refundMethod: updatedOrder.paymentMethod,
              processingDate: new Date().toLocaleDateString(),
              items: orderData.items
            },
            currentOrder.user.name || 'Customer'
          );
          break;
        case 'RETURN_APPROVED':
          await sendReturnApprovedEmail(
            currentOrder.user.email,
            {
              orderId,
              pickupDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString(),
              pickupAddress: currentOrder.address ? 
                `${currentOrder.address.street}, ${currentOrder.address.city}, ${currentOrder.address.state} ${currentOrder.address.zip}` : 
                'Original delivery address',
              refundTimeline: '7-10 business days after pickup',
              items: orderData.items
            },
            currentOrder.user.name || 'Customer'
          );
          break;
      }
    }

    // Create notification for user
    await prisma.notification.create({
      data: {
        userId: currentOrder.userId,
        title: getStatusTitle(status),
        message: getStatusMessage(status, orderId),
        type: status === 'DELIVERED' ? 'success' : 'info',
        link: `/my-orders/${orderId}`
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Order status updated',
      order: updatedOrder
    });

  } catch (error) {
    console.error('Update order status error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update order' },
      { status: 500 }
    );
  }
}

// Helper functions
function generateTrackingTimeline(order) {
  const timeline = [];
  const statuses = ['ORDER_PLACED', 'PROCESSING', 'SHIPPED', 'DELIVERED'];
  const currentStatusIndex = statuses.indexOf(order.status);

  const statusInfo = {
    ORDER_PLACED: {
      title: 'Order Placed',
      description: 'Your order has been received and confirmed',
      icon: '📦'
    },
    PROCESSING: {
      title: 'Processing',
      description: 'Your order is being prepared',
      icon: '⚙️'
    },
    SHIPPED: {
      title: 'Shipped',
      description: 'Your order is on the way',
      icon: '🚚'
    },
    DELIVERED: {
      title: 'Delivered',
      description: 'Your order has been delivered',
      icon: '✅'
    }
  };

  statuses.forEach((status, index) => {
    const info = statusInfo[status];
    timeline.push({
      status,
      ...info,
      completed: index <= currentStatusIndex,
      current: index === currentStatusIndex,
      timestamp: index === 0 ? order.createdAt : 
                 index <= currentStatusIndex ? order.updatedAt : null
    });
  });

  return timeline;
}

function calculateEstimatedDelivery(order) {
  const orderDate = new Date(order.createdAt);
  
  switch (order.status) {
    case 'ORDER_PLACED':
      // 5-7 days from order
      const est1 = new Date(orderDate);
      est1.setDate(est1.getDate() + 5);
      const est2 = new Date(orderDate);
      est2.setDate(est2.getDate() + 7);
      return {
        from: est1.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' }),
        to: est2.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })
      };
    case 'PROCESSING':
      // 3-5 days from now
      const est3 = new Date();
      est3.setDate(est3.getDate() + 3);
      const est4 = new Date();
      est4.setDate(est4.getDate() + 5);
      return {
        from: est3.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' }),
        to: est4.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })
      };
    case 'SHIPPED':
      // 1-2 days from now
      const est5 = new Date();
      est5.setDate(est5.getDate() + 1);
      const est6 = new Date();
      est6.setDate(est6.getDate() + 2);
      return {
        from: est5.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' }),
        to: est6.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })
      };
    case 'DELIVERED':
      return {
        delivered: true,
        date: new Date(order.updatedAt).toLocaleDateString('en-IN', { 
          weekday: 'long', 
          month: 'long', 
          day: 'numeric',
          year: 'numeric'
        })
      };
    default:
      return null;
  }
}

function getStatusTitle(status) {
  const titles = {
    ORDER_PLACED: '📦 Order Confirmed',
    PROCESSING: '⚙️ Order Processing',
    SHIPPED: '🚚 Order Shipped',
    DELIVERED: '✅ Order Delivered'
  };
  return titles[status] || 'Order Update';
}

function getStatusMessage(status, orderId) {
  const messages = {
    ORDER_PLACED: `Your order #${orderId.slice(-8)} has been confirmed and is being prepared.`,
    PROCESSING: `Your order #${orderId.slice(-8)} is now being processed.`,
    SHIPPED: `Great news! Your order #${orderId.slice(-8)} has been shipped and is on its way.`,
    DELIVERED: `Your order #${orderId.slice(-8)} has been delivered. Enjoy your purchase!`
  };
  return messages[status] || `Your order #${orderId.slice(-8)} has been updated.`;
}
