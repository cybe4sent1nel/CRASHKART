import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

/**
 * PUT /api/admin/inventory/[productId]
 * Update product inventory by product ID
 */
export async function PUT(request, { params }) {
    try {
        const { productId } = params;

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

/**
 * GET /api/admin/inventory/[productId]
 * Get single product details
 */
export async function GET(request, { params }) {
    try {
        const { productId } = params;

        if (!productId) {
            return NextResponse.json(
                { error: 'Product ID required' },
                { status: 400 }
            );
        }

        const product = await prisma.product.findUnique({
            where: { id: productId },
            include: {
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
                }
            }
        });

        if (!product) {
            return NextResponse.json(
                { error: 'Product not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(product);
    } catch (error) {
        console.error('Error fetching product:', error);
        return NextResponse.json(
            { error: 'Failed to fetch product', details: error.message },
            { status: 500 }
        );
    }
}
