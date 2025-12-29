import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

/**
 * GET /api/admin/inventory
 * Fetch all products for inventory management
 */
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '500');
        const page = parseInt(searchParams.get('page') || '1');
        const search = searchParams.get('search') || '';
        const category = searchParams.get('category');
        const storeId = searchParams.get('storeId');

        const skip = (page - 1) * limit;

        // Build where clause
        const whereClause = {};

        if (search) {
            whereClause.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } }
            ];
        }

        if (category) {
            whereClause.category = category;
        }

        if (storeId) {
            whereClause.storeId = storeId;
        }

        // Fetch products with store info and ratings
         const products = await prisma.product.findMany({
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
                 inStock: true,
                 storeId: true,
                 store: {
                     select: {
                         id: true,
                         name: true,
                         logo: true
                     }
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
                 createdAt: true,
                 _count: {
                     select: { rating: true, orderItems: true }
                 }
             },
             orderBy: { createdAt: 'desc' },
             skip,
             take: limit
         });

         // Get total count
         const total = await prisma.product.count({ where: whereClause });

         // Enrich products with additional data
         const enrichedProducts = products.map(product => ({
             ...product,
             totalRatings: product._count.rating,
             totalOrders: product._count.orderItems,
             _count: undefined
         }));

        return NextResponse.json({
            success: true,
            products: enrichedProducts,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching inventory:', error);
        return NextResponse.json(
            { error: 'Failed to fetch inventory', details: error.message },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/admin/inventory/:id
 * Update product inventory
 */
export async function PUT(request) {
    try {
        const { searchParams } = new URL(request.url);
        const productId = searchParams.get('id');

        if (!productId) {
            return NextResponse.json(
                { error: 'Product ID required' },
                { status: 400 }
            );
        }

        const body = await request.json();
        const { quantity, inStock, price } = body;

        const updatedProduct = await prisma.product.update({
            where: { id: productId },
            data: {
                ...(quantity !== undefined && { quantity }),
                ...(inStock !== undefined && { inStock }),
                ...(price !== undefined && { price })
            }
        });

        return NextResponse.json(updatedProduct);
    } catch (error) {
        console.error('Error updating inventory:', error);
        return NextResponse.json(
            { error: 'Failed to update inventory', details: error.message },
            { status: 500 }
        );
    }
}
