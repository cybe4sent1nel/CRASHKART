import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'

/**
 * Get current session from cookie-based session token
 * Replacement for getServerSession that works without NextAuth catch-all route
 */
export async function getCurrentSession() {
    try {
        const cookieStore = await cookies()
        const sessionToken = cookieStore.get('next-auth.session-token')?.value || 
                            cookieStore.get('__Secure-next-auth.session-token')?.value
        
        if (!sessionToken) {
            return null
        }

        // Get session from database
        const session = await prisma.session.findUnique({
            where: { sessionToken },
            include: { 
                user: {
                    select: {
                        id: true,
                        email: true,
                        name: true,
                        image: true,
                        isAdmin: true
                    }
                }
            }
        })

        if (!session || session.expires < new Date()) {
            return null
        }

        return {
            user: session.user,
            expires: session.expires.toISOString()
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
