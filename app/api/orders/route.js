import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { sendOrderConfirmationWithInvoice } from '@/lib/email';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

/**
 * Create a new order and send confirmation email
 */
export async function POST(request) {
  try {
    const {
      userId,
      storeId,
      addressId,
      items,
      total,
      paymentMethod,
      isPaid,
      coupon,
    } = await request.json();

    // Validate required fields
    if (!userId || !storeId || !addressId || !items || !total || !paymentMethod) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get user and address details
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    const address = await prisma.address.findUnique({
      where: { id: addressId },
    });

    if (!user || !address) {
      return NextResponse.json(
        { error: 'User or address not found' },
        { status: 404 }
      );
    }

    // Generate unique shipment ID (only for multi-product orders)
    const generateShipmentId = (orderId, index) => {
      const timestamp = Date.now().toString(36).toUpperCase();
      return `SHP-${timestamp}-${index + 1}`.substring(0, 20);
    };

    // Determine if this is a multi-product order
    const isMultiProductOrder = items.length > 1;

    // Create order with items
    const order = await prisma.order.create({
      data: {
        userId,
        storeId,
        addressId,
        total,
        status: 'ORDER_PLACED', // Explicitly set order status
        paymentMethod,
        isPaid: isPaid || false,
        isCouponUsed: !!coupon,
        coupon: coupon || {},
        createdAt: new Date(), // Explicitly set createdAt
        updatedAt: new Date(), // Explicitly set updatedAt
        orderItems: {
          create: items.map((item, idx) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
            shipmentId: isMultiProductOrder ? generateShipmentId(userId, idx) : null, // ShipmentID only for multi-product orders
            status: 'ORDER_PLACED', // Initial status
            estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
            createdAt: new Date(), // Explicitly set createdAt for order items
            updatedAt: new Date(), // Explicitly set updatedAt for order items
          })),
        },
      },
      include: {
        orderItems: {
          include: {
            product: true,
          },
        },
        address: true,
      },
    });

    // Update product inventory after order is created
    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
      });

      if (product) {
        const newQuantity = Math.max(0, product.quantity - item.quantity);
        const isInStock = newQuantity > 0;

        await prisma.product.update({
          where: { id: item.productId },
          data: {
            quantity: newQuantity,
            inStock: isInStock,
          },
        });

        console.log(`[Order API] Updated product ${item.productId}: quantity ${product.quantity} -> ${newQuantity}, inStock: ${isInStock}`);
      }
    }

    // Prepare email data with invoice (includes shipment info)
    const emailData = {
      orderId: order.id,
      items: order.orderItems.map((item) => ({
        name: item.product.name,
        quantity: item.quantity,
        price: item.price,
        image: item.product.image,
        shipmentId: item.shipmentId, // Include shipment ID
      })),
      subtotal: order.total,
      discount: 0, // Add discount if coupon was applied
      crashCashApplied: 0, // Add if CrashCash was used
      total: order.total,
      address: {
        name: address.name,
        street: address.street,
        city: address.city,
        state: address.state,
        zipCode: address.zip,
        country: address.country,
        phone: address.phone,
        email: user.email,
      },
      paymentMethod: paymentMethod,
      customerName: user.name,
      customerEmail: user.email,
      customerPhone: user.phone || address.phone,
      estimatedDelivery: '3-5 business days',
      currency: process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '₹'
    };

    // Send order confirmation email with invoice
    try {
      // Generate invoice attachment (dynamic import to avoid bundling pdfkit/fontkit)
      try {
        const { getInvoiceAttachment } = await import('@/lib/invoiceGenerator')
        const invoiceAttachment = await getInvoiceAttachment(emailData)
        console.log('Invoice generated successfully for order:', order.id)

        // Send confirmation email with invoice
        await sendOrderConfirmationWithInvoice(user.email, emailData, invoiceAttachment, user.name || order.address?.name || user.email.split('@')[0] || 'Customer')
        console.log('Order confirmation email sent successfully to:', user.email)
      } catch (invErr) {
        console.warn('Could not generate/send PDF invoice (fallback to email without PDF):', invErr?.message || invErr)
        try {
          await sendOrderConfirmationWithInvoice(user.email, emailData, null, user.name || order.address?.name || user.email.split('@')[0] || 'Customer')
          console.log('Order confirmation email sent without invoice to:', user.email)
        } catch (fallbackErr) {
          console.error('Failed to send order confirmation email without invoice:', fallbackErr)
        }
      }
    } catch (emailError) {
      console.error('Email/Invoice error:', emailError)
      // Don't fail the order creation if email fails
    }

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        total: order.total,
        status: order.status,
        createdAt: order.createdAt,
      },
    });
  } catch (error) {
    console.error('Order creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
}

/**
 * Get user orders
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const orders = await prisma.order.findMany({
      where: { userId },
      include: {
        orderItems: {
          include: {
            product: true,
          },
        },
        address: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      orders,
    });
  } catch (error) {
    console.error('Get orders error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}
