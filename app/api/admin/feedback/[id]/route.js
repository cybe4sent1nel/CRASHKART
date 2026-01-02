import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
// Prevent Next.js from attempting to pre-render this route
export const dynamic = 'force-dynamic'

// GET - Fetch single feedback by ID
export async function GET(request, { params }) {
  try {
    const { authOptions } = await import('@/lib/auth')
    const session = await getServerSession(authOptions)
    
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

    const { id } = params

    const feedback = await prisma.userFeedback.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    if (!feedback) {
      return NextResponse.json(
        { message: 'Feedback not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ feedback })
  } catch (error) {
    console.error('Error fetching feedback:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(request, { params }) {
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
      console.warn(`Unauthorized feedback patch attempt by ${session.user.email}`)
      return NextResponse.json(
        { message: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }

    const { status } = await request.json()
    const { id } = params

    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return NextResponse.json(
        { message: 'Invalid status' },
        { status: 400 }
      )
    }

    const feedback = await prisma.userFeedback.update({
      where: { id },
      data: { status }
    })

    return NextResponse.json({
      message: 'Feedback updated successfully',
      feedback
    })
  } catch (error) {
    console.error('Error updating feedback:', error)
    if (error.code === 'P2025') {
      return NextResponse.json(
        { message: 'Feedback not found' },
        { status: 404 }
      )
    }
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getCurrentSession();
    
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
      console.warn(`Unauthorized feedback delete attempt by ${session.user.email}`)
      return NextResponse.json(
        { message: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }

    const { id } = params

    await prisma.userFeedback.delete({
      where: { id }
    })

    return NextResponse.json({
      message: 'Feedback deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting feedback:', error)
    if (error.code === 'P2025') {
      return NextResponse.json(
        { message: 'Feedback not found' },
        { status: 404 }
      )
    }
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
