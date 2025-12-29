import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

/**
 * Get notifications for a user
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const unreadOnly = searchParams.get('unreadOnly') === 'true';

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Try to find user by ID first (if it's a valid ObjectId), otherwise by email
    let user;
    try {
      // Try as MongoDB ObjectId first
      user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true }
      });
    } catch (e) {
      // If not valid ObjectId, might be Google ID - try finding by Google ID or email
      user = await prisma.user.findFirst({
        where: {
          OR: [
            { googleId: userId },
            { email: userId }
          ]
        },
        select: { id: true }
      });
    }

    if (!user) {
      return NextResponse.json({
        success: true,
        notifications: [],
        unreadCount: 0,
      });
    }

    const whereClause = {
      userId: user.id,
      ...(unreadOnly && { isRead: false }),
    };

    const notifications = await prisma.notification.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: 50, // Limit to last 50 notifications
    });

    const unreadCount = await prisma.notification.count({
      where: { userId: user.id, isRead: false },
    });

    return NextResponse.json({
      success: true,
      notifications,
      unreadCount,
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

/**
 * Mark notification(s) as read
 */
export async function PATCH(request) {
  try {
    const { notificationId, userId, markAllAsRead } = await request.json();

    if (markAllAsRead) {
      // Convert userId to actual MongoDB ID if needed
      let actualUserId = userId;
      
      try {
        // Try to find user by ID first
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { id: true }
        });
        if (user) {
          actualUserId = user.id;
        }
      } catch (e) {
        // If not valid ObjectId, might be Google ID - find by Google ID
        const user = await prisma.user.findFirst({
          where: {
            OR: [
              { googleId: userId },
              { email: userId }
            ]
          },
          select: { id: true }
        });
        if (user) {
          actualUserId = user.id;
        }
      }
      
      // Mark all notifications as read for user
      await prisma.notification.updateMany({
        where: { userId: actualUserId, isRead: false },
        data: { isRead: true },
      });

      return NextResponse.json({
        success: true,
        message: 'All notifications marked as read',
      });
    }

    if (!notificationId) {
      return NextResponse.json(
        { error: 'Notification ID is required' },
        { status: 400 }
      );
    }

    // Mark single notification as read
    await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });

    return NextResponse.json({
      success: true,
      message: 'Notification marked as read',
    });
  } catch (error) {
    console.error('Update notification error:', error);
    return NextResponse.json(
      { error: 'Failed to update notification' },
      { status: 500 }
    );
  }
}

/**
 * Delete notification
 */
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const notificationId = searchParams.get('id');
    const userId = searchParams.get('userId');
    const deleteAll = searchParams.get('deleteAll') === 'true';

    if (deleteAll && userId) {
      // Delete all read notifications for user
      await prisma.notification.deleteMany({
        where: { userId, isRead: true },
      });

      return NextResponse.json({
        success: true,
        message: 'All read notifications deleted',
      });
    }

    if (!notificationId) {
      return NextResponse.json(
        { error: 'Notification ID is required' },
        { status: 400 }
      );
    }

    await prisma.notification.delete({
      where: { id: notificationId },
    });

    return NextResponse.json({
      success: true,
      message: 'Notification deleted',
    });
  } catch (error) {
    console.error('Delete notification error:', error);
    return NextResponse.json(
      { error: 'Failed to delete notification' },
      { status: 500 }
    );
  }
}
