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
        userEmail: true,
        userId: true,
        rating: true,
        message: true,
        title: true,
        isAnonymous: true,
        createdAt: true
      }
    })

    // Fetch user images separately
    const testimonials = await Promise.all(appReviews.map(async review => {
      let userImage = null
      
      // Try to fetch user by email to get profile image
      if (review.userEmail) {
        try {
          const user = await prisma.user.findUnique({
            where: { email: review.userEmail },
            select: { image: true, name: true }
          })
          if (user) {
            userImage = user.image
          }
        } catch (err) {
          console.log('Could not fetch user image for', review.userEmail)
        }
      }
      
      return {
        id: review.id,
        name: review.isAnonymous ? 'Anonymous User' : review.userName,
        email: review.userEmail,
        role: 'Customer',
        text: review.message,
        rating: review.rating,
        date: review.createdAt.toISOString(),
        image: userImage
      }
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
