import { NextResponse } from 'next/server';
import { sendOrderStatusEmail } from '@/lib/email.js';

export async function POST(request) {
  try {
    const { email, name = 'Test Customer' } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Sample order data
    const testOrderData = {
      orderId: '694bb428e1c5109f4c13d890',
      orderStatus: 'PROCESSING',
      items: [
        {
          name: 'Premium Wireless Headphones',
          quantity: 1,
          price: 2499,
          image: 'https://via.placeholder.com/50'
        },
        {
          name: 'USB-C Cable',
          quantity: 2,
          price: 299,
          image: 'https://via.placeholder.com/50'
        }
      ],
      total: 3097,
      address: {
        fullName: 'John Doe',
        street: '123 Main Street',
        city: 'Mumbai',
        state: 'Maharashtra',
        zipCode: '400001',
        country: 'India',
        phone: '+91 98765 43210'
      },
      trackingLink: `${process.env.NEXT_PUBLIC_APP_URL}/track-order/694bb428e1c5109f4c13d890`
    };

    // Send email
    const result = await sendOrderStatusEmail(email, testOrderData, name);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Test email sent successfully to ${email}`,
        messageId: result.messageId,
        preview: {
          status: 'PROCESSING',
          orderId: testOrderData.orderId,
          customerName: name
        }
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          message: 'Failed to send test email'
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Test email error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Test Order Email Endpoint',
    usage: {
      method: 'POST',
      body: {
        email: 'customer@example.com',
        name: 'John Doe (optional)'
      },
      example: '/api/test-order-email',
      testStates: [
        'ORDER_PLACED',
        'PROCESSING',
        'SHIPPED',
        'DELIVERED',
        'PAYMENT_PENDING'
      ],
      note: 'Modify orderStatus in the code to test different states'
    }
  });
}
