import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendAbandonedCartEmail, sendPriceDropEmail, sendBackInStockEmail, sendFlashSaleEmail } from '@/lib/email';

// This endpoint should be called by a cron job (e.g., Vercel Cron, GitHub Actions, etc.)
// Call with proper authorization token
export async function POST(request) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { task } = await request.json();
    
    let result;
    
    switch (task) {
      case 'abandoned-cart':
        result = await processAbandonedCarts();
        break;
      case 'price-alerts':
        result = await processPriceAlerts();
        break;
      case 'stock-alerts':
        result = await processStockAlerts();
        break;
      case 'cleanup':
        result = await cleanupExpiredData();
        break;
      case 'all':
        result = {
          abandonedCarts: await processAbandonedCarts(),
          priceAlerts: await processPriceAlerts(),
          stockAlerts: await processStockAlerts(),
          cleanup: await cleanupExpiredData()
        };
        break;
      default:
        return NextResponse.json({ error: 'Invalid task' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      task,
      result,
      processedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json({ error: 'Cron job failed', details: error.message }, { status: 500 });
  }
}

// Process abandoned carts - send reminder emails
async function processAbandonedCarts() {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

  // Get carts that need reminders
  const carts = await prisma.abandonedCart.findMany({
    where: {
      OR: [
        // First reminder: 1 hour after cart created
        { reminderSent: 0, updatedAt: { lt: oneHourAgo } },
        // Second reminder: 1 day after first
        { reminderSent: 1, lastReminder: { lt: oneDayAgo } },
        // Third reminder: 3 days after second
        { reminderSent: 2, lastReminder: { lt: threeDaysAgo } }
      ]
    }
  });

  let sent = 0;
  let failed = 0;

  for (const cart of carts) {
    try {
      // Get user details
      const user = await prisma.user.findUnique({
        where: { id: cart.userId },
        select: { name: true, email: true }
      });

      if (!user || !user.email) continue;

      // Get product details for cart items
      const items = cart.items;
      const productIds = items.map(item => item.productId || item.id);
      
      const products = await prisma.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, name: true, price: true, images: true }
      });

      const cartItems = items.map(item => {
        const product = products.find(p => p.id === (item.productId || item.id));
        return {
          name: product?.name || item.name,
          price: product?.price || item.price,
          quantity: item.quantity,
          image: product?.images?.[0] || item.image
        };
      });

      // Send reminder email
      await sendAbandonedCartEmail(user.email, {
        name: user.name,
        cartItems,
        cartTotal: cart.totalValue,
        cartLink: `${process.env.NEXT_PUBLIC_APP_URL}/cart`,
        reminderNumber: cart.reminderSent + 1
      });

      // Update cart
      await prisma.abandonedCart.update({
        where: { id: cart.id },
        data: {
          reminderSent: cart.reminderSent + 1,
          lastReminder: new Date()
        }
      });

      sent++;
    } catch (error) {
      console.error(`Failed to send reminder for cart ${cart.id}:`, error);
      failed++;
    }
  }

  return { processed: carts.length, sent, failed };
}

// Process price drop alerts
async function processPriceAlerts() {
  // Get all wishlist items with price notifications enabled
  const wishlistItems = await prisma.wishlistItem.findMany({
    where: { notifyPrice: true }
  });

  // Get unique product IDs
  const productIds = [...new Set(wishlistItems.map(w => w.productId))];
  
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } }
  });

  let sent = 0;
  let failed = 0;

  for (const item of wishlistItems) {
    const product = products.find(p => p.id === item.productId);
    
    if (!product) continue;

    // Check if price dropped by at least 5%
    const priceDrop = ((item.priceAtAdd - product.price) / item.priceAtAdd) * 100;
    
    if (priceDrop >= 5) {
      try {
        // Get user details
        const user = await prisma.user.findUnique({
          where: { id: item.userId },
          select: { name: true, email: true }
        });

        if (!user || !user.email) continue;

        await sendPriceDropEmail(user.email, {
          name: user.name,
          productName: product.name,
          originalPrice: item.priceAtAdd,
          newPrice: product.price,
          discount: Math.round(priceDrop),
          productImage: product.images?.[0],
          productLink: `${process.env.NEXT_PUBLIC_APP_URL}/product/${product.id}`
        });

        // Update the price at add to prevent repeated notifications
        await prisma.wishlistItem.update({
          where: { id: item.id },
          data: { priceAtAdd: product.price }
        });

        sent++;
      } catch (error) {
        console.error(`Failed to send price alert for item ${item.id}:`, error);
        failed++;
      }
    }
  }

  return { processed: wishlistItems.length, sent, failed };
}

// Process back-in-stock alerts
async function processStockAlerts() {
  // Get wishlist items for out-of-stock products with stock notifications enabled
  const wishlistItems = await prisma.wishlistItem.findMany({
    where: { notifyStock: true }
  });

  // Get unique product IDs and check stock status
  const productIds = [...new Set(wishlistItems.map(w => w.productId))];
  
  const products = await prisma.product.findMany({
    where: { 
      id: { in: productIds },
      inStock: true // Only products that are now in stock
    }
  });

  const inStockProductIds = products.map(p => p.id);
  
  let sent = 0;
  let failed = 0;

  for (const item of wishlistItems) {
    // Only notify if product is now in stock
    if (!inStockProductIds.includes(item.productId)) continue;

    const product = products.find(p => p.id === item.productId);
    
    try {
      // Get user details
      const user = await prisma.user.findUnique({
        where: { id: item.userId },
        select: { name: true, email: true }
      });

      if (!user || !user.email) continue;

      await sendBackInStockEmail(user.email, {
        name: user.name,
        productName: product.name,
        productPrice: product.price,
        productImage: product.images?.[0],
        productLink: `${process.env.NEXT_PUBLIC_APP_URL}/product/${product.id}`
      });

      // Disable stock notification to prevent repeated emails
      await prisma.wishlistItem.update({
        where: { id: item.id },
        data: { notifyStock: false }
      });

      sent++;
    } catch (error) {
      console.error(`Failed to send stock alert for item ${item.id}:`, error);
      failed++;
    }
  }

  return { processed: wishlistItems.length, sent, failed };
}

// Cleanup expired data
async function cleanupExpiredData() {
  const now = new Date();
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  // Delete expired OTP sessions
  const deletedOtps = await prisma.oTPSession.deleteMany({
    where: { expiresAt: { lt: now } }
  });

  // Delete used/expired password reset tokens
  const deletedTokens = await prisma.passwordResetToken.deleteMany({
    where: {
      OR: [
        { expiresAt: { lt: now } },
        { isUsed: true, createdAt: { lt: sevenDaysAgo } }
      ]
    }
  });

  // Delete old abandoned carts (more than 3 reminders sent OR older than 30 days)
  const deletedCarts = await prisma.abandonedCart.deleteMany({
    where: {
      OR: [
        { reminderSent: { gte: 3 } },
        { createdAt: { lt: thirtyDaysAgo } }
      ]
    }
  });

  // Delete old recently viewed records (older than 90 days)
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  const deletedViews = await prisma.recentlyViewed.deleteMany({
    where: { viewedAt: { lt: ninetyDaysAgo } }
  });

  return {
    expiredOtps: deletedOtps.count,
    expiredTokens: deletedTokens.count,
    abandonedCarts: deletedCarts.count,
    oldViews: deletedViews.count
  };
}

// GET endpoint for health check
export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    availableTasks: ['abandoned-cart', 'price-alerts', 'stock-alerts', 'cleanup', 'all'],
    timestamp: new Date().toISOString()
  });
}
