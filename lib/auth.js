import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"

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
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
            allowDangerousEmailAccountLinking: true
        })
    ],
    pages: {
        signIn: "/login",
        error: "/login"
    },
    callbacks: {
        async jwt({ token, user, account, profile }) {
            if (user) {
                token.id = user.id
                token.isAdmin = user.isAdmin
            }
            if (account?.provider === "google" && profile) {
                token.id = profile.sub // Google ID (sub claim)
                token.name = profile.name
                token.email = profile.email
                token.picture = profile.picture
                token.provider = "google"
                token.googleId = profile.sub // Store googleId explicitly
            }
            return token
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id
                session.user.isAdmin = token.isAdmin
                session.user.provider = token.provider
                // Include picture from Google OAuth
                if (token.picture) {
                    session.user.image = token.picture
                }
                // Pass googleId to session for profile sync
                if (token.googleId) {
                    session.user.googleId = token.googleId
                }
            }
            return session
        },
        async signIn({ user, account, profile }) {
            // Allow all sign-ins
            return true
        }
    },
    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60 // 30 days
    },
    secret: process.env.NEXTAUTH_SECRET
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
export default handler
