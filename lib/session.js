import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'
import { prisma } from '@/lib/prisma'

/**
 * Get current session from JWT cookie
 * Replacement for getServerSession that works without NextAuth catch-all route
 * Uses JWT strategy (not database sessions)
 */
export async function getCurrentSession() {
    try {
        const cookieStore = await cookies()
        const sessionToken = cookieStore.get('next-auth.session-token')?.value || 
                            cookieStore.get('__Secure-next-auth.session-token')?.value
        
        if (!sessionToken) {
            return null
        }

        // Decode JWT token
        const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET)
        const { payload } = await jwtVerify(sessionToken, secret)

        if (!payload || !payload.sub) {
            return null
        }

        // Get fresh user data from database
        const user = await prisma.user.findUnique({
            where: { id: payload.sub },
            select: {
                id: true,
                email: true,
                name: true,
                image: true,
                isAdmin: true
            }
        })

        if (!user) {
            return null
        }

        return {
            user,
            expires: payload.exp ? new Date(payload.exp * 1000).toISOString() : null
        }
    } catch (error) {
        console.error('getCurrentSession error:', error)
        return null
    }
}

/**
 * Get user ID from JWT token in Authorization header
 */
export async function getUserFromToken(request) {
    try {
        const authHeader = request.headers.get('authorization')
        if (!authHeader?.startsWith('Bearer ')) {
            return null
        }

        const token = authHeader.substring(7)
        const { jwtVerify } = await import('jose')
        const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET)
        const { payload } = await jwtVerify(token, secret)
        
        return payload.userId || payload.sub || null
    } catch (error) {
        return null
    }
}
