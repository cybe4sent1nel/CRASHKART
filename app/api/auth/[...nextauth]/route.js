import NextAuth from "next-auth"

// Prevent Next.js from attempting to pre-render this route
export const dynamic = 'force-dynamic'

let handler

async function getHandler() {
  if (!handler) {
    const { authOptions } = await import("@/lib/auth")
    handler = NextAuth(authOptions)
  }
  return handler
}

export async function GET(req, res) {
  const h = await getHandler()
  return h(req, res)
}

export async function POST(req, res) {
  const h = await getHandler()
  return h(req, res)
}
