import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'
import { isAdmin as checkIsAdmin } from '@/lib/adminAuth'

const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || 'your-secret-key'

/**
 * Get current session from JWT cookie OR Authorization header
 * Replacement for getServerSession that works without NextAuth catch-all route
 * Supports both JWT strategy and Bearer token authentication
 */
export async function getCurrentSession(request = null) {
    try {
        // Try to get token from Authorization header first (for API routes with localStorage JWT)
        if (request) {
            const authHeader = request.headers.get('authorization')
            if (authHeader?.startsWith('Bearer ')) {
                const token = authHeader.substring(7)
                
                try {
                    const payload = jwt.verify(token, JWT_SECRET)
                    
                    if (payload?.userId) {
                        const user = await prisma.user.findUnique({
                            where: { id: payload.userId },
                            select: {
                                id: true,
                                email: true,
                                name: true,
                                image: true
                            }
                        })
                        
                        if (user) {
                            // Check if user is admin by looking up in Admin table
                            const isAdmin = await checkIsAdmin(user.email)
                            const userWithAdmin = { ...user, isAdmin }
                            
                            console.log('✅ Session loaded from Bearer token:', user.email, 'isAdmin:', isAdmin)
                            return {
                                user: userWithAdmin,
                                expires: payload.exp ? new Date(payload.exp * 1000).toISOString() : null
                            }
                        }
                    }
                } catch (tokenError) {
                    console.log('⚠️ Bearer token invalid:', tokenError.message)
                }
            }
        }

        // Fall back to session cookie (for NextAuth/Google OAuth)
        const cookieStore = await cookies()
        const sessionToken = cookieStore.get('next-auth.session-token')?.value || 
                            cookieStore.get('__Secure-next-auth.session-token')?.value
        
        if (!sessionToken) {
            console.log('❌ No session token found in cookies or Authorization header')
            return null
        }

        console.log('✅ Session token found in cookie, decoding JWT...')

        // Decode JWT token from cookie (NEXTAUTH_SECRET for cookie-based sessions)
        const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET
        if (!NEXTAUTH_SECRET) {
            console.error('❌ NEXTAUTH_SECRET not configured')
            return null
        }

        try {
            const payload = jwt.verify(sessionToken, NEXTAUTH_SECRET)

            if (!payload || !payload.sub) {
                console.log('❌ Invalid JWT payload or missing user ID')
                return null
            }

            console.log('✅ JWT decoded, user ID:', payload.sub)

            // Get fresh user data from database
            const user = await prisma.user.findUnique({
                where: { id: payload.sub },
                select: {
                    id: true,
                    email: true,
                    name: true,
                    image: true
                }
            })

            if (!user) {
                console.log('❌ User not found in database:', payload.sub)
                return null
            }

            // Check if user is admin by looking up in Admin table
            const isAdmin = await checkIsAdmin(user.email)
            const userWithAdmin = { ...user, isAdmin }

            console.log('✅ Session loaded for user:', user.email, 'isAdmin:', isAdmin)

            return {
                user: userWithAdmin,
                expires: payload.exp ? new Date(payload.exp * 1000).toISOString() : null
            }
        } catch (cookieError) {
            console.error('❌ Cookie JWT verification failed:', cookieError.message)
            return null
        }
    } catch (error) {
        console.error('❌ getCurrentSession error:', error.message)
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
