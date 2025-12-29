import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const userEmail = searchParams.get('userEmail')

    if (!userEmail) {
      return NextResponse.json(
        { error: 'User email is required' },
        { status: 400 }
      )
    }

    // Get user by email
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: { id: true }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Fetch product reviews
    const productReviews = await prisma.rating.findMany({
      where: { userId: user.id },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            description: true,
            price: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Fetch app reviews
    const appReviews = await prisma.userFeedback.findMany({
      where: { 
        userEmail,
        feedbackType: 'app'
      },
      orderBy: { createdAt: 'desc' }
    })

    // Transform product reviews
    const transformedProductReviews = productReviews.map(r => ({
      id: r.id,
      type: 'product',
      productId: r.productId,
      productTitle: r.product?.name || 'Unknown Product',
      productImage: null,
      rating: r.rating,
      review: r.review,
      images: r.images || [],
      videos: r.videos || [],
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString()
    }))

    // Transform app reviews
    const transformedAppReviews = appReviews.map(r => ({
      id: r.id,
      type: 'app',
      title: r.title,
      rating: r.rating,
      message: r.message,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString()
    }))

    // Combine and sort by date
    const allReviews = [...transformedProductReviews, ...transformedAppReviews]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

    return NextResponse.json({
      success: true,
      reviews: allReviews
    })
  } catch (error) {
    console.error('Error fetching user reviews:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    )
  }
}
