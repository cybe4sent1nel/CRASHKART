import { NextResponse } from 'next/server'

// Store for 2FA codes (same as send-2fa-code)
const twoFACodes = new Map()

// Verification attempt tracking
const verificationAttempts = new Map()

export async function POST(request) {
    try {
        const { email, code } = await request.json()

        if (!email || !code) {
            return NextResponse.json(
                { message: 'Email and code are required' },
                { status: 400 }
            )
        }

        // Check attempt limits (5 attempts per email)
        const attempts = verificationAttempts.get(email) || 0
        if (attempts >= 5) {
            return NextResponse.json(
                { message: 'Too many failed attempts. Please request a new code.' },
                { status: 429 }
            )
        }

        // Check if code exists and is not expired
        const storedData = twoFACodes.get(email)
        
        if (!storedData) {
            verificationAttempts.set(email, attempts + 1)
            return NextResponse.json(
                { message: 'No verification code found. Please request a new one.' },
                { status: 400 }
            )
        }

        if (Date.now() > storedData.expiresAt) {
            twoFACodes.delete(email)
            verificationAttempts.set(email, attempts + 1)
            return NextResponse.json(
                { message: 'Verification code has expired. Please request a new one.' },
                { status: 400 }
            )
        }

        // Check if code matches
        if (code !== storedData.code) {
            verificationAttempts.set(email, attempts + 1)
            const remaining = 5 - (attempts + 1)
            return NextResponse.json(
                { message: `Invalid code. ${remaining} attempts remaining.` },
                { status: 400 }
            )
        }

        // Code is valid - clear it and reset attempts
        twoFACodes.delete(email)
        verificationAttempts.delete(email)

        console.log(`2FA verification successful for ${email}`)

        return NextResponse.json({
            message: 'Verification successful',
            verified: true,
            email: email
        }, { status: 200 })

    } catch (error) {
        console.error('Error verifying 2FA code:', error)
        return NextResponse.json(
            { message: 'Verification failed' },
            { status: 500 }
        )
    }
}

// Helper to get codes (for testing)
export function getCodes() {
    return twoFACodes
}
