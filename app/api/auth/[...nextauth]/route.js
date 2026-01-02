// Prevent Next.js from attempting to pre-render this route
export const dynamic = 'force-dynamic'

async function getHandler() {
  const NextAuth = (await import("next-auth")).default
  const { getAuthOptions } = await import("@/lib/auth")
  const authOptions = getAuthOptions()
  return NextAuth(authOptions)
}

let cachedHandler = null

async function handler(req, res) {
  if (!cachedHandler) {
    cachedHandler = await getHandler()
  }
  return cachedHandler(req, res)
}

export async function GET(req, res) {
  return handler(req, res)
}

export async function POST(req, res) {
  return handler(req, res)
}
