import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

/**
 * POST /api/seed-ratings
 * Seeds 4-5 star ratings for all products
 * This is for demo purposes to populate products with ratings
 */
export async function POST(request) {
    try {
        // Get all products
        const products = await prisma.product.findMany({
            select: { id: true, name: true }
        });

        if (products.length === 0) {
            return NextResponse.json({
                error: 'No products found to seed ratings for',
                success: false
            }, { status: 400 });
        }

        // Get or create demo user for ratings
        let demoUser = await prisma.user.findUnique({
            where: { email: 'demo@crashkart.com' }
        });

        if (!demoUser) {
            demoUser = await prisma.user.create({
                data: {
                    email: 'demo@crashkart.com',
                    name: 'Demo User',
                    isEmailVerified: true,
                    isProfileSetup: true
                }
            });
        }

        // Sample reviews for 4-5 star ratings
        const reviews = [
            { rating: 5, review: 'Excellent product! Highly recommended.' },
            { rating: 5, review: 'Amazing quality and fast delivery!' },
            { rating: 5, review: 'Best purchase ever! Will buy again.' },
            { rating: 5, review: 'Perfect! Exactly as described.' },
            { rating: 4, review: 'Great product, good value for money.' },
            { rating: 4, review: 'Very satisfied with the purchase.' },
            { rating: 4, review: 'Good quality, arrived on time.' },
            { rating: 5, review: 'Fantastic! Love it!' }
        ];

        let ratingsCreated = 0;
        const errors = [];

        // Get all orders to link ratings to (for demo purposes)
        const orders = await prisma.order.findMany({
            select: { id: true, userId: true },
            take: 100
        });

        // Seed ratings for each product
        for (const product of products) {
            try {
                // Create 3-4 ratings per product (randomly selecting from reviews)
                const ratingsCount = Math.floor(Math.random() * 2) + 3; // 3-4 ratings per product

                for (let i = 0; i < ratingsCount; i++) {
                    const review = reviews[Math.floor(Math.random() * reviews.length)];
                    const order = orders[Math.floor(Math.random() * orders.length)];

                    // Check if rating already exists
                    const existingRating = await prisma.rating.findUnique({
                        where: {
                            userId_productId_orderId: {
                                userId: order?.userId || demoUser.id,
                                productId: product.id,
                                orderId: order?.id || product.id
                            }
                        }
                    }).catch(() => null);

                    if (!existingRating) {
                        await prisma.rating.create({
                            data: {
                                rating: review.rating,
                                review: review.review,
                                userId: order?.userId || demoUser.id,
                                productId: product.id,
                                orderId: order?.id || product.id
                            }
                        });
                        ratingsCreated++;
                    }
                }
            } catch (error) {
                errors.push({
                    productId: product.id,
                    productName: product.name,
                    error: error.message
                });
            }
        }

        return NextResponse.json({
            success: true,
            message: `Seeded ratings for ${products.length} products`,
            ratingsCreated,
            totalProducts: products.length,
            errors: errors.length > 0 ? errors : []
        });
    } catch (error) {
        console.error('Error seeding ratings:', error);
        return NextResponse.json({
            error: 'Failed to seed ratings',
            details: error.message,
            success: false
        }, { status: 500 });
    }
}

/**
 * GET /api/seed-ratings
 * Check rating seed status
 */
export async function GET(request) {
    try {
        const products = await prisma.product.findMany({
            select: { id: true },
            take: 1
        });

        if (products.length === 0) {
            return NextResponse.json({
                success: false,
                message: 'No products found'
            });
        }

        const ratingsCount = await prisma.rating.count();
        const productsCount = await prisma.product.count();

        return NextResponse.json({
            success: true,
            totalProducts: productsCount,
            totalRatings: ratingsCount,
            averageRatingsPerProduct: (ratingsCount / productsCount).toFixed(2),
            message: 'Rating seed status'
        });
    } catch (error) {
        console.error('Error checking rating status:', error);
        return NextResponse.json({
            error: 'Failed to check rating status',
            details: error.message,
            success: false
        }, { status: 500 });
    }
}
