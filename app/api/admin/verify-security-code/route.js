export async function POST(req) {
    try {
        const { email, code } = await req.json()

        // Check if email is in admin database (dynamic import to avoid build issues)
        const { isAdmin } = await import('@/lib/adminAuth')
        const userIsAdmin = await isAdmin(email)
        
        if (!userIsAdmin) {
            return Response.json(
                { message: 'Unauthorized - Not an admin' },
                { status: 403 }
            )
        }

        // Validate code format
        if (!code || code.length !== 6 || isNaN(code)) {
            return Response.json(
                { message: 'Invalid security code format' },
                { status: 400 }
            )
        }

        // Get stored code (from global memory)
        const storedCode = global.adminSecurityCodes?.[email]

        if (!storedCode) {
            return Response.json(
                { message: 'No security code found. Please request a new one.' },
                { status: 400 }
            )
        }

        // Check if code has expired
        if (Date.now() > storedCode.expiresAt) {
            delete global.adminSecurityCodes[email]
            return Response.json(
                { message: 'Security code has expired. Please request a new one.' },
                { status: 400 }
            )
        }

        // Verify code
        if (code !== storedCode.code) {
            return Response.json(
                { message: 'Invalid security code' },
                { status: 401 }
            )
        }

        // Code is valid - clear it from memory
        delete global.adminSecurityCodes[email]

        console.log(`✅ Admin security code verified for ${email}`)

        return Response.json({
            success: true,
            message: 'Security code verified successfully',
            email: email,
            admin: true
        }, { status: 200 })

    } catch (error) {
        console.error('Verify security code error:', error)
        return Response.json(
            { message: error.message || 'Failed to verify security code' },
            { status: 500 }
        )
    }
}
