import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'

// Admin-only: GET any user's details
export async function GET(req, { params }) {
    try {
        // Get admin email from headers or query
        const adminEmail = req.headers.get('x-admin-email') || new URL(req.url).searchParams.get('adminEmail');

        if (!adminEmail) {
            return NextResponse.json({ error: 'Admin email required' }, { status: 400 })
        }

        // Verify admin user (you can add role check here if needed)
        const admin = await prisma.user.findUnique({
            where: { email: adminEmail }
        })

        if (!admin) {
            return NextResponse.json({ error: 'Admin not found' }, { status: 404 })
        }

        // Fetch requested user's details
        const { userId } = params

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                image: true,
                isEmailVerified: true,
                isPhoneVerified: true,
                createdAt: true,
                Address: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                        street: true,
                        city: true,
                        state: true,
                        zip: true,
                        country: true,
                        isDefault: true
                    },
                    orderBy: { isDefault: 'desc' }
                }
            }
        })

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        return NextResponse.json(user)
    } catch (error) {
        console.error('Error fetching user details:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
