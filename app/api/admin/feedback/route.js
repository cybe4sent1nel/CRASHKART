import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

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
    const session = await getServerSession(authOptions)
    
    // Check if user is admin - allow main admin email or isAdmin flag
    const userEmail = session?.user?.email
    const isMainAdmin = userEmail === 'crashkart.help@gmail.com'
    const isAdmin = session?.user?.isAdmin === true || isMainAdmin
    
    if (!isAdmin) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'app'
    const sortBy = searchParams.get('sortBy') || 'newest'

    // Validate inputs
    if (!['product', 'app'].includes(type)) {
      return NextResponse.json(
        { message: 'Invalid feedback type' },
        { status: 400 }
      )
    }

    const orderBy = sortMappings[sortBy] || sortMappings.newest

    const feedbacks = await prisma.userFeedback.findMany({
      where: {
        feedbackType: type
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

    return NextResponse.json({
      feedbacks: feedbacks.map(f => ({
        ...f,
        createdAt: f.createdAt.toISOString(),
        updatedAt: f.updatedAt.toISOString()
      }))
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
    const session = await getServerSession(authOptions)
    
    // Check if user is admin - allow main admin email or isAdmin flag
    const userEmail = session?.user?.email
    const isMainAdmin = userEmail === 'crashkart.help@gmail.com'
    const isAdmin = session?.user?.isAdmin === true || isMainAdmin
    
    if (!isAdmin) {
      return NextResponse.json(
        { message: 'Unauthorized' },
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
