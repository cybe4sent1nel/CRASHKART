import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import nodemailer from 'nodemailer';

/**
 * Notify Me API
 * Allows users to get notified when out-of-stock products are back in stock
 */

// GET - Check if user is already notified
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const productId = searchParams.get('productId');

    if (!userId || !productId) {
      return NextResponse.json({ error: 'User ID and Product ID required' }, { status: 400 });
    }

    // Check if notification already exists
    const existingNotification = await prisma.wishlistItem.findUnique({
      where: {
        userId_productId: {
          userId,
          productId
        }
      }
    });

    return NextResponse.json({
      success: true,
      isNotified: !!existingNotification
    });
  } catch (error) {
    console.error('Error checking notification:', error);
    return NextResponse.json({ error: 'Failed to check notification' }, { status: 500 });
  }
}

// POST - Create notification request for out-of-stock product
export async function POST(request) {
  try {
    const body = await request.json();
    const { userId, productId, userEmail, userName } = body;

    if (!productId || !userEmail) {
      return NextResponse.json({ error: 'Product ID and email required' }, { status: 400 });
    }

    // Get product details
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { name: true, price: true, images: true }
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Check if already notified
    if (userId) {
      const existing = await prisma.wishlistItem.findUnique({
        where: {
          userId_productId: {
            userId,
            productId
          }
        }
      });

      if (existing) {
        return NextResponse.json({ 
          success: true, 
          message: 'Already notified for this product',
          alreadyExists: true 
        });
      }

      // Add to wishlist for notifications
      await prisma.wishlistItem.create({
        data: {
          userId,
          productId,
          notifyStock: true,
          priceAtAdd: product.price
        }
      });
    }

    // Send confirmation email
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      }
    });

    const emailContent = `
      <h2>Notification Confirmed!</h2>
      <p>Hi ${userName || 'Customer'},</p>
      <p>We'll notify you as soon as <strong>${product.name}</strong> is back in stock!</p>
      <p>Current price: ₹${product.price}</p>
      <p>We appreciate your interest and will email you the moment it's available.</p>
      <br/>
      <p>Best regards,<br/>CrashKart Team</p>
    `;

    await transporter.sendMail({
      from: process.env.SMTP_FROM_EMAIL,
      to: userEmail,
      subject: `✅ Notification Set - ${product.name}`,
      html: emailContent
    });

    return NextResponse.json({
      success: true,
      message: `We'll notify you when ${product.name} is back in stock!`
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json(
      { error: 'Failed to create notification', details: error.message },
      { status: 500 }
    );
  }
}

// PUT - Send notification emails when product is back in stock
export async function PUT(request) {
  try {
    const body = await request.json();
    const { productId } = body;

    if (!productId) {
      return NextResponse.json({ error: 'Product ID required' }, { status: 400 });
    }

    // Get product details
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { name: true, price: true, images: true }
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Get all users waiting for this product
    const waitingUsers = await prisma.wishlistItem.findMany({
      where: {
        productId: productId,
        notifyStock: true
      },
      include: {
        user: { select: { email: true, name: true } }
      }
    });

    if (waitingUsers.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No users waiting for this product'
      });
    }

    // Send emails to all waiting users
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      }
    });

    let emailsSent = 0;

    for (const item of waitingUsers) {
      try {
        const emailContent = `
          <h2>🎉 ${product.name} is Back in Stock!</h2>
          <p>Hi ${item.user?.name || 'Customer'},</p>
          <p>Great news! The product you were waiting for is now available:</p>
          <p><strong>${product.name}</strong></p>
          <p>Price: ₹${product.price}</p>
          <p>Limited quantity available - Order now before it's gone!</p>
          <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/store" style="background-color: #dc2626; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Shop Now</a></p>
          <br/>
          <p>Best regards,<br/>CrashKart Team</p>
        `;

        await transporter.sendMail({
          from: process.env.SMTP_FROM_EMAIL,
          to: item.user?.email,
          subject: `🎉 ${product.name} is Back in Stock!`,
          html: emailContent
        });

        // Mark as notified
        await prisma.wishlistItem.update({
          where: { id: item.id },
          data: { notifyStock: false }
        });

        emailsSent++;
      } catch (emailError) {
        console.error(`Failed to send email to ${item.user?.email}:`, emailError);
      }
    }

    console.log(`✓ Back in stock notification sent to ${emailsSent} users for ${product.name}`);

    return NextResponse.json({
      success: true,
      message: `Notification sent to ${emailsSent} users`,
      emailsSent
    });
  } catch (error) {
    console.error('Error sending notifications:', error);
    return NextResponse.json(
      { error: 'Failed to send notifications', details: error.message },
      { status: 500 }
    );
  }
}
