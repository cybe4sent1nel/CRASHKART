import CredentialsProvider from "next-auth/providers/credentials"

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
        })
    ],
    pages: {
        signIn: "/login",
        error: "/login"
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id
                token.isAdmin = user.isAdmin
            }
            return token
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id
                session.user.isAdmin = token.isAdmin
            }
            return session
        }
    },
    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60 // 30 days
    },
    secret: process.env.NEXTAUTH_SECRET
}
