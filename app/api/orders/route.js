import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { sendOrderConfirmationWithInvoice } from '@/lib/email';
import { generateInvoicePDF } from '@/lib/invoiceGenerator';

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

    // Generate unique shipment ID
    const generateShipmentId = (orderId, index) => {
      const timestamp = Date.now().toString(36).toUpperCase();
      return `SHP-${timestamp}-${index + 1}`.substring(0, 20);
    };

    // Create order with items
    const order = await prisma.order.create({
      data: {
        userId,
        storeId,
        addressId,
        total,
        paymentMethod,
        isPaid: isPaid || false,
        isCouponUsed: !!coupon,
        coupon: coupon || {},
        orderItems: {
          create: items.map((item, idx) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
            shipmentId: generateShipmentId(userId, idx), // Unique shipment ID
            status: 'ORDER_PLACED', // Initial status
            estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
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
    };

    // Generate invoice PDF
    try {
      const invoicePDF = await generateInvoicePDF(emailData);
      
      // Send confirmation email with invoice
      await sendOrderConfirmationWithInvoice(user.email, emailData, invoicePDF, user.name);
    } catch (invoiceError) {
      console.error('Invoice generation error:', invoiceError);
      // Still send email without invoice if generation fails
      const { sendOrderConfirmationEmail } = await import('@/lib/email');
      await sendOrderConfirmationEmail(user.email, emailData, user.name);
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
