import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// POST - Create or update SEO meta tags
export async function POST(request) {
  try {
    const body = await request.json();
    const {
      productId,
      categorySlug,
      title,
      description,
      keywords,
      ogImage,
      ogTitle,
      ogDescription,
      twitterCard,
      canonical
    } = body;

    if (!title || !description) {
      return NextResponse.json(
        { error: 'Title and description required' },
        { status: 400 }
      );
    }

    if (!productId && !categorySlug) {
      return NextResponse.json(
        { error: 'Product ID or category slug required' },
        { status: 400 }
      );
    }

    // Check if exists
    const existing = await prisma.sEOMeta.findFirst({
      where: {
        OR: [
          { productId: productId || null },
          { categorySlug: categorySlug || null }
        ]
      }
    });

    let meta;
    if (existing) {
      meta = await prisma.sEOMeta.update({
        where: { id: existing.id },
        data: {
          title,
          description,
          keywords: keywords || [],
          ogImage,
          ogTitle: ogTitle || title,
          ogDescription: ogDescription || description,
          twitterCard,
          canonical
        }
      });
    } else {
      meta = await prisma.sEOMeta.create({
        data: {
          productId: productId || null,
          categorySlug: categorySlug || null,
          title,
          description,
          keywords: keywords || [],
          ogImage,
          ogTitle: ogTitle || title,
          ogDescription: ogDescription || description,
          twitterCard,
          canonical
        }
      });
    }

    return NextResponse.json({
      success: true,
      meta
    });

  } catch (error) {
    console.error('Create SEO meta error:', error);
    return NextResponse.json(
      { error: 'Failed to create SEO meta' },
      { status: 500 }
    );
  }
}

// GET - Get SEO meta tags
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const categorySlug = searchParams.get('categorySlug');

    if (!productId && !categorySlug) {
      return NextResponse.json(
        { error: 'Product ID or category slug required' },
        { status: 400 }
      );
    }

    const where = {};
    if (productId) where.productId = productId;
    if (categorySlug) where.categorySlug = categorySlug;

    const meta = await prisma.sEOMeta.findFirst({
      where
    });

    if (!meta) {
      // Generate default SEO if not found
      let defaultMeta = {
        title: 'Product',
        description: 'Check out this amazing product on CRASHKART',
        keywords: [],
        ogImage: null,
        ogTitle: 'Product',
        ogDescription: 'Check out this amazing product',
        twitterCard: 'summary'
      };

      if (productId) {
        const product = await prisma.product.findUnique({
          where: { id: productId },
          select: { name: true, description: true, images: true, price: true }
        });

        if (product) {
          defaultMeta = {
            title: `${product.name} | CRASHKART`,
            description: product.description.substring(0, 160),
            keywords: [product.name, 'buy online'],
            ogImage: product.images[0],
            ogTitle: product.name,
            ogDescription: `${product.name} at ₹${product.price}`,
            twitterCard: 'summary_large_image'
          };
        }
      }

      return NextResponse.json({
        success: true,
        meta: defaultMeta,
        isDefault: true
      });
    }

    return NextResponse.json({
      success: true,
      meta
    });

  } catch (error) {
    console.error('Get SEO meta error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch SEO meta' },
      { status: 500 }
    );
  }
}

// DELETE - Delete SEO meta
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const metaId = searchParams.get('id');

    if (!metaId) {
      return NextResponse.json({ error: 'Meta ID required' }, { status: 400 });
    }

    await prisma.sEOMeta.delete({
      where: { id: metaId }
    });

    return NextResponse.json({
      success: true,
      message: 'SEO meta deleted'
    });

  } catch (error) {
    console.error('Delete SEO meta error:', error);
    return NextResponse.json(
      { error: 'Failed to delete SEO meta' },
      { status: 500 }
    );
  }
}
