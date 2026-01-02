import jwt from 'jsonwebtoken'
import prisma from './prisma'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export class AuthError extends Error {
    constructor(message = 'Unauthorized', status = 401, code = 'UNAUTHORIZED') {
        super(message)
        this.name = 'AuthError'
        this.status = status
        this.code = code
    }
}

export function extractBearerToken(request) {
    if (!request?.headers) return null
    const header = request.headers.get ? request.headers.get('authorization') : request.headers['authorization']
    if (!header) return null
    if (header.startsWith('Bearer ')) return header.slice(7)
    return header
}

export function generateUserToken(user, extraClaims = {}) {
    const payload = {
        userId: user.id,
        email: user.email,
        phone: user.phone,
        sessionVersion: user.sessionVersion ?? 0,
        ...extraClaims,
    }

    // Keep sessions effectively persistent unless user logs out or clears storage
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '365d' })
}

export async function verifyUserToken(token) {
    if (!token) {
        throw new AuthError('Unauthorized', 401, 'NO_TOKEN')
    }

    let decoded
    try {
        decoded = jwt.verify(token, JWT_SECRET)
    } catch (error) {
        throw new AuthError('Invalid or expired token', 401, 'INVALID_TOKEN')
    }

    const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        // sessionVersion field does not exist in schema; default to 0 in code
        select: { id: true, email: true, phone: true, crashCashBalance: true }
    })

    if (!user) {
        throw new AuthError('User not found', 401, 'USER_NOT_FOUND')
    }

    const tokenVersion = decoded.sessionVersion ?? 0
    const currentVersion = user.sessionVersion ?? 0

    if (tokenVersion !== currentVersion) {
        throw new AuthError('Session expired. Please login again.', 401, 'SESSION_EXPIRED')
    }

    return { user, decoded }
}

export async function requireUser(request) {
    const token = extractBearerToken(request)
    return verifyUserToken(token)
}
