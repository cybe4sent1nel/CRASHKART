import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * Advanced product search with filters - OPTIMIZED
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Search parameters
    const query = searchParams.get('q') || '';
    const category = searchParams.get('category');
    const minPrice = parseFloat(searchParams.get('minPrice') || '0');
    const maxPrice = parseFloat(searchParams.get('maxPrice') || '999999');
    const sortBy = searchParams.get('sortBy') || 'relevance';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100); // Cap at 100
    const inStockOnly = searchParams.get('inStock') === 'true';

    // Build where clause
    const whereClause = {
      AND: [
        query ? {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
          ],
        } : {},
        category ? { category } : {},
        { price: { gte: minPrice, lte: maxPrice } },
        inStockOnly ? { quantity: { gt: 0 } } : {},
      ],
    };

    // Build orderBy clause
    let orderBy = { name: 'asc' };
    if (sortBy === 'price_low') orderBy = { price: 'asc' };
    else if (sortBy === 'price_high') orderBy = { price: 'desc' };
    else if (sortBy === 'newest') orderBy = { createdAt: 'desc' };

    // Fetch products with ratings relation
     // Only fetch if limit is reasonable
     let products = [];
     let totalCount = 0;
     
     if (limit <= 100) {
       [products, totalCount] = await Promise.all([
         prisma.product.findMany({
           where: whereClause,
           select: {
             id: true,
             name: true,
             description: true,
             price: true,
             mrp: true,
             images: true,
             category: true,
             quantity: true,
             store: {
               select: {
                 id: true,
                 name: true,
                 logo: true,
               },
             },
             rating: {
               select: {
                 id: true,
                 rating: true,
                 review: true,
                 userId: true,
                 createdAt: true
               }
             },
             _count: {
               select: { rating: true }
             }
           },
           orderBy,
           skip: (page - 1) * limit,
           take: limit,
         }),
         prisma.product.count({ where: whereClause }),
       ]);
     }

     // Map products with calculated fields
     const productsWithData = products.map((product) => {
       const avgRating = product.rating && product.rating.length > 0
         ? Math.round(product.rating.reduce((acc, curr) => acc + curr.rating, 0) / product.rating.length)
         : 0;
       return {
         ...product,
         avgRating,
         totalRatings: product._count?.rating || 0,
         inStock: product.quantity > 0,
       };
     });

    return NextResponse.json({
      success: true,
      products: productsWithData,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
        totalProducts: totalCount,
      },
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Search failed', details: error.message },
      { status: 500 }
    );
  }
}

