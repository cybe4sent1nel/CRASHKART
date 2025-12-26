import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

/**
 * Seed/sync products from dummy data to database
 * This ensures products have proper images, ratings, and other data
 */
export async function POST(request) {
  try {
    // Import dummy data
    const { productDummyData, dummyRatingsData } = await import('@/assets/assets');

    // First, delete existing products and ratings
    await prisma.rating.deleteMany({});
    await prisma.product.deleteMany({});

    // Create store first (if doesn't exist)
    const store = await prisma.store.findFirst({
      where: { username: 'happyshop' },
    });

    let storeId = store?.id;

    if (!storeId) {
      const newStore = await prisma.store.create({
        data: {
          userId: 'default_seller_user',
          name: 'Happy Shop',
          description: 'Premium electronics and gadgets store',
          username: 'happyshop',
          address: '3rd Floor, Happy Shop, New Building, 123 street, c sector, NY, US',
          status: 'approved',
          isActive: true,
          logo: '/logo.bmp',
          email: 'happyshop@example.com',
          contact: '+0 1234567890',
        },
      });
      storeId = newStore.id;
    }

    // Create products
    const createdProducts = await Promise.all(
      productDummyData.map((product) =>
        prisma.product.create({
          data: {
            id: product.id,
            name: product.name,
            description: product.description,
            mrp: product.mrp,
            price: product.price,
            images: product.images || [],
            category: product.category,
            inStock: product.inStock !== false,
            quantity: product.inStock !== false ? 10 : 0,
            storeId: storeId,
            crashCashMin: product.crashCashMin || 10,
            crashCashMax: product.crashCashMax || 240,
            crashCashValue: product.crashCashValue || 0,
          },
        })
      )
    );

    // Create ratings for products
    if (dummyRatingsData && dummyRatingsData.length > 0) {
      const ratingsToCreate = dummyRatingsData.map((rating) => ({
        id: rating.id,
        rating: rating.rating,
        review: rating.review,
        userId: 'user_default',
        productId: rating.productId,
        orderId: `order_${rating.id}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      // Batch insert ratings
      await Promise.all(
        ratingsToCreate.map((rating) =>
          prisma.rating.create({
            data: rating,
          }).catch(() => null) // Ignore duplicates
        )
      );
    }

    return NextResponse.json({
      success: true,
      message: `Seeded ${createdProducts.length} products successfully`,
      products: createdProducts.length,
    });
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json(
      { error: 'Seed failed', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to check seed status
 */
export async function GET() {
  try {
    const productCount = await prisma.product.count();
    const ratingCount = await prisma.rating.count();

    return NextResponse.json({
      success: true,
      productCount,
      ratingCount,
      message: `Database has ${productCount} products and ${ratingCount} ratings`,
    });
  } catch (error) {
    console.error('Check error:', error);
    return NextResponse.json(
      { error: 'Check failed', details: error.message },
      { status: 500 }
    );
  }
}
