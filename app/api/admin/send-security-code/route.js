import { sendSecurityCodeEmail } from '@/lib/sendSecurityEmail'

export async function POST(req) {
    try {
        const { email } = await req.json()

        // Check if email is in admin database (dynamic import to avoid build issues)
        const { isAdmin } = await import('@/lib/adminAuth')
        const userIsAdmin = await isAdmin(email)
        
        if (!userIsAdmin) {
            return Response.json(
                { message: 'Unauthorized - Not an admin' },
                { status: 403 }
            )
        }

        // Generate a 6-digit random code
        const securityCode = Math.floor(100000 + Math.random() * 900000).toString()
        
        // Store code in memory (in production, use Redis or database)
        // For demo, we'll store it for 10 minutes
        const codeData = {
            code: securityCode,
            email: email,
            timestamp: Date.now(),
            expiresAt: Date.now() + (10 * 60 * 1000) // 10 minutes
        }

        // Store in a file temporarily (for this demo)
        // In production, use Redis or database
        global.adminSecurityCodes = global.adminSecurityCodes || {}
        global.adminSecurityCodes[email] = codeData

        console.log(`🔐 Security Code for ${email}: ${securityCode}`)

        // Send email with security code
        const result = await sendSecurityCodeEmail(email, securityCode)

        if (!result.success) {
            throw new Error(result.error || 'Failed to send email')
        }

        console.log(`✅ Security code email sent to ${email}`)

        return Response.json({
            success: true,
            message: 'Security code sent to your email'
        }, { status: 200 })

    } catch (error) {
        console.error('Send security code error:', error)
        return Response.json(
            { message: error.message || 'Failed to send security code' },
            { status: 500 }
        )
    }
}
