import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'

// Admin-only: GET all users list
export async function GET(req) {
    try {
        // Get admin email from headers or query
        const adminEmail = req.headers.get('x-admin-email') || new URL(req.url).searchParams.get('adminEmail');

        if (!adminEmail) {
            return NextResponse.json({ error: 'Admin email required' }, { status: 400 })
        }

        // Verify admin user exists
        const admin = await prisma.user.findUnique({
            where: { email: adminEmail }
        })

        if (!admin) {
            return NextResponse.json({ error: 'Admin not found' }, { status: 404 })
        }

        // Get search query parameter
        const { searchParams } = new URL(req.url)
        const search = searchParams.get('search') || ''
        const page = parseInt(searchParams.get('page') || '1')
        const limit = 20

        const skip = (page - 1) * limit

        // Fetch users with optional search
        const users = await prisma.user.findMany({
            where: search ? {
                OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                    { email: { contains: search, mode: 'insensitive' } },
                    { phone: { contains: search, mode: 'insensitive' } }
                ]
            } : {},
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                image: true,
                createdAt: true
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit
        })

        // Get total count
        const total = await prisma.user.count(
            search ? {
                where: {
                    OR: [
                        { name: { contains: search, mode: 'insensitive' } },
                        { email: { contains: search, mode: 'insensitive' } },
                        { phone: { contains: search, mode: 'insensitive' } }
                    ]
                }
            } : {}
        )

        return NextResponse.json({
            users,
            total,
            page,
            limit,
            pages: Math.ceil(total / limit)
        })
    } catch (error) {
        console.error('Error fetching users:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
