import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { sendBackInStockEmail, sendPriceDropEmail } from '@/lib/email';

const prisma = new PrismaClient();

/**
 * POST /api/products/alerts/check - Check and send alerts for price drops and back-in-stock
 * This should be called periodically (e.g., via cron job)
 */
export async function POST(request) {
  try {
    const { productId, checkType = 'all' } = await request.json();

    let alertsSent = {
      priceDrops: 0,
      backInStock: 0
    };

    // Build query based on whether specific product or all products
    const productWhere = productId ? { id: productId } : {};

    // Get all products with their current prices
    const products = await prisma.product.findMany({
      where: productWhere,
      select: {
        id: true,
        name: true,
        price: true,
        inStock: true,
        images: true
      }
    });

    const productMap = new Map(products.map(p => [p.id, p]));

    // Check for price drops
    if (checkType === 'all' || checkType === 'price') {
      const priceAlertItems = await prisma.wishlistItem.findMany({
        where: {
          notifyPrice: true,
          productId: productId ? productId : undefined
        }
      });

      for (const item of priceAlertItems) {
        const product = productMap.get(item.productId);
        if (!product) continue;

        // Check if price dropped by at least 5%
        const priceDrop = item.priceAtAdd - product.price;
        const dropPercent = (priceDrop / item.priceAtAdd) * 100;

        if (dropPercent >= 5) {
          // Get user
          const user = await prisma.user.findUnique({
            where: { id: item.userId },
            select: { name: true, email: true }
          });

          if (user?.email) {
            await sendPriceDropEmail(
              user.email,
              {
                productName: product.name,
                productImage: product.images?.[0],
                productUrl: `${process.env.NEXT_PUBLIC_APP_URL}/product/${product.id}`,
                originalPrice: item.priceAtAdd,
                newPrice: product.price,
                discount: Math.round(dropPercent)
              },
              user.name || 'Shopper'
            );
            alertsSent.priceDrops++;
          }

          // Update the priceAtAdd to current price to avoid repeated alerts
          await prisma.wishlistItem.update({
            where: {
              userId_productId: { userId: item.userId, productId: item.productId }
            },
            data: { priceAtAdd: product.price }
          });
        }
      }
    }

    // Check for back-in-stock
    if (checkType === 'all' || checkType === 'stock') {
      const stockAlertItems = await prisma.wishlistItem.findMany({
        where: {
          notifyStock: true,
          productId: productId ? productId : undefined
        }
      });

      for (const item of stockAlertItems) {
        const product = productMap.get(item.productId);
        if (!product || !product.inStock) continue;

        // Get user
        const user = await prisma.user.findUnique({
          where: { id: item.userId },
          select: { name: true, email: true }
        });

        if (user?.email) {
          await sendBackInStockEmail(
            user.email,
            {
              productName: product.name,
              productImage: product.images?.[0],
              productUrl: `${process.env.NEXT_PUBLIC_APP_URL}/product/${product.id}`,
              price: product.price
            },
            user.name || 'Shopper'
          );
          alertsSent.backInStock++;
        }

        // Remove from wishlist or disable stock notification
        await prisma.wishlistItem.update({
          where: {
            userId_productId: { userId: item.userId, productId: item.productId }
          },
          data: { notifyStock: false }
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Alerts checked and sent',
      alertsSent
    });

  } catch (error) {
    console.error('Check alerts error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check alerts' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/products/alerts/check - Get alert statistics
 */
export async function GET(request) {
  try {
    // Get counts
    const priceAlertCount = await prisma.wishlistItem.count({
      where: { notifyPrice: true }
    });

    const stockAlertCount = await prisma.wishlistItem.count({
      where: { notifyStock: true }
    });

    const totalWishlistItems = await prisma.wishlistItem.count();

    // Get out of stock products that have wishlist items
    const outOfStockWithWishlist = await prisma.product.count({
      where: {
        inStock: false,
        id: {
          in: (await prisma.wishlistItem.findMany({
            where: { notifyStock: true },
            select: { productId: true }
          })).map(w => w.productId)
        }
      }
    });

    return NextResponse.json({
      success: true,
      stats: {
        priceAlertSubscriptions: priceAlertCount,
        stockAlertSubscriptions: stockAlertCount,
        totalWishlistItems,
        outOfStockProductsWatched: outOfStockWithWishlist
      }
    });

  } catch (error) {
    console.error('Get alert stats error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get stats' },
      { status: 500 }
    );
  }
}
