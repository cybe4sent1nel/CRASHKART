export const dynamic = 'force-dynamic'

// Ensure NEXTAUTH_SECRET is set for build
if (!process.env.NEXTAUTH_SECRET && process.env.NODE_ENV === 'production') {
  process.env.NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || 'temp-build-secret'
}

import NextAuth from "next-auth"
import { authOptions } from "@/lib/auth"

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
