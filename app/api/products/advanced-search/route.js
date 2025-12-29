import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * POST /api/products/advanced-search
 * Advanced search with filters
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const {
      query = '',
      category = null,
      priceMin = 0,
      priceMax = 999999,
      ratingMin = 0,
      sellerId = null,
      inStock = true,
      sortBy = 'relevance', // relevance, price-low, price-high, newest, rating
      limit = 20,
      page = 1
    } = body;

    const skip = (page - 1) * limit;

    // Build where clause
    let where = {
      inStock: inStock,
      price: {
        gte: priceMin,
        lte: priceMax
      }
    };

    if (query) {
      where.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { category: { contains: query, mode: 'insensitive' } }
      ];
    }

    if (category) {
      where.category = category;
    }

    if (sellerId) {
      where.storeId = sellerId;
    }

    // Get products
    let orderBy = [{ createdAt: 'desc' }];

    switch (sortBy) {
      case 'price-low':
        orderBy = [{ price: 'asc' }];
        break;
      case 'price-high':
        orderBy = [{ price: 'desc' }];
        break;
      case 'newest':
        orderBy = [{ createdAt: 'desc' }];
        break;
      case 'rating':
        // Will sort by average rating after fetching
        break;
      case 'relevance':
      default:
        orderBy = [{ createdAt: 'desc' }];
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          store: { select: { id: true, name: true } },
          rating: true
        },
        orderBy,
        skip,
        take: limit
      }),
      prisma.product.count({ where })
    ]);

    // Enrich with ratings and filter by ratingMin
    const enrichedProducts = products
      .map(product => {
        const ratings = product.rating || [];
        const avgRating = ratings.length > 0
          ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
          : 0;

        return {
          ...product,
          averageRating: Math.round(avgRating * 10) / 10,
          reviewCount: ratings.length
        };
      })
      .filter(p => p.averageRating >= ratingMin);

    // Sort by rating if requested
    if (sortBy === 'rating') {
      enrichedProducts.sort((a, b) => b.averageRating - a.averageRating);
    }

    return NextResponse.json({
      success: true,
      products: enrichedProducts.slice(0, limit),
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      },
      filters: {
        query,
        category,
        priceRange: { min: priceMin, max: priceMax },
        ratingMin,
        sellerId,
        inStock,
        sortBy
      }
    });

  } catch (error) {
    console.error('Advanced search error:', error);
    return NextResponse.json(
      { error: 'Advanced search failed' },
      { status: 500 }
    );
  }
}

// GET - Get available filters
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'categories', 'sellers', 'price-range'

    if (type === 'categories') {
      const categories = await prisma.product.groupBy({
        by: ['category'],
        _count: { id: true }
      });

      return NextResponse.json({
        success: true,
        categories: categories.map(c => ({
          name: c.category,
          count: c._count.id
        }))
      });
    }

    if (type === 'sellers') {
      const sellers = await prisma.store.findMany({
        where: { isActive: true },
        select: { id: true, name: true },
        take: 50
      });

      return NextResponse.json({
        success: true,
        sellers
      });
    }

    if (type === 'price-range') {
      const minPrice = await prisma.product.aggregate({
        _min: { price: true }
      });

      const maxPrice = await prisma.product.aggregate({
        _max: { price: true }
      });

      return NextResponse.json({
        success: true,
        priceRange: {
          min: minPrice._min.price || 0,
          max: maxPrice._max.price || 100000
        }
      });
    }

    // Default: return all filter options
    const [categories, sellers, priceData] = await Promise.all([
      prisma.product.groupBy({
        by: ['category'],
        _count: { id: true }
      }),
      prisma.store.findMany({
        where: { isActive: true },
        select: { id: true, name: true },
        take: 50
      }),
      Promise.all([
        prisma.product.aggregate({ _min: { price: true } }),
        prisma.product.aggregate({ _max: { price: true } })
      ])
    ]);

    return NextResponse.json({
      success: true,
      filters: {
        categories: categories.map(c => ({
          name: c.category,
          count: c._count.id
        })),
        sellers,
        priceRange: {
          min: priceData[0]._min.price || 0,
          max: priceData[1]._max.price || 100000
        },
        ratings: [
          { min: 4.5, label: '4.5★ & up', count: 0 },
          { min: 4, label: '4★ & up', count: 0 },
          { min: 3, label: '3★ & up', count: 0 },
          { min: 0, label: 'All ratings', count: 0 }
        ],
        sortOptions: [
          { value: 'relevance', label: 'Relevance' },
          { value: 'price-low', label: 'Price: Low to High' },
          { value: 'price-high', label: 'Price: High to Low' },
          { value: 'newest', label: 'Newest First' },
          { value: 'rating', label: 'Highest Rated' }
        ]
      }
    });

  } catch (error) {
    console.error('Get filters error:', error);
    return NextResponse.json({ error: 'Failed to fetch filters' }, { status: 500 });
  }
}
