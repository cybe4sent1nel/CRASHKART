import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET - List all coupons
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status'); // 'active', 'expired', 'all'
    const isPublic = searchParams.get('isPublic');

    const skip = (page - 1) * limit;
    const now = new Date();

    // Build where clause
    const where = {};

    if (status === 'active') {
      where.expiresAt = { gt: now };
    } else if (status === 'expired') {
      where.expiresAt = { lt: now };
    }

    if (isPublic === 'true') {
      where.isPublic = true;
    } else if (isPublic === 'false') {
      where.isPublic = false;
    }

    const [coupons, total] = await Promise.all([
      prisma.coupon.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.coupon.count({ where })
    ]);

    // Enhance coupons with status
    const enhancedCoupons = coupons.map(coupon => ({
      ...coupon,
      status: new Date(coupon.expiresAt) > now ? 'active' : 'expired',
      daysRemaining: Math.max(0, Math.ceil((new Date(coupon.expiresAt) - now) / (1000 * 60 * 60 * 24)))
    }));

    // Get usage statistics (count orders with each coupon)
    const couponCodes = coupons.map(c => c.code);
    const usageStats = await prisma.order.findMany({
      where: {
        isCouponUsed: true
      },
      select: {
        coupon: true
      }
    });

    // Count usage per coupon
    const usageMap = new Map();
    usageStats.forEach(order => {
      const couponData = order.coupon;
      if (couponData && typeof couponData === 'object') {
        const code = couponData.code;
        if (code) {
          usageMap.set(code, (usageMap.get(code) || 0) + 1);
        }
      }
    });

    const couponsWithUsage = enhancedCoupons.map(coupon => ({
      ...coupon,
      usageCount: usageMap.get(coupon.code) || 0
    }));

    return NextResponse.json({
      success: true,
      coupons: couponsWithUsage,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      stats: {
        total,
        active: coupons.filter(c => new Date(c.expiresAt) > now).length,
        expired: coupons.filter(c => new Date(c.expiresAt) <= now).length
      }
    });

  } catch (error) {
    console.error('Error fetching coupons:', error);
    return NextResponse.json({ error: 'Failed to fetch coupons' }, { status: 500 });
  }
}

// POST - Create new coupon
export async function POST(request) {
  try {
    const body = await request.json();
    const {
      code,
      description,
      discount,
      forNewUser = false,
      forMember = false,
      isPublic = true,
      expiresAt
    } = body;

    // Validate required fields
    if (!code || !description || discount === undefined || !expiresAt) {
      return NextResponse.json({ 
        error: 'Code, description, discount, and expiry date are required' 
      }, { status: 400 });
    }

    // Check for duplicate code
    const existing = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() }
    });

    if (existing) {
      return NextResponse.json({ error: 'Coupon code already exists' }, { status: 400 });
    }

    // Validate discount
    if (discount < 0 || discount > 100) {
      return NextResponse.json({ error: 'Discount must be between 0 and 100' }, { status: 400 });
    }

    // Create coupon
    const coupon = await prisma.coupon.create({
      data: {
        code: code.toUpperCase(),
        description,
        discount: parseFloat(discount),
        forNewUser,
        forMember,
        isPublic,
        expiresAt: new Date(expiresAt)
      }
    });

    return NextResponse.json({
      success: true,
      coupon,
      message: 'Coupon created successfully'
    });

  } catch (error) {
    console.error('Error creating coupon:', error);
    return NextResponse.json({ error: 'Failed to create coupon' }, { status: 500 });
  }
}

// PUT - Update coupon
export async function PUT(request) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: 'Coupon ID required' }, { status: 400 });
    }

    // Check if coupon exists
    const existing = await prisma.coupon.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Coupon not found' }, { status: 404 });
    }

    // If updating code, check for duplicates
    if (updateData.code && updateData.code !== existing.code) {
      const duplicate = await prisma.coupon.findUnique({
        where: { code: updateData.code.toUpperCase() }
      });
      if (duplicate) {
        return NextResponse.json({ error: 'Coupon code already exists' }, { status: 400 });
      }
      updateData.code = updateData.code.toUpperCase();
    }

    // Process expiry date
    if (updateData.expiresAt) {
      updateData.expiresAt = new Date(updateData.expiresAt);
    }

    const coupon = await prisma.coupon.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json({
      success: true,
      coupon,
      message: 'Coupon updated successfully'
    });

  } catch (error) {
    console.error('Error updating coupon:', error);
    return NextResponse.json({ error: 'Failed to update coupon' }, { status: 500 });
  }
}

// DELETE - Delete coupon
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Coupon ID required' }, { status: 400 });
    }

    await prisma.coupon.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      message: 'Coupon deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting coupon:', error);
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Coupon not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to delete coupon' }, { status: 500 });
  }
}
