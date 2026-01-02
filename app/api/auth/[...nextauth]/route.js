export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const revalidate = false

let handler

export async function GET(req, ctx) {
    if (!handler) {
        const NextAuth = (await import("next-auth")).default
        const { authOptions } = await import("@/lib/auth")
        handler = NextAuth(authOptions)
    }
    return handler(req, ctx)
}

export async function POST(req, ctx) {
    if (!handler) {
        const NextAuth = (await import("next-auth")).default
        const { authOptions } = await import("@/lib/auth")
        handler = NextAuth(authOptions)
    }
    return handler(req, ctx)
}
