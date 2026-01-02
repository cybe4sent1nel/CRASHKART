export async function POST(req) {
    try {
        const { email } = await req.json()

        if (!email) {
            return Response.json(
                { message: 'Email is required', isAdmin: false },
                { status: 400 }
            )
        }

        // Check if email is in admin database (dynamic import to avoid build issues)
        const { isAdmin } = await import('@/lib/adminAuth')
        const userIsAdmin = await isAdmin(email)

        return Response.json({ isAdmin: userIsAdmin })
    } catch (error) {
        console.error('Error checking admin status:', error)
        return Response.json(
            { message: 'Internal server error', isAdmin: false },
            { status: 500 }
        )
    }
}
