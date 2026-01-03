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

        // Fall back to session cookie (for all login methods)
        const cookieStore = await cookies()
        const sessionToken = cookieStore.get('next-auth.session-token')?.value || 
                            cookieStore.get('__Secure-next-auth.session-token')?.value
        
        if (!sessionToken) {
            console.log('❌ No session token found in cookies or Authorization header')
            return null
        }

        // Check if cookie looks like a JWT (has 3 parts separated by dots)
        if (!sessionToken.includes('.') || sessionToken.split('.').length !== 3) {
            console.log('⚠️ Cookie is not a valid JWT format, ignoring and returning null')
            return null
        }

        console.log('✅ Session token found in cookie, decoding JWT...')

        // Decode JWT token from cookie - Try JWT_SECRET first (for OTP/password/Google)
        // then fallback to NEXTAUTH_SECRET (for legacy NextAuth sessions)
        let payload = null
        
        try {
            payload = jwt.verify(sessionToken, JWT_SECRET)
            console.log('✅ Cookie verified with JWT_SECRET')
        } catch (err1) {
            // Try NEXTAUTH_SECRET as fallback
            const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET
            if (NEXTAUTH_SECRET) {
                try {
                    payload = jwt.verify(sessionToken, NEXTAUTH_SECRET)
                    console.log('✅ Cookie verified with NEXTAUTH_SECRET (legacy)')
                } catch (err2) {
                    console.log('⚠️ Cookie JWT verification failed with both secrets (ignoring old/invalid cookie)')
                    return null
                }
            } else {
                console.log('⚠️ Cookie JWT verification failed (ignoring old/invalid cookie)')
                return null
            }
        }

        if (!payload) {
            console.log('❌ Invalid JWT payload')
            return null
        }

        // Get userId from payload (supports both 'userId' and 'sub' for compatibility)
        const userId = payload.userId || payload.sub
        if (!userId) {
            console.log('❌ No user ID in JWT payload')
            return null
        }

        console.log('✅ JWT decoded, user ID:', userId)

        // Get fresh user data from database
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                name: true,
                image: true
            }
        })

        if (!user) {
            console.log('❌ User not found in database:', userId)
            return null
        }

        // Check if user is admin by looking up in Admin table
        const isAdmin = await checkIsAdmin(user.email)
        const userWithAdmin = { ...user, isAdmin }

        console.log('✅ Session loaded from cookie:', user.email, 'isAdmin:', isAdmin)

        return {
            user: userWithAdmin,
            expires: payload.exp ? new Date(payload.exp * 1000).toISOString() : null
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
