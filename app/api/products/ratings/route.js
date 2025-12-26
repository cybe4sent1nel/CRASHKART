import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

/**
 * Get product ratings/reviews
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = parseInt(searchParams.get('skip') || '0');

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    const [ratings, totalCount, averageRating] = await Promise.all([
      prisma.rating.findMany({
        where: { productId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip,
      }),
      prisma.rating.count({ where: { productId } }),
      prisma.rating.aggregate({
        where: { productId },
        _avg: { rating: true },
      }),
    ]);

    return NextResponse.json({
      success: true,
      ratings,
      totalCount,
      averageRating: averageRating._avg.rating || 0,
      pagination: {
        skip,
        limit,
        hasMore: skip + limit < totalCount,
      },
    });
  } catch (error) {
    console.error('Error fetching ratings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ratings' },
      { status: 500 }
    );
  }
}

/**
 * Add new rating/review
 */
export async function POST(request) {
  try {
    const { productId, userId, rating, review, orderId } = await request.json();

    if (!productId || !userId || !rating || !review || !orderId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    // Check if user already reviewed this product from this order
    const existingReview = await prisma.rating.findUnique({
      where: {
        userId_productId_orderId: {
          userId,
          productId,
          orderId,
        },
      },
    });

    if (existingReview) {
      return NextResponse.json(
        { error: 'You have already reviewed this product from this order' },
        { status: 400 }
      );
    }

    const newRating = await prisma.rating.create({
      data: {
        rating,
        review,
        userId,
        productId,
        orderId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      rating: newRating,
    });
  } catch (error) {
    console.error('Error creating rating:', error);
    return NextResponse.json(
      { error: 'Failed to create rating' },
      { status: 500 }
    );
  }
}
