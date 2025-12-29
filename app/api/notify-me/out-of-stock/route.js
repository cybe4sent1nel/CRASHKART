import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * Notify Me - Out of Stock API
 * Users can register to be notified when a product is back in stock
 */

// POST - Register for out-of-stock notification
export async function POST(request) {
  try {
    const body = await request.json();
    const { productId, productName, userEmail } = body;

    if (!productId || !userEmail) {
      return NextResponse.json(
        { error: 'Product ID and email are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userEmail)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, name: true, quantity: true }
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // If product is already in stock, return error
    if (product.quantity > 0) {
      return NextResponse.json(
        { error: 'Product is already in stock' },
        { status: 400 }
      );
    }

    // Check if user already has a notification for this product
    const existingNotification = await prisma.outOfStockNotification.findUnique({
      where: {
        productId_userEmail: {
          productId,
          userEmail
        }
      }
    });

    if (existingNotification) {
      if (existingNotification.status === 'pending') {
        return NextResponse.json(
          { error: 'You are already registered for notifications for this product' },
          { status: 400 }
        );
      } else if (existingNotification.status === 'notified') {
        // Allow re-registration if already notified
        await prisma.outOfStockNotification.update({
          where: { id: existingNotification.id },
          data: { status: 'pending', notifiedAt: null }
        });
      }
    } else {
      // Create new notification
      await prisma.outOfStockNotification.create({
        data: {
          productId,
          userEmail,
          status: 'pending',
          notificationType: 'email'
        }
      });
    }

    console.log(`✓ Registered ${userEmail} for out-of-stock notification: ${product.name}`);

    return NextResponse.json({
      success: true,
      message: `You'll be notified when ${product.name} is back in stock`,
      product: {
        id: product.id,
        name: product.name
      }
    });
  } catch (error) {
    console.error('Error registering out-of-stock notification:', error);
    return NextResponse.json(
      { error: 'Failed to register notification', details: error.message },
      { status: 500 }
    );
  }
}

// GET - Get notification status for a user
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get('email');
    const productId = searchParams.get('productId');

    if (!userEmail) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    let where = { userEmail };
    if (productId) {
      where.productId = productId;
    }

    const notifications = await prisma.outOfStockNotification.findMany({
      where,
      select: {
        id: true,
        productId: true,
        status: true,
        createdAt: true,
        product: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      success: true,
      notifications
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Cancel notification
export async function DELETE(request) {
  try {
    const body = await request.json();
    const { notificationId, productId, userEmail } = body;

    if (!notificationId && !(productId && userEmail)) {
      return NextResponse.json(
        { error: 'Notification ID or (Product ID + Email) required' },
        { status: 400 }
      );
    }

    let where = {};
    if (notificationId) {
      where.id = notificationId;
    } else {
      where = {
        productId,
        userEmail
      };
    }

    const notification = await prisma.outOfStockNotification.delete({
      where: notificationId ? { id: notificationId } : undefined,
      ...(notificationId ? {} : { where })
    });

    console.log(`✓ Cancelled notification for ${notification.userEmail}`);

    return NextResponse.json({
      success: true,
      message: 'Notification cancelled'
    });
  } catch (error) {
    console.error('Error cancelling notification:', error);
    return NextResponse.json(
      { error: 'Failed to cancel notification', details: error.message },
      { status: 500 }
    );
  }
}
