import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function PATCH(request, { params }) {
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
