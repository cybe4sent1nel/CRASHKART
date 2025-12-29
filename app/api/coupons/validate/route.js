import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const { code, userId } = await request.json();

    if (!code || !userId) {
      return NextResponse.json(
        { error: 'Code and userId are required' },
        { status: 400 }
      );
    }

    // Find the coupon
    const coupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!coupon) {
      return NextResponse.json(
        { error: 'Invalid coupon code' },
        { status: 404 }
      );
    }

    // Check if coupon is expired
    if (new Date() > new Date(coupon.expiresAt)) {
      return NextResponse.json(
        { error: 'This coupon has expired' },
        { status: 400 }
      );
    }

    // Check if user is eligible
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { buyerOrders: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if coupon is for new users only
    if (coupon.forNewUser && user.buyerOrders.length > 0) {
      return NextResponse.json(
        { error: 'This coupon is only for new users' },
        { status: 400 }
      );
    }

    // Check if coupon is for members only
    if (coupon.forMember) {
      // Add your membership logic here
      // For now, we'll allow all users
    }

    return NextResponse.json({
      success: true,
      coupon: {
        code: coupon.code,
        description: coupon.description,
        discount: coupon.discount,
        discountType: coupon.discount > 100 ? 'amount' : 'percentage',
      },
    });
  } catch (error) {
    console.error('Coupon validation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
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
