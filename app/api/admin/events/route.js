import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * Admin Events API - Tracks all admin actions and system events
 */

// GET - List all events with filters
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const eventType = searchParams.get('eventType'); // 'order', 'user', 'product', 'coupon', 'store'
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const skip = (page - 1) * limit;

    // For now, we'll collect events from various sources
    // In a production app, you'd have an Event model in Prisma

    // Get recent order updates
    const orderEvents = await prisma.order.findMany({
      where: {
        updatedAt: {
          gte: startDate ? new Date(startDate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          lte: endDate ? new Date(endDate) : new Date()
        }
      },
      select: {
        id: true,
        status: true,
        updatedAt: true,
        createdAt: true,
        total: true,
        user: { select: { name: true, email: true } },
        paymentMethod: true
      },
      orderBy: { updatedAt: 'desc' },
      take: limit,
      skip: eventType === 'order' || !eventType ? skip : 0
    });

    // Get recent user updates (logins, profile changes, etc.)
    const userEvents = await prisma.user.findMany({
      where: {
        updatedAt: {
          gte: startDate ? new Date(startDate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          lte: endDate ? new Date(endDate) : new Date()
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        updatedAt: true,
        createdAt: true,
        isProfileSetup: true
      },
      orderBy: { updatedAt: 'desc' },
      take: limit,
      skip: eventType === 'user' || !eventType ? skip : 0
    });

    // Get recent product updates
    const productEvents = await prisma.product.findMany({
      where: {
        updatedAt: {
          gte: startDate ? new Date(startDate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          lte: endDate ? new Date(endDate) : new Date()
        }
      },
      select: {
        id: true,
        name: true,
        updatedAt: true,
        createdAt: true,
        price: true,
        inStock: true
      },
      orderBy: { updatedAt: 'desc' },
      take: limit,
      skip: eventType === 'product' || !eventType ? skip : 0
    });

    // Combine and format events
    const allEvents = [];

    // Add order events
    orderEvents.forEach(order => {
      allEvents.push({
        id: `order-${order.id}`,
        type: 'order',
        action: 'status_updated',
        timestamp: order.updatedAt,
        entity: {
          id: order.id,
          name: `Order #${order.id.substring(0, 8)}`,
          status: order.status,
          total: order.total,
          paymentMethod: order.paymentMethod,
          customer: order.user?.name || order.user?.email
        }
      });
    });

    // Add user events
    userEvents.forEach(user => {
      allEvents.push({
        id: `user-${user.id}`,
        type: 'user',
        action: user.isProfileSetup ? 'profile_updated' : 'registered',
        timestamp: user.updatedAt,
        entity: {
          id: user.id,
          name: user.name || user.email,
          email: user.email,
          joinDate: user.createdAt
        }
      });
    });

    // Add product events
    productEvents.forEach(product => {
      allEvents.push({
        id: `product-${product.id}`,
        type: 'product',
        action: 'updated',
        timestamp: product.updatedAt,
        entity: {
          id: product.id,
          name: product.name,
          price: product.price,
          inStock: product.inStock
        }
      });
    });

    // Sort by timestamp
    allEvents.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    const total = allEvents.length;
    const paginatedEvents = allEvents.slice(0, limit);

    return NextResponse.json({
      success: true,
      events: paginatedEvents,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch events', details: error.message },
      { status: 500 }
    );
  }
}

// POST - Log a custom event
export async function POST(request) {
  try {
    const body = await request.json();
    const { eventType, action, entityId, entityType, details, userId } = body;

    // Create notification for the action
    if (userId) {
      await prisma.notification.create({
        data: {
          userId: userId,
          title: `${entityType} ${action}`,
          message: details || `${entityType} has been ${action}`,
          type: 'info'
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Event logged successfully',
      event: {
        type: eventType,
        action,
        entityId,
        entityType,
        timestamp: new Date()
      }
    });
  } catch (error) {
    console.error('Error logging event:', error);
    return NextResponse.json(
      { error: 'Failed to log event', details: error.message },
      { status: 500 }
    );
  }
}
