import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'

/**
 * Set session cookie after successful authentication
 * This ensures getCurrentSession works for all login methods
 * @param {string} userId - User ID to store in cookie
 * @param {Object} extraData - Additional data to include in JWT payload
 */
export async function setSessionCookie(userId, extraData = {}) {
    try {
        const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || 'your-secret-key'
        
        // Create JWT payload
        const payload = {
            userId,
            ...extraData,
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60) // 1 year
        }
        
        // Sign the token
        const token = jwt.sign(payload, JWT_SECRET)
        
        // Set cookie
        const cookieStore = await cookies()
        cookieStore.set('next-auth.session-token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 365 * 24 * 60 * 60, // 1 year
            path: '/'
        })
        
        console.log('✅ Session cookie set for user:', userId)
        return { success: true }
    } catch (error) {
        console.error('❌ Failed to set session cookie:', error)
        return { success: false, error: error.message }
    }
}

/**
 * Clear session cookie on logout
 */
export async function clearSessionCookie() {
    try {
        const cookieStore = await cookies()
        cookieStore.delete('next-auth.session-token')
        cookieStore.delete('__Secure-next-auth.session-token')
        console.log('✅ Session cookies cleared')
        return { success: true }
    } catch (error) {
        console.error('❌ Failed to clear session cookie:', error)
        return { success: false, error: error.message }
    }
}
