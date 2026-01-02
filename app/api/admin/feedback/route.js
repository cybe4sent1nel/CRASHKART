import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { getCurrentSession } from '@/lib/session'
// Prevent Next.js from attempting to pre-render this route
export const dynamic = 'force-dynamic'

// Sort mappings
const sortMappings = {
  newest: { createdAt: 'desc' },
  oldest: { createdAt: 'asc' },
  'highest-rated': { rating: 'desc' },
  'lowest-rated': { rating: 'asc' },
  pending: { status: 'asc', createdAt: 'desc' }
}

export async function GET(request) {
  try {
    const { authOptions } = await import('@/lib/auth')
    const session = await getCurrentSession()
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { message: 'Unauthorized - No session found' },
        { status: 401 }
      )
    }

    // Check if user is admin from database (dynamic import to avoid build issues)
    const { isAdmin } = await import('@/lib/adminAuth')
    const userIsAdmin = await isAdmin(session.user.email)
    
    if (!userIsAdmin) {
      console.warn(`Unauthorized feedback access attempt by ${session.user.email}`)
      return NextResponse.json(
        { message: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'app'
    const sortBy = searchParams.get('sortBy') || 'newest'

    // Validate inputs
    if (!['product', 'app', 'complaint'].includes(type)) {
      return NextResponse.json(
        { message: 'Invalid feedback type' },
        { status: 400 }
      )
    }

    let feedbacks = []

    if (type === 'product') {
      // Fetch product reviews from Rating table
      const orderBy = sortBy === 'highest-rated' ? { rating: 'desc' } :
                     sortBy === 'lowest-rated' ? { rating: 'asc' } :
                     sortBy === 'oldest' ? { createdAt: 'asc' } :
                     { createdAt: 'desc' }

      const ratings = await prisma.rating.findMany({
        orderBy,
        include: {
          user: {
            select: {
              name: true,
              email: true,
              image: true
            }
          }
        }
      })

      feedbacks = ratings.map(r => ({
        id: r.id,
        userId: r.userId,
        userEmail: r.user?.email || 'Unknown',
        userName: r.user?.name || 'Anonymous',
        feedbackType: 'product',
        productId: r.productId,
        productName: r.productId, // Could fetch actual product name if needed
        rating: r.rating,
        title: null,
        message: r.review,
        images: r.images || [],
        videos: r.videos || [],
        isAnonymous: false,
        status: 'approved',
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
        orderId: r.orderId
      }))
    } else if (type === 'app') {
      // Fetch app reviews from UserFeedback table
      const orderBy = sortMappings[sortBy] || sortMappings.newest

      const appFeedbacks = await prisma.userFeedback.findMany({
        where: {
          feedbackType: 'app'
        },
        orderBy,
        select: {
          id: true,
          userId: true,
          userEmail: true,
          userName: true,
          feedbackType: true,
          productId: true,
          productName: true,
          rating: true,
          title: true,
          message: true,
          isAnonymous: true,
          status: true,
          createdAt: true,
          updatedAt: true
        }
      })

      feedbacks = appFeedbacks.map(f => ({
        ...f,
        createdAt: f.createdAt.toISOString(),
        updatedAt: f.updatedAt.toISOString()
      }))
    } else if (type === 'complaint') {
      // Fetch complaints from Complaint table
      const orderBy = sortBy === 'oldest' ? { createdAt: 'asc' } : { createdAt: 'desc' }

      const complaints = await prisma.complaint.findMany({
        orderBy,
        include: {
          order: {
            select: {
              id: true,
              status: true
            }
          }
        }
      })

      feedbacks = complaints.map(c => ({
        id: c.id,
        userId: c.userId,
        orderId: c.orderId,
        orderNumber: c.order?.id || null,
        subject: c.subject,
        description: c.description,
        category: c.category,
        status: c.status,
        priority: c.priority,
        images: c.images,
        resolution: c.resolution,
        assignedTo: c.assignedTo,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
        resolvedAt: c.resolvedAt?.toISOString() || null,
        feedbackType: 'complaint'
      }))
    }

    return NextResponse.json({
      feedbacks
    })
  } catch (error) {
    console.error('Error fetching feedbacks:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request) {
  try {
    const session = await getCurrentSession()
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { message: 'Unauthorized - No session found' },
        { status: 401 }
      )
    }

    // Check if user is admin from database (dynamic import to avoid build issues)
    const { isAdmin } = await import('@/lib/adminAuth')
    const userIsAdmin = await isAdmin(session.user.email)
    
    if (!userIsAdmin) {
      console.warn(`Unauthorized feedback POST attempt by ${session.user.email}`)
      return NextResponse.json(
        { message: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }

    // This route could be used to create feedback manually from admin
    return NextResponse.json(
      { message: 'Use the feedback submission endpoint instead' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
