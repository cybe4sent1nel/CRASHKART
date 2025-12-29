import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendEmail } from '@/lib/email';
import { nanoid } from 'nanoid';

// POST - Create or update shared wishlist
export async function POST(request) {
  try {
    const body = await request.json();
    const { userId, name, description, items, isPublic, sharedWith } = body;

    if (!userId || !name || !items) {
      return NextResponse.json(
        { error: 'User ID, name, and items required' },
        { status: 400 }
      );
    }

    // Generate unique access code
    const accessCode = `WL${nanoid(12).toUpperCase()}`;

    const wishlist = await prisma.sharedWishlist.create({
      data: {
        userId,
        name,
        description: description || '',
        items,
        isPublic: isPublic || false,
        sharedWith: sharedWith || [],
        accessCode
      }
    });

    // Send share emails
    if (sharedWith && sharedWith.length > 0) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true }
      });

      const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL}/shared-wishlist/${accessCode}`;

      for (const email of sharedWith) {
        try {
          await sendEmail(email, {
            template: 'wishlist-shared',
            senderName: user.name,
            wishlistName: name,
            shareUrl,
            message: description || `Check out my wishlist!`
          });
        } catch (emailError) {
          console.error(`Failed to send share email to ${email}:`, emailError);
        }
      }
    }

    return NextResponse.json({
      success: true,
      wishlist: {
        ...wishlist,
        shareUrl: `${process.env.NEXT_PUBLIC_APP_URL}/shared-wishlist/${accessCode}`
      }
    });

  } catch (error) {
    console.error('Create wishlist error:', error);
    return NextResponse.json(
      { error: 'Failed to create wishlist' },
      { status: 500 }
    );
  }
}

// GET - Get shared wishlist by access code
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const accessCode = searchParams.get('code');
    const userId = searchParams.get('userId');

    if (accessCode) {
      // Get wishlist by access code
      const wishlist = await prisma.sharedWishlist.findUnique({
        where: { accessCode }
      });

      if (!wishlist) {
        return NextResponse.json(
          { error: 'Wishlist not found' },
          { status: 404 }
        );
      }

      // Check if public or user has access
      if (!wishlist.isPublic && !wishlist.sharedWith.includes('public')) {
        // Could add more access control here
      }

      // Get product details
      const products = await prisma.product.findMany({
        where: {
          id: { in: wishlist.items }
        },
        include: {
          store: { select: { name: true } }
        }
      });

      // Increment view count
      await prisma.sharedWishlist.update({
        where: { id: wishlist.id },
        data: { viewCount: { increment: 1 } }
      });

      return NextResponse.json({
        success: true,
        wishlist: {
          ...wishlist,
          products,
          itemCount: products.length,
          totalValue: products.reduce((sum, p) => sum + p.price, 0)
        }
      });
    }

    if (userId) {
      // Get user's wishlists
      const wishlists = await prisma.sharedWishlist.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' }
      });

      // Get product counts
      const wislistsWithCounts = await Promise.all(
        wishlists.map(async (wl) => {
          const products = await prisma.product.findMany({
            where: { id: { in: wl.items } },
            select: { id: true, price: true }
          });

          return {
            ...wl,
            itemCount: wl.items.length,
            totalValue: products.reduce((sum, p) => sum + p.price, 0),
            shareUrl: `${process.env.NEXT_PUBLIC_APP_URL}/shared-wishlist/${wl.accessCode}`
          };
        })
      );

      return NextResponse.json({
        success: true,
        wishlists: wislistsWithCounts
      });
    }

    return NextResponse.json(
      { error: 'Access code or user ID required' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Get wishlist error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch wishlist' },
      { status: 500 }
    );
  }
}

// PATCH - Update wishlist
export async function PATCH(request) {
  try {
    const body = await request.json();
    const { wishlistId, name, description, items, isPublic } = body;

    if (!wishlistId) {
      return NextResponse.json({ error: 'Wishlist ID required' }, { status: 400 });
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (description) updateData.description = description;
    if (items) updateData.items = items;
    if (isPublic !== undefined) updateData.isPublic = isPublic;

    const wishlist = await prisma.sharedWishlist.update({
      where: { id: wishlistId },
      data: updateData
    });

    return NextResponse.json({
      success: true,
      wishlist
    });

  } catch (error) {
    console.error('Update wishlist error:', error);
    return NextResponse.json(
      { error: 'Failed to update wishlist' },
      { status: 500 }
    );
  }
}

// DELETE - Delete wishlist
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const wishlistId = searchParams.get('id');

    if (!wishlistId) {
      return NextResponse.json({ error: 'Wishlist ID required' }, { status: 400 });
    }

    await prisma.sharedWishlist.delete({
      where: { id: wishlistId }
    });

    return NextResponse.json({
      success: true,
      message: 'Wishlist deleted'
    });

  } catch (error) {
    console.error('Delete wishlist error:', error);
    return NextResponse.json(
      { error: 'Failed to delete wishlist' },
      { status: 500 }
    );
  }
}
