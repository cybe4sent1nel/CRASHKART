// Prevent Next.js from attempting to pre-render this route
export const dynamic = 'force-dynamic'

let handler = null

async function initHandler() {
  if (!handler) {
    const NextAuth = (await import("next-auth")).default
    const { authOptions } = await import("@/lib/auth")
    handler = NextAuth(authOptions)
  }
  return handler
}

export async function GET(req, res) {
  const h = await initHandler()
  return h(req, res)
}

export async function POST(req, res) {
  const h = await initHandler()
  return h(req, res)
}
