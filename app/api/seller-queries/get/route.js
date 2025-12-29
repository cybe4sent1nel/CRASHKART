import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search')

    const skip = (page - 1) * limit

    // Build where clause
    const where = {}

    if (status && status !== 'all') {
      where.status = status
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Fetch queries and count total
    const [queries, total] = await Promise.all([
      prisma.sellerQuery.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          companyName: true,
          businessType: true,
          category: true,
          experience: true,
          status: true,
          createdAt: true,
          updatedAt: true
        }
      }),
      prisma.sellerQuery.count({ where })
    ])

    // Get status counts
    const [pendingCount, reviewingCount, approvedCount, rejectedCount] = await Promise.all([
      prisma.sellerQuery.count({ where: { status: 'pending' } }),
      prisma.sellerQuery.count({ where: { status: 'reviewing' } }),
      prisma.sellerQuery.count({ where: { status: 'approved' } }),
      prisma.sellerQuery.count({ where: { status: 'rejected' } })
    ])

    return NextResponse.json({
      success: true,
      data: queries,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      stats: {
        total: pendingCount + reviewingCount + approvedCount + rejectedCount,
        pending: pendingCount,
        reviewing: reviewingCount,
        approved: approvedCount,
        rejected: rejectedCount
      }
    })
  } catch (error) {
    console.error('Error fetching seller queries:', error)
    return NextResponse.json(
      { error: 'Failed to fetch seller queries' },
      { status: 500 }
    )
  }
}
