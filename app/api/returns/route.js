import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendEmail } from '@/lib/email';
import { nanoid } from 'nanoid';

// POST - Create return request
export async function POST(request) {
  try {
    const body = await request.json();
    const { orderId, userId, productId, quantity, reason, comments } = body;

    if (!orderId || !userId || !productId || !quantity || !reason) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify order exists and belongs to user
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        orderItems: {
          where: { productId }
        },
        user: { select: { email: true, name: true } }
      }
    });

    if (!order || order.userId !== userId) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const orderItem = order.orderItems[0];
    if (!orderItem || orderItem.quantity < quantity) {
      return NextResponse.json(
        { error: 'Invalid quantity for return' },
        { status: 400 }
      );
    }

    // Generate RMA number
    const rmaNumber = `RMA${Date.now()}${nanoid(5).toUpperCase()}`;
    
    // Calculate refund amount
    const refundAmount = (orderItem.price / orderItem.quantity) * quantity;

    // Create return request
    const returnRequest = await prisma.returnRequest.create({
      data: {
        rmaNumber,
        orderId,
        userId,
        productId,
        quantity,
        reason,
        comments,
        refundAmount,
        status: 'requested'
      }
    });

    // Send confirmation email
    try {
      await sendEmail(order.user.email, {
        template: 'return-request',
        name: order.user.name,
        rmaNumber,
        reason,
        refundAmount,
        productId,
        quantity
      });
    } catch (emailError) {
      console.error('Failed to send return email:', emailError);
    }

    return NextResponse.json({
      success: true,
      returnRequest: {
        rmaNumber,
        status: 'requested',
        refundAmount,
        message: 'Return request created. You can track it using RMA number.'
      }
    });

  } catch (error) {
    console.error('Create return error:', error);
    return NextResponse.json({ error: 'Failed to create return request' }, { status: 500 });
  }
}

// GET - Get return requests
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const rmaNumber = searchParams.get('rmaNumber');

    if (rmaNumber) {
      // Get specific return by RMA number
      const returnRequest = await prisma.returnRequest.findUnique({
        where: { rmaNumber }
      });

      if (!returnRequest) {
        return NextResponse.json({ error: 'Return not found' }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        returnRequest
      });
    }

    if (userId) {
      // Get all returns for user
      const returns = await prisma.returnRequest.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' }
      });

      const stats = {
        total: returns.length,
        pending: returns.filter(r => r.status === 'requested').length,
        approved: returns.filter(r => r.status === 'approved').length,
        returned: returns.filter(r => r.status === 'returned').length,
        refunded: returns.filter(r => r.status === 'refunded').length,
        rejected: returns.filter(r => r.status === 'rejected').length,
        totalRefundAmount: returns
          .filter(r => r.status === 'refunded')
          .reduce((sum, r) => sum + r.refundAmount, 0)
      };

      return NextResponse.json({
        success: true,
        stats,
        returns
      });
    }

    return NextResponse.json({ error: 'userId or rmaNumber required' }, { status: 400 });

  } catch (error) {
    console.error('Get returns error:', error);
    return NextResponse.json({ error: 'Failed to fetch returns' }, { status: 500 });
  }
}

// PATCH - Update return status (admin only)
export async function PATCH(request) {
  try {
    const body = await request.json();
    const { rmaNumber, status, comments } = body;

    if (!rmaNumber || !status) {
      return NextResponse.json({ error: 'RMA number and status required' }, { status: 400 });
    }

    const validStatuses = ['requested', 'approved', 'rejected', 'returned', 'refunded'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // Get return request
    const returnRequest = await prisma.returnRequest.findUnique({
      where: { rmaNumber },
      include: {
        user: { select: { email: true, name: true } }
      }
    });

    if (!returnRequest) {
      return NextResponse.json({ error: 'Return not found' }, { status: 404 });
    }

    // Update status
    const updated = await prisma.returnRequest.update({
      where: { rmaNumber },
      data: {
        status,
        comments: comments || returnRequest.comments,
        updatedAt: new Date()
      }
    });

    // Send email notification
    try {
      await sendEmail(returnRequest.user.email, {
        template: 'return-status-update',
        name: returnRequest.user.name,
        rmaNumber,
        status,
        refundAmount: returnRequest.refundAmount
      });
    } catch (emailError) {
      console.error('Failed to send status email:', emailError);
    }

    return NextResponse.json({
      success: true,
      message: `Return status updated to ${status}`,
      returnRequest: updated
    });

  } catch (error) {
    console.error('Update return error:', error);
    return NextResponse.json({ error: 'Failed to update return' }, { status: 500 });
  }
}
