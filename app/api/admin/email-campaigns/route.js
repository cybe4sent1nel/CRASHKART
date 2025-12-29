import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendFlashSaleEmail, sendBulkEmail } from '@/lib/email';

// GET - Get email campaign stats and templates
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'templates', 'stats', 'recipients'

    if (type === 'templates') {
      // Return available email templates
      const templates = [
        {
          id: 'flash-sale',
          name: 'Flash Sale Announcement',
          description: 'Announce a flash sale or promotional discount',
          variables: ['discount', 'expiresAt', 'products']
        },
        {
          id: 'new-arrivals',
          name: 'New Arrivals',
          description: 'Showcase new products in your store',
          variables: ['products']
        },
        {
          id: 'newsletter',
          name: 'Newsletter',
          description: 'General newsletter with custom content',
          variables: ['subject', 'content']
        },
        {
          id: 'abandoned-cart',
          name: 'Abandoned Cart Reminder',
          description: 'Remind customers about items in their cart',
          variables: ['auto']
        },
        {
          id: 'back-in-stock',
          name: 'Back in Stock',
          description: 'Notify customers when products are back in stock',
          variables: ['product']
        },
        {
          id: 'price-drop',
          name: 'Price Drop Alert',
          description: 'Alert customers about price reductions',
          variables: ['product', 'oldPrice', 'newPrice']
        },
        {
          id: 'loyalty-reward',
          name: 'Loyalty Reward',
          description: 'Send CrashCash rewards or loyalty points',
          variables: ['amount', 'reason']
        }
      ];

      return NextResponse.json({ success: true, templates });
    }

    if (type === 'recipients') {
      // Get recipient counts by segment
      const [
        allUsers,
        newUsers,
        activeUsers,
        inactiveUsers,
        highValueUsers
      ] = await Promise.all([
        prisma.user.count({ where: { email: { not: null } } }),
        prisma.user.count({
          where: {
            email: { not: null },
            createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
          }
        }),
        prisma.user.count({
          where: {
            email: { not: null },
            buyerOrders: { some: { createdAt: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) } } }
          }
        }),
        prisma.user.count({
          where: {
            email: { not: null },
            buyerOrders: { none: { createdAt: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) } } }
          }
        }),
        // High value = more than ₹5000 in orders
        prisma.order.groupBy({
          by: ['userId'],
          having: { total: { _sum: { gte: 5000 } } },
          _sum: { total: true }
        }).then(result => result.length)
      ]);

      const segments = [
        { id: 'all', name: 'All Customers', count: allUsers },
        { id: 'new', name: 'New Customers (30 days)', count: newUsers },
        { id: 'active', name: 'Active Customers (90 days)', count: activeUsers },
        { id: 'inactive', name: 'Inactive Customers', count: inactiveUsers },
        { id: 'high-value', name: 'High Value Customers (₹5000+)', count: highValueUsers }
      ];

      return NextResponse.json({ success: true, segments });
    }

    // Default: return email stats
    const stats = {
      totalEmails: 'Contact your email provider for stats',
      templates: 7,
      segments: 5
    };

    return NextResponse.json({ success: true, stats });

  } catch (error) {
    console.error('Error fetching email data:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}

// POST - Send email campaign
export async function POST(request) {
  try {
    const body = await request.json();
    const { 
      template, 
      segment, 
      customRecipients,
      subject,
      data 
    } = body;

    if (!template) {
      return NextResponse.json({ error: 'Template required' }, { status: 400 });
    }

    // Get recipients based on segment
    let recipients = [];

    if (customRecipients && customRecipients.length > 0) {
      // Use custom recipient list
      recipients = await prisma.user.findMany({
        where: { 
          email: { in: customRecipients },
          email: { not: null }
        },
        select: { name: true, email: true }
      });
    } else {
      // Get recipients by segment
      const where = { email: { not: null } };
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

      switch (segment) {
        case 'new':
          where.createdAt = { gte: thirtyDaysAgo };
          break;
        case 'active':
          where.buyerOrders = { some: { createdAt: { gte: ninetyDaysAgo } } };
          break;
        case 'inactive':
          where.buyerOrders = { none: { createdAt: { gte: ninetyDaysAgo } } };
          break;
        case 'high-value':
          // This requires a more complex query
          const highValueUserIds = await prisma.order.groupBy({
            by: ['userId'],
            having: { total: { _sum: { gte: 5000 } } }
          }).then(result => result.map(r => r.userId));
          where.id = { in: highValueUserIds };
          break;
        // 'all' - no additional filtering
      }

      recipients = await prisma.user.findMany({
        where,
        select: { name: true, email: true }
      });
    }

    if (recipients.length === 0) {
      return NextResponse.json({ error: 'No recipients found' }, { status: 400 });
    }

    // Send emails based on template
    let sent = 0;
    let failed = 0;

    switch (template) {
      case 'flash-sale':
        for (const recipient of recipients) {
          try {
            await sendFlashSaleEmail(recipient.email, {
              name: recipient.name,
              discount: data.discount,
              expiresAt: data.expiresAt,
              products: data.products || [],
              saleLink: `${process.env.NEXT_PUBLIC_APP_URL}/shop`
            });
            sent++;
          } catch (err) {
            console.error(`Failed to send to ${recipient.email}:`, err);
            failed++;
          }
        }
        break;

      case 'newsletter':
      case 'new-arrivals':
      case 'loyalty-reward':
        // Use bulk email for custom content
        for (const recipient of recipients) {
          try {
            await sendBulkEmail(recipient.email, {
              name: recipient.name,
              subject: subject || `Update from CrashKart`,
              content: data.content,
              ctaText: data.ctaText || 'Shop Now',
              ctaLink: data.ctaLink || `${process.env.NEXT_PUBLIC_APP_URL}`
            });
            sent++;
          } catch (err) {
            console.error(`Failed to send to ${recipient.email}:`, err);
            failed++;
          }
        }
        break;

      default:
        return NextResponse.json({ error: 'Invalid template' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      campaign: {
        template,
        segment,
        totalRecipients: recipients.length,
        sent,
        failed,
        sentAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error sending campaign:', error);
    return NextResponse.json({ error: 'Failed to send campaign' }, { status: 500 });
  }
}
