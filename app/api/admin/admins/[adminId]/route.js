import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

// Prevent Next.js from attempting to pre-render this route
export const dynamic = 'force-dynamic'

// DELETE - Remove an admin (admin only)
export async function DELETE(request, { params }) {
  try {
    const { authOptions } = await import('@/lib/auth')
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is admin from database (dynamic import to avoid build issues)
    const { isAdmin } = await import('@/lib/adminAuth')
    const userIsAdmin = await isAdmin(session.user.email)
    
    if (!userIsAdmin) {
      return NextResponse.json(
        { message: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }

    const { adminId } = await params;

    // Check if admin exists
    const adminToDelete = await prisma.admin.findUnique({
      where: { id: adminId }
    })

    if (!adminToDelete) {
      return NextResponse.json(
        { message: 'Admin not found' },
        { status: 404 }
      )
    }

    // Prevent self-deletion
    if (adminToDelete.email === session.user.email) {
      return NextResponse.json(
        { message: 'Cannot delete your own admin account' },
        { status: 400 }
      )
    }

    // Delete admin
    await prisma.admin.delete({
      where: { id: adminId }
    })

    return NextResponse.json({ message: 'Admin removed successfully' })
  } catch (error) {
    console.error('Error deleting admin:', error)
    return NextResponse.json(
      { message: 'Failed to delete admin', error: error.message },
      { status: 500 }
    )
  }
}
