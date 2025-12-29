import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET - Fetch recently viewed products for a user
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Get recently viewed from database
    const recentlyViewed = await prisma.recentlyViewed.findMany({
      where: { userId },
      orderBy: { viewedAt: 'desc' },
      take: limit,
      include: {
        product: {
          include: {
            store: {
              select: { name: true }
            },
            ratings: {
              select: { rating: true }
            }
          }
        }
      }
    });

    // Calculate average rating and format response
    const products = recentlyViewed
      .filter(rv => rv.product) // Filter out deleted products
      .map(rv => {
        const ratings = rv.product.ratings || [];
        const avgRating = ratings.length > 0
          ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
          : 0;

        return {
          id: rv.id,
          productId: rv.productId,
          viewedAt: rv.viewedAt,
          viewCount: rv.viewCount,
          product: {
            ...rv.product,
            averageRating: Number(avgRating.toFixed(1)),
            totalRatings: ratings.length
          }
        };
      });

    return NextResponse.json({
      success: true,
      recentlyViewed: products,
      count: products.length
    });

  } catch (error) {
    console.error('Error fetching recently viewed:', error);
    return NextResponse.json({ error: 'Failed to fetch recently viewed' }, { status: 500 });
  }
}

// POST - Track product view
export async function POST(request) {
  try {
    const body = await request.json();
    const { userId, productId } = body;

    if (!userId || !productId) {
      return NextResponse.json({ error: 'User ID and Product ID required' }, { status: 400 });
    }

    // Verify product exists
    const product = await prisma.product.findUnique({
      where: { id: productId }
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Upsert - update if exists, create if not
    const existing = await prisma.recentlyViewed.findFirst({
      where: { userId, productId }
    });

    let recentlyViewed;
    if (existing) {
      // Update view count and timestamp
      recentlyViewed = await prisma.recentlyViewed.update({
        where: { id: existing.id },
        data: {
          viewedAt: new Date(),
          viewCount: existing.viewCount + 1
        }
      });
    } else {
      // Create new record
      recentlyViewed = await prisma.recentlyViewed.create({
        data: {
          userId,
          productId,
          viewCount: 1
        }
      });
    }

    // Keep only the latest 50 viewed products per user
    const count = await prisma.recentlyViewed.count({ where: { userId } });
    if (count > 50) {
      const toDelete = await prisma.recentlyViewed.findMany({
        where: { userId },
        orderBy: { viewedAt: 'asc' },
        take: count - 50,
        select: { id: true }
      });

      await prisma.recentlyViewed.deleteMany({
        where: { id: { in: toDelete.map(r => r.id) } }
      });
    }

    return NextResponse.json({
      success: true,
      recentlyViewed
    });

  } catch (error) {
    console.error('Error tracking product view:', error);
    return NextResponse.json({ error: 'Failed to track view' }, { status: 500 });
  }
}

// DELETE - Clear recently viewed history
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const productId = searchParams.get('productId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    if (productId) {
      // Delete specific product from history
      await prisma.recentlyViewed.deleteMany({
        where: { userId, productId }
      });
    } else {
      // Clear entire history
      await prisma.recentlyViewed.deleteMany({
        where: { userId }
      });
    }

    return NextResponse.json({
      success: true,
      message: productId ? 'Product removed from history' : 'View history cleared'
    });

  } catch (error) {
    console.error('Error clearing view history:', error);
    return NextResponse.json({ error: 'Failed to clear history' }, { status: 500 });
  }
}
