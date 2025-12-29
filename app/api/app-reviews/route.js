import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic';

/**
 * Get app reviews for public display (testimonials)
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')

    // Fetch approved app reviews from UserFeedback table
    const appReviews = await prisma.userFeedback.findMany({
      where: {
        feedbackType: 'app',
        status: {
          in: ['approved', 'pending']
        },
        rating: {
          gte: 4 // Only show 4 and 5 star reviews in testimonials
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit,
      select: {
        id: true,
        userName: true,
        rating: true,
        message: true,
        title: true,
        isAnonymous: true,
        createdAt: true
      }
    })

    // Transform reviews for testimonials
    const testimonials = appReviews.map(review => ({
      id: review.id,
      name: review.isAnonymous ? 'Anonymous User' : review.userName,
      role: 'Customer',
      text: review.message,
      rating: review.rating,
      date: review.createdAt.toISOString()
    }))

    return NextResponse.json({
      success: true,
      testimonials
    })
  } catch (error) {
    console.error('Error fetching app reviews:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    )
  }
}
