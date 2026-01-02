import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const cookieStore = await cookies()
        const sessionToken = cookieStore.get('next-auth.session-token')?.value || 
                            cookieStore.get('__Secure-next-auth.session-token')?.value
        
        if (!sessionToken) {
            return NextResponse.json({ user: null }, { status: 200 })
        }

        // Get session from database
        const session = await prisma.session.findUnique({
            where: { sessionToken },
            include: { user: true }
        })

        if (!session || session.expires < new Date()) {
            return NextResponse.json({ user: null }, { status: 200 })
        }

        return NextResponse.json({
            user: {
                id: session.user.id,
                email: session.user.email,
                name: session.user.name,
                image: session.user.image,
                isAdmin: session.user.isAdmin
            },
            expires: session.expires.toISOString()
        })
    } catch (error) {
        console.error('Session error:', error)
        return NextResponse.json({ user: null }, { status: 200 })
    }
}
