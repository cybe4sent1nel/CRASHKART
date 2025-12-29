import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * GET /api/products/recommendations - Get personalized product recommendations
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const productId = searchParams.get('productId');
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '8');

    let recommendations = [];

    // Strategy 1: If viewing a product, get similar products
    if (productId) {
      const currentProduct = await prisma.product.findUnique({
        where: { id: productId }
      });

      if (currentProduct) {
        // Get products in same category, excluding current
        recommendations = await prisma.product.findMany({
          where: {
            category: currentProduct.category,
            id: { not: productId },
            inStock: true
          },
          include: {
            store: { select: { name: true } },
            rating: true
          },
          take: limit
        });
      }
    }

    // Strategy 2: If user is logged in, use purchase history
    if (userId && recommendations.length < limit) {
      // Get user's purchased product categories
      const userOrders = await prisma.order.findMany({
        where: { userId },
        include: {
          orderItems: {
            include: {
              product: { select: { category: true } }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 5
      });

      const purchasedCategories = [...new Set(
        userOrders.flatMap(order => 
          order.orderItems.map(item => item.product?.category)
        ).filter(Boolean)
      )];

      const purchasedProductIds = userOrders.flatMap(order =>
        order.orderItems.map(item => item.productId)
      );

      if (purchasedCategories.length > 0) {
        const categoryRecs = await prisma.product.findMany({
          where: {
            category: { in: purchasedCategories },
            id: { 
              notIn: [...purchasedProductIds, ...(productId ? [productId] : [])]
            },
            inStock: true
          },
          include: {
            store: { select: { name: true } },
            rating: true
          },
          take: limit - recommendations.length
        });

        recommendations = [...recommendations, ...categoryRecs];
      }
    }

    // Strategy 3: If category provided, get from that category
    if (category && recommendations.length < limit) {
      const categoryProducts = await prisma.product.findMany({
        where: {
          category,
          id: { notIn: [productId, ...recommendations.map(r => r.id)].filter(Boolean) },
          inStock: true
        },
        include: {
          store: { select: { name: true } },
          rating: true
        },
        take: limit - recommendations.length
      });

      recommendations = [...recommendations, ...categoryProducts];
    }

    // Strategy 4: Fill with best sellers if still not enough
    if (recommendations.length < limit) {
      const bestSellers = await prisma.product.findMany({
        where: {
          id: { notIn: [productId, ...recommendations.map(r => r.id)].filter(Boolean) },
          inStock: true
        },
        include: {
          store: { select: { name: true } },
          rating: true,
          _count: {
            select: { orderItems: true }
          }
        },
        orderBy: {
          orderItems: { _count: 'desc' }
        },
        take: limit - recommendations.length
      });

      recommendations = [...recommendations, ...bestSellers];
    }

    // Calculate average rating for each product
    const productsWithRating = recommendations.map(product => {
      const ratings = product.rating || [];
      const avgRating = ratings.length > 0
        ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
        : 0;
      
      return {
        ...product,
        averageRating: Math.round(avgRating * 10) / 10,
        reviewCount: ratings.length
      };
    });

    return NextResponse.json({
      success: true,
      recommendations: productsWithRating,
      count: productsWithRating.length
    });

  } catch (error) {
    console.error('Get recommendations error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get recommendations' },
      { status: 500 }
    );
  }
}
