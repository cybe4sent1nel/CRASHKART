import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

/**
 * Get product reviews
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    const reviews = await prisma.rating.findMany({
      where: { productId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Transform reviews to include userId at top level for easier access
    const transformedReviews = reviews.map(review => ({
      ...review,
      userId: review.user?.id || review.userId
    }));

    // Calculate average rating
    const avgRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

    // Count ratings by star
    const ratingDistribution = {
      5: reviews.filter(r => r.rating === 5).length,
      4: reviews.filter(r => r.rating === 4).length,
      3: reviews.filter(r => r.rating === 3).length,
      2: reviews.filter(r => r.rating === 2).length,
      1: reviews.filter(r => r.rating === 1).length,
    };

    return NextResponse.json({
      success: true,
      reviews: transformedReviews,
      avgRating: parseFloat(avgRating.toFixed(1)),
      totalReviews: reviews.length,
      ratingDistribution,
    });
  } catch (error) {
    console.error('Get reviews error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}

/**
 * Add a product review
 */
export async function POST(request) {
  try {
    const { productId, userId, orderId, rating, review, images = [], videos = [] } = await request.json();

    if (!productId || !userId || !orderId || !rating) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate orderId format (MongoDB ObjectID should be 24 hex characters)
    if (!/^[0-9a-fA-F]{24}$/.test(orderId)) {
      console.error('Invalid orderId format:', orderId, 'length:', orderId.length);
      return NextResponse.json(
        { error: 'Invalid order ID format' },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    // Get user by email to find their MongoDB userId
    const user = await prisma.user.findUnique({
      where: { email: userId }, // userId is actually email from frontend
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const actualUserId = user.id;

    // Check if order exists and is delivered
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId: actualUserId,
        status: 'DELIVERED',
        orderItems: {
          some: {
            productId,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'You can only review products from delivered orders' },
        { status: 403 }
      );
    }

    // Check if already reviewed
    const existingReview = await prisma.rating.findUnique({
      where: {
        userId_productId_orderId: {
          userId: actualUserId,
          productId,
          orderId,
        },
      },
    });

    if (existingReview) {
      return NextResponse.json(
        { error: 'You have already reviewed this product' },
        { status: 400 }
      );
    }

    // Create review
    const newReview = await prisma.rating.create({
      data: {
        productId,
        userId: actualUserId,
        orderId,
        rating,
        review: review || '',
        images: images || [],
        videos: videos || [],
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
      review: newReview,
    });
  } catch (error) {
    console.error('Add review error:', error);
    return NextResponse.json(
      { error: 'Failed to add review' },
      { status: 500 }
    );
  }
}

/**
 * Update a review
 */
export async function PATCH(request) {
  try {
    const { reviewId, userId, rating, review, images, videos } = await request.json();

    if (!reviewId || !userId) {
      return NextResponse.json(
        { error: 'Review ID and User ID are required' },
        { status: 400 }
      );
    }

    // Get user by email to find their MongoDB userId
    const user = await prisma.user.findUnique({
      where: { email: userId }, // userId is actually email from frontend
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const actualUserId = user.id;

    // Check if review belongs to user
    const existingReview = await prisma.rating.findFirst({
      where: {
        id: reviewId,
        userId: actualUserId,
      },
    });

    if (!existingReview) {
      return NextResponse.json(
        { error: 'Review not found or unauthorized' },
        { status: 404 }
      );
    }

    const updatedReview = await prisma.rating.update({
      where: { id: reviewId },
      data: {
        ...(rating && { rating }),
        ...(review !== undefined && { review }),
        ...(images !== undefined && { images }),
        ...(videos !== undefined && { videos }),
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
      review: updatedReview,
    });
  } catch (error) {
    console.error('Update review error:', error);
    return NextResponse.json(
      { error: 'Failed to update review' },
      { status: 500 }
    );
  }
}

/**
 * Delete a review
 */
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const reviewId = searchParams.get('id');
    const userId = searchParams.get('userId');

    if (!reviewId || !userId) {
      return NextResponse.json(
        { error: 'Review ID and User ID are required' },
        { status: 400 }
      );
    }

    // Check if review belongs to user
    const existingReview = await prisma.rating.findFirst({
      where: {
        id: reviewId,
        userId,
      },
    });

    if (!existingReview) {
      return NextResponse.json(
        { error: 'Review not found or unauthorized' },
        { status: 404 }
      );
    }

    await prisma.rating.delete({
      where: { id: reviewId },
    });

    return NextResponse.json({
      success: true,
      message: 'Review deleted successfully',
    });
  } catch (error) {
    console.error('Delete review error:', error);
    return NextResponse.json(
      { error: 'Failed to delete review' },
      { status: 500 }
    );
  }
}
