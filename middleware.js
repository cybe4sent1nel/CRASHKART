import { NextResponse } from 'next/server'

// Placeholder middleware - authentication handled via localStorage
export function middleware(request) {
    // Allow all requests to pass through
    return NextResponse.next()
}

export const config = {
    matcher: [
        // Skip NextAuth API routes, static files, and images
        '/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.png|.*\\.ico|.*\\.bmp).*)',
    ]
}
