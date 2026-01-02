import { NextResponse } from 'next/server'

export async function POST(request) {
    try {
        const { code } = await request.json()

        if (!code) {
            return NextResponse.json({ error: 'Authorization code required' }, { status: 400 })
        }

        // Exchange code for tokens (server-side only - keeps client_secret safe)
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                code,
                client_id: process.env.GOOGLE_CLIENT_ID,
                client_secret: process.env.GOOGLE_CLIENT_SECRET,
                redirect_uri: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/callback/google`,
                grant_type: 'authorization_code'
            })
        })

        if (!tokenResponse.ok) {
            const error = await tokenResponse.json()
            return NextResponse.json({ error: error.error_description || 'Token exchange failed' }, { status: 400 })
        }

        const tokens = await tokenResponse.json()

        // Get user info
        const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { Authorization: `Bearer ${tokens.access_token}` }
        })

        if (!userInfoResponse.ok) {
            return NextResponse.json({ error: 'Failed to fetch user info' }, { status: 400 })
        }

        const userInfo = await userInfoResponse.json()

        return NextResponse.json({
            user: userInfo,
            accessToken: tokens.access_token
        })

    } catch (error) {
        console.error('Google callback error:', error)
        return NextResponse.json({ error: 'Authentication failed' }, { status: 500 })
    }
}
