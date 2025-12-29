import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

/**
 * GET /api/admin/flash-sales
 * Fetch flash sales with optional filters
 */
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const isActive = searchParams.get('isActive');

        // Build where clause
        const whereClause = {};
        
        if (isActive === 'true') {
            // Get currently active sales (not expired)
            const now = new Date();
            whereClause.AND = [
                { startTime: { lte: now } },
                { endTime: { gte: now } },
                { isActive: true }
            ];
        }

        const flashSales = await prisma.flashSale.findMany({
            where: whereClause,
            orderBy: { startTime: 'desc' }
        });

        return NextResponse.json(flashSales);
    } catch (error) {
        console.error('Error fetching flash sales:', error);
        return NextResponse.json(
            { error: 'Failed to fetch flash sales', details: error.message },
            { status: 500 }
        );
    }
}

/**
 * POST /api/admin/flash-sales
 * Create a new flash sale (admin only)
 */
export async function POST(request) {
    try {
        const body = await request.json();
        const {
            title,
            description,
            products,
            productQuantities,
            productDiscounts,
            discount,
            maxQuantity,
            startTime,
            endTime,
            bannerImage,
            allowCoupons,
            allowCrashCash
        } = body;

        // Validate required fields
        if (!title || !discount || !startTime || !endTime || !Array.isArray(products) || products.length === 0) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Validate discount
        if (discount < 0 || discount > 100) {
            return NextResponse.json(
                { error: 'Discount must be between 0 and 100' },
                { status: 400 }
            );
        }

        // Validate product-wise discounts if provided
        if (productDiscounts && Object.keys(productDiscounts).length > 0) {
            for (const [productId, productDiscount] of Object.entries(productDiscounts)) {
                if (productDiscount < 0 || productDiscount > 100) {
                    return NextResponse.json(
                        { error: `Discount for product ${productId} must be between 0 and 100` },
                        { status: 400 }
                    );
                }
            }
        }

        const flashSale = await prisma.flashSale.create({
            data: {
                title,
                description,
                products,
                productQuantities: productQuantities || {},
                productDiscounts: productDiscounts || {},
                discount,
                maxQuantity: maxQuantity || 100,
                startTime: new Date(startTime),
                endTime: new Date(endTime),
                bannerImage,
                allowCoupons: allowCoupons || false,
                allowCrashCash: allowCrashCash || false,
                isActive: true
            }
        });

        return NextResponse.json(flashSale, { status: 201 });
    } catch (error) {
        console.error('Error creating flash sale:', error);
        return NextResponse.json(
            { error: 'Failed to create flash sale', details: error.message },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/admin/flash-sales/:id
 * Update a flash sale (admin only)
 */
export async function PUT(request) {
    try {
        const { searchParams } = new URL(request.url);
        const saleId = searchParams.get('id');

        if (!saleId) {
            return NextResponse.json(
                { error: 'Sale ID required' },
                { status: 400 }
            );
        }

        const body = await request.json();

        // Validate product-wise discounts if provided
        if (body.productDiscounts && Object.keys(body.productDiscounts).length > 0) {
            for (const [productId, productDiscount] of Object.entries(body.productDiscounts)) {
                if (productDiscount < 0 || productDiscount > 100) {
                    return NextResponse.json(
                        { error: `Discount for product ${productId} must be between 0 and 100` },
                        { status: 400 }
                    );
                }
            }
        }

        const updatedSale = await prisma.flashSale.update({
            where: { id: saleId },
            data: {
                ...(body.title && { title: body.title }),
                ...(body.description && { description: body.description }),
                ...(body.products && { products: body.products }),
                ...(body.productQuantities && { productQuantities: body.productQuantities }),
                ...(body.productDiscounts !== undefined && { productDiscounts: body.productDiscounts }),
                ...(body.discount !== undefined && { discount: body.discount }),
                ...(body.maxQuantity && { maxQuantity: body.maxQuantity }),
                ...(body.startTime && { startTime: new Date(body.startTime) }),
                ...(body.endTime && { endTime: new Date(body.endTime) }),
                ...(body.bannerImage && { bannerImage: body.bannerImage }),
                ...(body.allowCoupons !== undefined && { allowCoupons: body.allowCoupons }),
                ...(body.allowCrashCash !== undefined && { allowCrashCash: body.allowCrashCash }),
                ...(body.isActive !== undefined && { isActive: body.isActive })
            }
        });

        return NextResponse.json(updatedSale);
    } catch (error) {
        console.error('Error updating flash sale:', error);
        return NextResponse.json(
            { error: 'Failed to update flash sale', details: error.message },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/admin/flash-sales/:id
 * Delete a flash sale (admin only)
 */
export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url);
        const saleId = searchParams.get('id');

        if (!saleId) {
            return NextResponse.json(
                { error: 'Sale ID required' },
                { status: 400 }
            );
        }

        await prisma.flashSale.delete({
            where: { id: saleId }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting flash sale:', error);
        return NextResponse.json(
            { error: 'Failed to delete flash sale', details: error.message },
            { status: 500 }
        );
    }
}
