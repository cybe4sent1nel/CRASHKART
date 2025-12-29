import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendEmail } from '@/lib/email';

// POST - Create support ticket
export async function POST(request) {
  try {
    const body = await request.json();
    const { userId, subject, description, category, priority } = body;

    if (!userId || !subject || !description || !category) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate category
    const validCategories = ['billing', 'product', 'delivery', 'other'];
    if (!validCategories.includes(category)) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
    }

    // Get user email
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Create ticket
    const ticket = await prisma.supportTicket.create({
      data: {
        userId,
        subject,
        description,
        category,
        priority: priority || 'normal',
        status: 'open'
      }
    });

    // Send email confirmation
    try {
      await sendEmail(user.email, {
        template: 'support-ticket-created',
        name: user.name,
        ticketId: ticket.id,
        subject,
        category
      });
    } catch (emailError) {
      console.error('Failed to send ticket email:', emailError);
    }

    return NextResponse.json({
      success: true,
      ticket,
      message: 'Support ticket created. We will get back to you soon.'
    });

  } catch (error) {
    console.error('Create ticket error:', error);
    return NextResponse.json(
      { error: 'Failed to create ticket' },
      { status: 500 }
    );
  }
}

// GET - Get user's support tickets
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const ticketId = searchParams.get('ticketId');
    const status = searchParams.get('status');

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    if (ticketId) {
      // Get specific ticket
      const ticket = await prisma.supportTicket.findUnique({
        where: { id: ticketId }
      });

      if (!ticket || ticket.userId !== userId) {
        return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
      }

      // Get ticket messages
      const messages = await prisma.chatMessage.findMany({
        where: {
          id: { in: ticket.messages }
        },
        orderBy: { createdAt: 'asc' }
      });

      return NextResponse.json({
        success: true,
        ticket,
        messages
      });
    }

    // Get all tickets for user
    const where = { userId };
    if (status) {
      where.status = status;
    }

    const tickets = await prisma.supportTicket.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    // Group by status
    const stats = {
      open: tickets.filter(t => t.status === 'open').length,
      inProgress: tickets.filter(t => t.status === 'in-progress').length,
      resolved: tickets.filter(t => t.status === 'resolved').length,
      closed: tickets.filter(t => t.status === 'closed').length
    };

    return NextResponse.json({
      success: true,
      tickets,
      stats
    });

  } catch (error) {
    console.error('Get tickets error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tickets' },
      { status: 500 }
    );
  }
}

// PATCH - Update ticket status (admin)
export async function PATCH(request) {
  try {
    const body = await request.json();
    const { ticketId, status, assignedTo } = body;

    if (!ticketId || !status) {
      return NextResponse.json(
        { error: 'Ticket ID and status required' },
        { status: 400 }
      );
    }

    const validStatuses = ['open', 'in-progress', 'resolved', 'closed'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const updateData = { status };
    if (status === 'in-progress') {
      updateData.assignedTo = assignedTo;
    }
    if (status === 'resolved' || status === 'closed') {
      updateData.resolvedAt = new Date();
    }

    const ticket = await prisma.supportTicket.update({
      where: { id: ticketId },
      data: updateData
    });

    // Send email update
    const user = await prisma.user.findUnique({
      where: { id: ticket.userId },
      select: { email: true, name: true }
    });

    if (user) {
      try {
        await sendEmail(user.email, {
          template: 'support-ticket-updated',
          name: user.name,
          ticketId,
          status
        });
      } catch (emailError) {
        console.error('Failed to send update email:', emailError);
      }
    }

    return NextResponse.json({
      success: true,
      ticket,
      message: `Ticket status updated to ${status}`
    });

  } catch (error) {
    console.error('Update ticket error:', error);
    return NextResponse.json(
      { error: 'Failed to update ticket' },
      { status: 500 }
    );
  }
}
