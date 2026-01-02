import NextAuth from "next-auth"
import { authOptions } from "@/lib/auth"

// Prevent Next.js from attempting to pre-render this route
export const dynamic = 'force-dynamic'

const handler = NextAuth(authOptions)

export const GET = handler
export const POST = handler
