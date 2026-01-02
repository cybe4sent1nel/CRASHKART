// Force dynamic rendering to prevent build-time initialization
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const fetchCache = 'force-no-store'

let handler = null

async function getHandler() {
    if (!handler) {
        const NextAuth = (await import("next-auth")).default
        const { authOptions } = await import("@/lib/auth")
        handler = NextAuth(authOptions)
    }
    return handler
}

export async function GET(req, ctx) {
    const h = await getHandler()
    return h(req, ctx)
}

export async function POST(req, ctx) {
    const h = await getHandler()
    return h(req, ctx)
}
