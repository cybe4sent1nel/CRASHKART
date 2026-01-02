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
            
            // For Google OAuth, fetch complete user data from database
            if (account?.provider === "google" && profile) {
                try {
                    const { PrismaClient } = await import('@prisma/client')
                    const prisma = new PrismaClient()
                    
                    try {
                        const dbUser = await prisma.user.findFirst({
                            where: {
                                OR: [
                                    { email: profile.email },
                                    { googleId: profile.sub }
                                ]
                            },
                            select: {
                                id: true,
                                email: true,
                                name: true,
                                image: true,
                                googleId: true,
                                isAdmin: true,
                                crashCashBalance: true,
                                isProfileSetup: true,
                                sessionVersion: true
                            }
                        })
                        
                        if (dbUser) {
                            token.id = dbUser.id
                            token.name = dbUser.name
                            token.email = dbUser.email
                            token.picture = dbUser.image
                            token.provider = "google"
                            token.googleId = dbUser.googleId
                            token.isAdmin = dbUser.isAdmin
                            token.crashCashBalance = dbUser.crashCashBalance
                            token.isProfileSetup = dbUser.isProfileSetup
                        }
                    } finally {
                        await prisma.$disconnect()
                    }
                } catch (error) {
                    console.error('Error fetching user from database:', error)
                    // Fallback to profile data
                    token.id = profile.sub
                    token.name = profile.name
                    token.email = profile.email
                    token.picture = profile.picture
                    token.provider = "google"
                    token.googleId = profile.sub
                }
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
            // Allow all sign-ins
            // For Google OAuth, sync user to database
            if (account?.provider === 'google' && profile) {
                try {
                    // Use require for production compatibility
                    const { PrismaClient } = await import('@prisma/client')
                    const prisma = new PrismaClient()
                    
                    try {
                        // Check if user exists
                        const existingUser = await prisma.user.findFirst({
                            where: {
                                OR: [
                                    { email: profile.email },
                                    { googleId: profile.sub }
                                ]
                            }
                        })

                        if (existingUser) {
                            // Update existing user
                            await prisma.user.update({
                                where: { id: existingUser.id },
                                data: {
                                    googleId: profile.sub,
                                    name: profile.name,
                                    image: profile.picture,
                                    loginMethod: 'google',
                                    provider: 'google'
                                }
                            })
                        } else {
                            // Create new user with welcome bonus
                            const newUser = await prisma.user.create({
                                data: {
                                    email: profile.email,
                                    name: profile.name,
                                    image: profile.picture,
                                    googleId: profile.sub,
                                    loginMethod: 'google',
                                    provider: 'google',
                                    crashCashBalance: 0,
                                    isProfileSetup: true
                                }
                            })
                            
                            // Credit welcome bonus - non-blocking
                            try {
                                const { createCrashCashReward } = await import('@/lib/rewards')
                                await createCrashCashReward({ 
                                    userId: newUser.id, 
                                    amount: 1000, 
                                    source: 'welcome_bonus' 
                                })
                            } catch (rewardError) {
                                console.error('Failed to credit welcome bonus:', rewardError)
                            }
                            
                            // Send welcome email - non-blocking
                            try {
                                const { sendWelcomeEmail } = await import('@/lib/email')
                                await sendWelcomeEmail(profile.email, profile.name, 100)
                            } catch (emailError) {
                                console.error('Failed to send welcome email:', emailError)
                            }
                        }
                    } finally {
                        await prisma.$disconnect()
                    }
                } catch (error) {
                    console.error('Error syncing Google user:', error)
                    // Don't block sign-in on database errors in production
                    if (process.env.NODE_ENV === 'development') {
                        return false
                    }
                }
            }
            return true
        }
    },
    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60 // 30 days
    },
    secret: process.env.NEXTAUTH_SECRET
}
