import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// POST - Send chat message
export async function POST(request) {
  try {
    const body = await request.json();
    const { userId, message, type = 'text', ticketId, sellerId, metadata } = body;

    if (!userId || !message) {
      return NextResponse.json(
        { error: 'User ID and message required' },
        { status: 400 }
      );
    }

    // Create or get ticket
    let ticket = null;

    if (ticketId) {
      ticket = await prisma.supportTicket.findUnique({
        where: { id: ticketId }
      });
    }

    // Create chat message
    const chatMessage = await prisma.chatMessage.create({
      data: {
        userId,
        sellerId: sellerId || null,
        message,
        type,
        metadata
      }
    });

    // If ticket doesn't exist but ticketId provided, create it
    if (!ticket && ticketId) {
      ticket = await prisma.supportTicket.create({
        data: {
          id: ticketId,
          userId,
          subject: message.substring(0, 50),
          description: message,
          category: 'other',
          messages: [chatMessage.id]
        }
      });
    } else if (ticket) {
      // Add message to existing ticket
      await prisma.supportTicket.update({
        where: { id: ticketId },
        data: {
          messages: {
            push: chatMessage.id
          }
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: chatMessage,
      ticket: ticket || null
    });

  } catch (error) {
    console.error('Chat message error:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}

// GET - Get chat history
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const ticketId = searchParams.get('ticketId');
    const sellerId = searchParams.get('sellerId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    let messages;

    if (ticketId) {
      // Get messages for a specific ticket
      const ticket = await prisma.supportTicket.findUnique({
        where: { id: ticketId },
        include: {
          messages: true
        }
      });

      if (!ticket) {
        return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
      }

      messages = await prisma.chatMessage.findMany({
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

    // Get all messages for user or with specific seller
    const where = { userId };
    if (sellerId) {
      where.sellerId = sellerId;
    }

    messages = await prisma.chatMessage.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    return NextResponse.json({
      success: true,
      messages
    });

  } catch (error) {
    console.error('Get messages error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}
