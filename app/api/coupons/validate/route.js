import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const { code, subtotal = 0, productIds = [], userId } = await request.json();

    if (!code) {
      return NextResponse.json({ valid: false, message: 'Coupon code is required' }, { status: 400 })
    }

    // First, try to find a normal coupon
    const coupon = await prisma.coupon.findUnique({ where: { code: code.toUpperCase() } })
    if (!coupon || !coupon.isActive) {
      // If no coupon found, check scratch cards that may have rewardCode matching
      const scratch = await prisma.scratchCard.findFirst({ where: { rewardCode: code.toUpperCase(), isUsed: false, expiresAt: { gt: new Date() } } })
      if (scratch) {
        // Treat scratch reward as a temporary coupon-like discount
        let discountAmount = 0
        if (scratch.rewardType === 'discount') {
          // rewardValue might be percentage or fixed; assume percentage if <=100
          if (scratch.rewardValue <= 100) {
            discountAmount = (Number(subtotal) || 0) * Number(scratch.rewardValue) / 100
          } else {
            discountAmount = Number(scratch.rewardValue) || 0
          }
        } else if (scratch.rewardType === 'cashback' || scratch.rewardType === 'voucher') {
          discountAmount = Number(scratch.rewardValue) || 0
        } else if (scratch.rewardType === 'free-shipping') {
          discountAmount = 0
        }

        discountAmount = Math.max(0, Math.min(discountAmount, Number(subtotal) || 0))

        return NextResponse.json({ valid: true, discount: discountAmount, coupon: { code: scratch.rewardCode, couponType: scratch.rewardType, source: 'scratch' } })
      }

      return NextResponse.json({ valid: false, message: 'Invalid coupon code' }, { status: 404 })
    }

    // Check expiry
    if (coupon.expiresAt && new Date() > new Date(coupon.expiresAt)) {
      return NextResponse.json({ valid: false, message: 'This coupon has expired' }, { status: 400 })
    }

    // Check minimum order value
    if (coupon.minOrderValue && subtotal < coupon.minOrderValue) {
      return NextResponse.json({ valid: false, message: `Minimum order value of ₹${coupon.minOrderValue} required for this coupon` }, { status: 400 })
    }

    // Check applicable products
    if (coupon.applicableProducts && coupon.applicableProducts.length > 0) {
      const intersection = (productIds || []).some(id => coupon.applicableProducts.includes(id))
      if (!intersection) {
        return NextResponse.json({ valid: false, message: 'This coupon does not apply to the selected products' }, { status: 400 })
      }
    }

    // Check overall usage limit
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return NextResponse.json({ valid: false, message: 'This coupon has reached its usage limit' }, { status: 400 })
    }

    // If perUserLimit is set, and userId provided, check usage by this user
    if (coupon.perUserLimit && userId) {
      try {
        const userOrders = await prisma.order.findMany({ where: { userId } })
        const usedByUser = userOrders.filter(o => o.isCouponUsed && o.coupon && JSON.stringify(o.coupon || {}).toUpperCase().includes(code.toUpperCase())).length
        if (usedByUser >= coupon.perUserLimit) {
          return NextResponse.json({ valid: false, message: 'You have already used this coupon the maximum allowed times' }, { status: 400 })
        }
      } catch (e) {
        console.error('Error checking per-user coupon usage:', e)
      }
    }

    // Compute discount amount
    let discountAmount = 0
    const cType = coupon.couponType || 'percentage'
    if (cType === 'percentage') {
      discountAmount = (Number(subtotal) || 0) * (Number(coupon.discount) || 0) / 100
      if (coupon.maxDiscount) discountAmount = Math.min(discountAmount, Number(coupon.maxDiscount))
    } else if (cType === 'flat') {
      discountAmount = Number(coupon.discount) || 0
    } else if (cType === 'freeDelivery') {
      discountAmount = 0
    }

    // Ensure discount is non-negative and not more than subtotal
    discountAmount = Math.max(0, Math.min(discountAmount, Number(subtotal) || 0))

    return NextResponse.json({ valid: true, discount: discountAmount, coupon: {
      code: coupon.code,
      couponType: cType,
      discount: coupon.discount,
      minOrderValue: coupon.minOrderValue || null,
      maxDiscount: coupon.maxDiscount || null,
    } })
  } catch (error) {
    console.error('Coupon validation error:', error)
    return NextResponse.json({ valid: false, message: 'Internal server error' }, { status: 500 })
  }
}

// Create a new coupon (admin only)
export async function PUT(request) {
  try {
    const {
      code,
      description,
      discount,
      forNewUser,
      forMember,
      isPublic,
      expiresAt,
    } = await request.json();

    if (!code || !description || !discount || !expiresAt) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if coupon already exists
    const existing = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Coupon code already exists' },
        { status: 400 }
      );
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: code.toUpperCase(),
        description,
        discount,
        forNewUser: forNewUser || false,
        forMember: forMember || false,
        isPublic: isPublic || false,
        expiresAt: new Date(expiresAt),
      },
    });

    return NextResponse.json({
      success: true,
      coupon,
    });
  } catch (error) {
    console.error('Coupon creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
