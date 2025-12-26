import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { sendAbandonedCartEmail } from '@/lib/email';

const prisma = new PrismaClient();

/**
 * POST /api/cart/abandoned - Track abandoned cart
 */
export async function POST(request) {
  try {
    const { userId, items, totalValue } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    if (!items || items.length === 0) {
      // If cart is empty, remove abandoned cart record
      await prisma.abandonedCart.deleteMany({
        where: { userId }
      });
      return NextResponse.json({
        success: true,
        message: 'Cart cleared'
      });
    }

    // Upsert abandoned cart
    const abandonedCart = await prisma.abandonedCart.upsert({
      where: { userId },
      update: {
        items,
        totalValue: totalValue || 0,
        updatedAt: new Date()
      },
      create: {
        userId,
        items,
        totalValue: totalValue || 0
      }
    });

    return NextResponse.json({
      success: true,
      abandonedCart
    });

  } catch (error) {
    console.error('Track abandoned cart error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to track cart' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/cart/abandoned - Get abandoned carts for sending reminders (admin)
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const hoursAgo = parseInt(searchParams.get('hoursAgo') || '24');
    const maxReminders = parseInt(searchParams.get('maxReminders') || '3');

    // Find abandoned carts that:
    // 1. Haven't been updated in X hours
    // 2. Haven't reached max reminders
    // 3. Either never sent reminder or last reminder was > 24h ago
    const cutoffTime = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);
    const lastReminderCutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const abandonedCarts = await prisma.abandonedCart.findMany({
      where: {
        updatedAt: {
          lt: cutoffTime
        },
        reminderSent: {
          lt: maxReminders
        },
        OR: [
          { lastReminder: null },
          { lastReminder: { lt: lastReminderCutoff } }
        ]
      }
    });

    // Get user details for each cart
    const userIds = abandonedCarts.map(cart => cart.userId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true }
    });

    const cartsWithUsers = abandonedCarts.map(cart => ({
      ...cart,
      user: users.find(u => u.id === cart.userId)
    }));

    return NextResponse.json({
      success: true,
      abandonedCarts: cartsWithUsers,
      count: cartsWithUsers.length
    });

  } catch (error) {
    console.error('Get abandoned carts error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get abandoned carts' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/cart/abandoned - Send reminder for abandoned cart
 */
export async function PATCH(request) {
  try {
    const { cartId, sendEmail = true } = await request.json();

    if (!cartId) {
      return NextResponse.json(
        { success: false, error: 'Cart ID is required' },
        { status: 400 }
      );
    }

    const cart = await prisma.abandonedCart.findUnique({
      where: { id: cartId }
    });

    if (!cart) {
      return NextResponse.json(
        { success: false, error: 'Cart not found' },
        { status: 404 }
      );
    }

    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: cart.userId },
      select: { id: true, name: true, email: true }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Send reminder email if requested
    if (sendEmail && user.email) {
      const cartItems = cart.items || [];
      await sendAbandonedCartEmail(
        user.email,
        {
          items: cartItems,
          total: cart.totalValue,
          cartUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/cart`
        },
        user.name || 'Shopper'
      );
    }

    // Update reminder count
    const updatedCart = await prisma.abandonedCart.update({
      where: { id: cartId },
      data: {
        reminderSent: { increment: 1 },
        lastReminder: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Reminder sent',
      cart: updatedCart
    });

  } catch (error) {
    console.error('Send cart reminder error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send reminder' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/cart/abandoned - Clear abandoned cart (when order is placed)
 */
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    await prisma.abandonedCart.deleteMany({
      where: { userId }
    });

    return NextResponse.json({
      success: true,
      message: 'Abandoned cart cleared'
    });

  } catch (error) {
    console.error('Clear abandoned cart error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to clear cart' },
      { status: 500 }
    );
  }
}
