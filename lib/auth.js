import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import { PrismaClient } from '@prisma/client'

export const authOptions = {
    providers: [
        CredentialsProvider({
            name: "Email & Password",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error("Please provide email and password")
                }
                // For now, return basic user object
                // The actual auth is handled by the OTP flow
                return {
                    id: credentials.email,
                    email: credentials.email,
                    name: credentials.email.split('@')[0]
                }
            }
        }),
        ...(process.env.GOOGLE_CLIENT_ID ? [GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            allowDangerousEmailAccountLinking: true,
            authorization: {
                params: {
                    prompt: "consent",
                    access_type: "offline",
                    response_type: "code"
                }
            },
            profile(profile) {
                return {
                    id: profile.sub,
                    name: profile.name,
                    email: profile.email,
                    image: profile.picture,
                    googleId: profile.sub
                }
            }
        })] : [])
    ],
    pages: {
        signIn: "/login",
        error: "/login"
    },
    callbacks: {
        async jwt({ token, user, account, profile, trigger }) {
            // On sign in, add user data to token
            if (user) {
                token.id = user.id
                token.isAdmin = user.isAdmin
            }
            
            // For Google OAuth, use profile data directly
            if (account?.provider === "google" && profile) {
                token.id = profile.sub
                token.name = profile.name
                token.email = profile.email
                token.picture = profile.picture
                token.provider = "google"
                token.googleId = profile.sub
            }
            return token
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id
                session.user.isAdmin = token.isAdmin
                session.user.provider = token.provider
                session.user.googleId = token.googleId
                session.user.crashCashBalance = token.crashCashBalance
                session.user.isProfileSetup = token.isProfileSetup
                
                // Include picture from Google OAuth
                if (token.picture) {
                    session.user.image = token.picture
                }
            }
            return session
        },
        async signIn({ user, account, profile }) {
            // Allow all sign-ins - database sync happens in jwt callback
            return true
        }
    },
    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60 // 30 days
    },
    secret: process.env.NEXTAUTH_SECRET
}
