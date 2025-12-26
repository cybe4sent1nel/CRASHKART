import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET - List all customers with search, filter, pagination
export async function GET(request) {
  console.log('[GET /api/admin/customers] Request received');
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const hasOrders = searchParams.get('hasOrders'); // 'true' or 'false'

    console.log('[GET /api/admin/customers] Params:', { page, limit, search, sortBy, sortOrder, hasOrders });

    const skip = (page - 1) * limit;

    // Build where clause
    const where = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } }
      ];
    }

    console.log('[GET /api/admin/customers] Fetching customers with where clause:', where);

    // Get customers with their addresses
     const customers = await prisma.user.findMany({
       where,
       select: {
         id: true,
         name: true,
         email: true,
         phone: true,
         createdAt: true,
         Address: {
           where: { isDefault: true }, // Get default address
           take: 1,
           select: {
             street: true,
             city: true,
             state: true,
             zip: true,
             country: true
           }
         },
         _count: {
           select: {
             buyerOrders: true
           }
         }
       },
       orderBy: {
         [sortBy]: sortOrder === 'asc' ? 'asc' : 'desc'
       },
       skip,
       take: limit
     });

    console.log('[GET /api/admin/customers] Found customers:', customers.length);

    // Get order totals for each customer
    const customerIds = customers.map(c => c.id);
    const orderTotals = await prisma.order.groupBy({
      by: ['userId'],
      where: { userId: { in: customerIds } },
      _sum: { total: true },
      _count: { userId: true }
    });

    const orderTotalsMap = new Map(
      orderTotals.map(ot => [ot.userId, { total: ot._sum.total, count: ot._count.userId }])
    );

    // Enhance customer data with formatted addresses
     let enhancedCustomers = customers.map(customer => {
       // Format address from the first default address
       let address = 'N/A';
       if (customer.Address && customer.Address.length > 0) {
         const addr = customer.Address[0];
         address = `${addr.street}, ${addr.city}, ${addr.state} ${addr.zip}`;
       }
       
       return {
         id: customer.id,
         name: customer.name,
         email: customer.email,
         phone: customer.phone,
         createdAt: customer.createdAt,
         address: address,
         totalOrders: customer._count.buyerOrders,
         totalSpent: orderTotalsMap.get(customer.id)?.total || 0
       }
     });

    // Filter by hasOrders if specified
    if (hasOrders === 'true') {
      enhancedCustomers = enhancedCustomers.filter(c => c.totalOrders > 0);
    } else if (hasOrders === 'false') {
      enhancedCustomers = enhancedCustomers.filter(c => c.totalOrders === 0);
    }

    // Get total count
    const total = await prisma.user.count({ where });

    return NextResponse.json({
      success: true,
      customers: enhancedCustomers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('[GET /api/admin/customers] Error:', {
      message: error.message,
      code: error.code,
      meta: error.meta,
      stack: error.stack
    });
    return NextResponse.json({ 
      success: false,
      error: 'Failed to fetch customers',
      details: error.message,
      code: error.code
    }, { status: 500 });
  }
}

// POST - Send bulk email to customers
export async function POST(request) {
  try {
    const body = await request.json();
    const { action, customerIds, emailData } = body;

    if (action === 'send-email') {
      // Get customer emails
      const customers = await prisma.user.findMany({
        where: { 
          id: { in: customerIds },
          email: { not: null }
        },
        select: { name: true, email: true }
      });

      // This would integrate with the email service
      // For now, return the list of recipients
      return NextResponse.json({
        success: true,
        message: 'Email queued for sending',
        recipients: customers.length,
        details: {
          subject: emailData.subject,
          recipientEmails: customers.map(c => c.email)
        }
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Error processing customer action:', error);
    return NextResponse.json({ error: 'Failed to process action' }, { status: 500 });
  }
}
