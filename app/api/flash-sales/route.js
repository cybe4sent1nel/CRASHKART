import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// POST - Create flash sale (admin only)
export async function POST(request) {
  try {
    const body = await request.json();
    const { title, description, products, discount, maxQuantity, startTime, endTime, bannerImage } = body;

    if (!title || !products || !discount || !maxQuantity || !startTime || !endTime) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate discount
    if (discount < 0 || discount > 100) {
      return NextResponse.json({ error: 'Discount must be between 0-100' }, { status: 400 });
    }

    // Create flash sale
    const flashSale = await prisma.flashSale.create({
      data: {
        title,
        description,
        products,
        discount,
        maxQuantity,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        bannerImage,
        isActive: true
      }
    });

    return NextResponse.json({
      success: true,
      flashSale,
      message: 'Flash sale created successfully'
    });

  } catch (error) {
    console.error('Create flash sale error:', error);
    return NextResponse.json({ error: 'Failed to create flash sale' }, { status: 500 });
  }
}

// GET - Get flash sales
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'active', 'upcoming', 'past', 'all'
    const productId = searchParams.get('productId');
    const saleId = searchParams.get('saleId');

    const now = new Date();

    if (saleId) {
      // Get specific flash sale
      const sale = await prisma.flashSale.findUnique({
        where: { id: saleId }
      });

      if (!sale) {
        return NextResponse.json({ error: 'Flash sale not found' }, { status: 404 });
      }

      // Get product details for sale
      const saleProducts = await prisma.product.findMany({
        where: {
          id: { in: sale.products }
        },
        select: {
          id: true,
          name: true,
          price: true,
          mrp: true,
          images: true,
          store: { select: { name: true } }
        }
      });

      // Calculate discounted prices
      const productsWithDiscount = saleProducts.map(p => ({
        ...p,
        originalPrice: p.price,
        salePrice: p.price * (1 - sale.discount / 100),
        discount: sale.discount,
        savings: p.price * (sale.discount / 100)
      }));

      return NextResponse.json({
        success: true,
        sale: {
          ...sale,
          products: productsWithDiscount
        }
      });
    }

    // Get flash sales by type
    let where = {};

    switch (type) {
      case 'active':
        where = {
          isActive: true,
          startTime: { lte: now },
          endTime: { gte: now }
        };
        break;
      case 'upcoming':
        where = {
          isActive: true,
          startTime: { gt: now }
        };
        break;
      case 'past':
        where = {
          endTime: { lt: now }
        };
        break;
      default:
        where = { isActive: true };
    }

    let sales = await prisma.flashSale.findMany({
      where,
      orderBy: [
        { startTime: 'asc' },
        { createdAt: 'desc' }
      ]
    });

    // If productId specified, filter sales containing that product
    if (productId) {
      sales = sales.filter(sale => sale.products.includes(productId));
    }

    // Enrich with product details
    const enrichedSales = await Promise.all(
      sales.map(async (sale) => {
        const products = await prisma.product.findMany({
          where: { id: { in: sale.products } },
          select: {
            id: true,
            name: true,
            price: true,
            images: true,
            store: { select: { name: true } }
          },
          take: 5 // Show first 5 products
        });

        const productsWithDiscount = products.map(p => ({
          ...p,
          salePrice: p.price * (1 - sale.discount / 100),
          discount: sale.discount
        }));

        const timeRemaining = Math.max(0, sale.endTime - now);
        const progress = (sale.sold / (sale.maxQuantity * sale.products.length)) * 100;

        return {
          ...sale,
          products: productsWithDiscount,
          timeRemaining: {
            total: timeRemaining,
            hours: Math.floor(timeRemaining / (1000 * 60 * 60)),
            minutes: Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60)),
            seconds: Math.floor((timeRemaining % (1000 * 60)) / 1000)
          },
          progress,
          soldPercentage: Math.min(100, progress),
          isLive: sale.startTime <= now && sale.endTime >= now,
          isEnded: sale.endTime < now
        };
      })
    );

    return NextResponse.json({
      success: true,
      flashSales: enrichedSales,
      count: enrichedSales.length
    });

  } catch (error) {
    console.error('Get flash sales error:', error);
    return NextResponse.json({ error: 'Failed to fetch flash sales' }, { status: 500 });
  }
}

// PATCH - Update flash sale
export async function PATCH(request) {
  try {
    const body = await request.json();
    const { saleId, status } = body;

    if (!saleId) {
      return NextResponse.json({ error: 'Sale ID required' }, { status: 400 });
    }

    const updated = await prisma.flashSale.update({
      where: { id: saleId },
      data: {
        isActive: status,
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      message: `Flash sale ${status ? 'activated' : 'deactivated'}`,
      flashSale: updated
    });

  } catch (error) {
    console.error('Update flash sale error:', error);
    return NextResponse.json({ error: 'Failed to update flash sale' }, { status: 500 });
  }
}

// DELETE - Delete flash sale
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const saleId = searchParams.get('saleId');

    if (!saleId) {
      return NextResponse.json({ error: 'Sale ID required' }, { status: 400 });
    }

    await prisma.flashSale.delete({
      where: { id: saleId }
    });

    return NextResponse.json({
      success: true,
      message: 'Flash sale deleted'
    });

  } catch (error) {
    console.error('Delete flash sale error:', error);
    return NextResponse.json({ error: 'Failed to delete flash sale' }, { status: 500 });
  }
}
