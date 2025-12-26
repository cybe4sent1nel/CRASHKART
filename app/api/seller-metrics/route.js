import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// POST - Calculate and update seller metrics
async function calculateSellerMetrics(storeId) {
  // Get all orders for this store
  const orders = await prisma.order.findMany({
    where: { storeId },
    include: {
      orderItems: true
    }
  });

  // Get all ratings for products in this store
  const products = await prisma.product.findMany({
    where: { storeId },
    include: { rating: true }
  });

  // Get return requests
  const returns = await prisma.returnRequest.findMany({
    where: {
      orderId: { in: orders.map(o => o.id) }
    }
  });

  // Calculate metrics
  const totalSales = orders.length;
  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);

  // Average rating
  const allRatings = products.flatMap(p => p.rating.map(r => r.rating));
  const averageRating = allRatings.length > 0
    ? allRatings.reduce((a, b) => a + b, 0) / allRatings.length
    : 0;

  // Return rate (%)
  const returnedItems = returns.filter(r => 
    r.status === 'returned' || r.status === 'refunded'
  ).length;
  const totalItems = orders.reduce((sum, o) => 
    sum + o.orderItems.reduce((s, oi) => s + oi.quantity, 0), 0
  );
  const returnRate = totalItems > 0
    ? (returnedItems / totalItems) * 100
    : 0;

  // Trust score (0-5)
  const trustScore = Math.min(5, (averageRating * 5) / 5);

  // Customer satisfaction (%)
  const satisfiedOrders = orders.filter(o => {
    const hasNegativeReview = products
      .flatMap(p => p.rating)
      .some(r => r.rating < 3);
    return !hasNegativeReview;
  }).length;
  const customerSatisfaction = totalSales > 0
    ? (satisfiedOrders / totalSales) * 100
    : 100;

  return {
    trustScore: Math.round(trustScore * 10) / 10,
    totalSales,
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    averageRating: Math.round(averageRating * 10) / 10,
    returnRate: Math.round(returnRate * 10) / 10,
    customerSatisfaction: Math.round(customerSatisfaction * 10) / 10
  };
}

// GET - Get seller metrics or leaderboard
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');
    const storeName = searchParams.get('storeName');
    const metric = searchParams.get('metric'); // If metric is provided, return leaderboard
    const limit = parseInt(searchParams.get('limit') || '10');

    // If metric parameter is provided, return leaderboard
    if (metric) {
      const leaderboard = await prisma.sellerMetrics.findMany({
        orderBy: { [metric]: 'desc' },
        take: limit,
        include: {
          store: { select: { id: true, name: true, username: true, logo: true } }
        }
      });

      return NextResponse.json({
        success: true,
        leaderboard: leaderboard.map((item, index) => ({
          rank: index + 1,
          seller: item.store,
          metrics: {
            trustScore: item.trustScore,
            totalSales: item.totalSales,
            averageRating: item.averageRating,
            totalRevenue: item.totalRevenue,
            returnRate: item.returnRate
          }
        }))
      });
    }

    if (!storeId && !storeName) {
      return NextResponse.json(
        { error: 'storeId or storeName required' },
        { status: 400 }
      );
    }

    // Get store
    let store;
    if (storeId) {
      store = await prisma.store.findUnique({
        where: { id: storeId }
      });
    } else {
      store = await prisma.store.findUnique({
        where: { username: storeName }
      });
    }

    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    // Get or create metrics
    let metrics = await prisma.sellerMetrics.findUnique({
      where: { storeId: store.id }
    });

    if (!metrics) {
      // Create new metrics
      const calculated = await calculateSellerMetrics(store.id);
      metrics = await prisma.sellerMetrics.create({
        data: {
          storeId: store.id,
          ...calculated
        }
      });
    }

    // Get recent orders count
    const recentOrders = await prisma.order.count({
      where: {
        storeId: store.id,
        createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      }
    });

    // Get products count
    const productsCount = await prisma.product.count({
      where: { storeId: store.id }
    });

    return NextResponse.json({
      success: true,
      seller: {
        id: store.id,
        name: store.name,
        username: store.username,
        logo: store.logo,
        description: store.description,
        isActive: store.isActive
      },
      metrics: {
        trustScore: metrics.trustScore,
        totalSales: metrics.totalSales,
        recentOrdersThirtyDays: recentOrders,
        totalRevenue: metrics.totalRevenue,
        averageRating: metrics.averageRating,
        responseTime: metrics.responseTime,
        shippingAccuracy: metrics.shippingAccuracy,
        returnRate: metrics.returnRate,
        customerSatisfaction: metrics.customerSatisfaction,
        productsCount,
        lastUpdated: metrics.lastUpdated
      },
      trustBadge: metrics.trustScore >= 4.5
        ? 'trusted'
        : metrics.trustScore >= 4
        ? 'verified'
        : 'standard'
    });

  } catch (error) {
    console.error('Get seller metrics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch seller metrics' },
      { status: 500 }
    );
  }
}

// PUT - Update seller metrics (cron job or manual)
export async function PUT(request) {
  try {
    const body = await request.json();
    const { storeId } = body;

    if (!storeId) {
      return NextResponse.json({ error: 'storeId required' }, { status: 400 });
    }

    // Calculate new metrics
    const calculated = await calculateSellerMetrics(storeId);

    // Update metrics
    const metrics = await prisma.sellerMetrics.update({
      where: { storeId },
      data: {
        ...calculated,
        lastUpdated: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Seller metrics updated',
      metrics
    });

  } catch (error) {
    console.error('Update seller metrics error:', error);
    return NextResponse.json(
      { error: 'Failed to update seller metrics' },
      { status: 500 }
    );
  }
}
