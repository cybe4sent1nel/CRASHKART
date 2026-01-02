export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Lazy load to prevent build-time execution
export async function GET(req, ctx) {
    const NextAuth = (await import("next-auth")).default
    const { authOptions } = await import("@/lib/auth")
    const handler = NextAuth(authOptions)
    return await handler(req, ctx)
}

export async function POST(req, ctx) {
    const NextAuth = (await import("next-auth")).default
    const { authOptions } = await import("@/lib/auth")
    const handler = NextAuth(authOptions)
    return await handler(req, ctx)
}
