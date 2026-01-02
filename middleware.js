import { NextResponse } from 'next/server'

export function middleware(request) {
    const { pathname } = request.nextUrl
    const method = request.method.toUpperCase()
    const isAdminApi = pathname.startsWith('/api/admin')
    const isDemo = request.cookies.get('admin_demo')?.value === '1'

    // Block server-side mutations for demo admins so the real app/data is never touched
    if (isDemo && isAdminApi && method !== 'GET') {
        return NextResponse.json(
            {
                success: true,
                demo: true,
                message: 'Demo mode: operation simulated, no data changed.',
            },
            { status: 200 }
        )
    }

    // Allow all other requests to pass through
    return NextResponse.next()
}

export const config = {
    matcher: [
        // Skip NextAuth API routes, static files, and images
        '/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.png|.*\\.ico|.*\\.bmp).*)',
    ]
}
