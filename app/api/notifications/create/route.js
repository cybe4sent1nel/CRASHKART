import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

/**
 * Create a new notification
 */
export async function POST(request) {
  try {
    const { userId, type, title, message, link } = await request.json();

    if (!userId || !title || !message) {
      return NextResponse.json(
        { error: 'User ID, title, and message are required' },
        { status: 400 }
      );
    }

    const notification = await prisma.notification.create({
      data: {
        userId,
        type: type || 'info',
        title,
        message,
        link,
        isRead: false,
      },
    });

    return NextResponse.json({
      success: true,
      notification,
    });
  } catch (error) {
    console.error('Create notification error:', error);
    return NextResponse.json(
      { error: 'Failed to create notification' },
      { status: 500 }
    );
  }
}

/**
 * Create multiple notifications (batch)
 */
export async function PUT(request) {
  try {
    const { notifications } = await request.json();

    if (!notifications || !Array.isArray(notifications)) {
      return NextResponse.json(
        { error: 'Notifications array is required' },
        { status: 400 }
      );
    }

    const createdNotifications = await prisma.notification.createMany({
      data: notifications.map(n => ({
        userId: n.userId,
        type: n.type || 'info',
        title: n.title,
        message: n.message,
        link: n.link,
        isRead: false,
      })),
    });

    return NextResponse.json({
      success: true,
      count: createdNotifications.count,
    });
  } catch (error) {
    console.error('Batch create notifications error:', error);
    return NextResponse.json(
      { error: 'Failed to create notifications' },
      { status: 500 }
    );
  }
}
