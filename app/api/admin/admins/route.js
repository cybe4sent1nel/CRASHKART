import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { getCurrentSession } from '@/lib/session'

// Prevent Next.js from attempting to pre-render this route
export const dynamic = 'force-dynamic'

// GET - List all admins (admin only)
export async function GET(request) {
  try {
    const { authOptions } = await import('@/lib/auth')
    const session = await getCurrentSession()
    
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

    const admins = await prisma.admin.findMany({
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ admins })
  } catch (error) {
    console.error('Error fetching admins:', error)
    return NextResponse.json(
      { message: 'Failed to fetch admins', error: error.message },
      { status: 500 }
    )
  }
}

// POST - Add a new admin (existing admin only)
export async function POST(request) {
  try {
    const { authOptions } = await import('@/lib/auth')
    const session = await getCurrentSession()
    
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

    const { email, name } = await request.json()

    if (!email) {
      return NextResponse.json(
        { message: 'Email is required' },
        { status: 400 }
      )
    }

    // Check if admin already exists
    const existingAdmin = await prisma.admin.findUnique({
      where: { email }
    })

    if (existingAdmin) {
      return NextResponse.json(
        { message: 'Admin already exists' },
        { status: 409 }
      )
    }

    // Get current admin's ID
    const currentAdmin = await prisma.admin.findUnique({
      where: { email: session.user.email }
    })

    // Create new admin
    const newAdmin = await prisma.admin.create({
      data: {
        email,
        name: name || null,
        addedBy: currentAdmin?.id
      }
    })

    return NextResponse.json(
      { 
        message: 'Admin added successfully',
        admin: newAdmin
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error adding admin:', error)
    return NextResponse.json(
      { message: 'Failed to add admin', error: error.message },
      { status: 500 }
    )
  }
}

