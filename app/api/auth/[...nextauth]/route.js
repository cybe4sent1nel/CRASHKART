import NextAuth from "next-auth"

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

let handler

async function getAuthOptions() {
    const { authOptions } = await import("@/lib/auth")
    return authOptions
}

async function GET(req, context) {
    if (!handler) {
        const options = await getAuthOptions()
        handler = NextAuth(options)
    }
    return handler(req, context)
}

async function POST(req, context) {
    if (!handler) {
        const options = await getAuthOptions()
        handler = NextAuth(options)
    }
    return handler(req, context)
}

export { GET, POST }
