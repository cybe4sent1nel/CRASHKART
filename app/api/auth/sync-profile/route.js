import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'

// Prevent Next.js from attempting to pre-render this route
export const dynamic = 'force-dynamic'

export async function POST(request) {
    try {
                const { authOptions } = await import('@/lib/auth')
const session = await getCurrentSession()

        if (!session?.user?.email) {
            console.warn('No session or email found')
            return NextResponse.json(
                { message: 'Unauthorized: No session' },
                { status: 401 }
            )
        }

        // Parse body once and store it
        const body = await request.json()
        const { image, name, email } = body

        // Use email from body or session
        const userEmail = email || session.user.email

        console.log('Syncing profile for:', userEmail)

        // Build where clause - try googleId if provider is google, fallback to email
        let whereClause = { email: userEmail }
        
        // If user authenticated via Google and has an ID token
        if (session.user.provider === 'google' && session.user.id) {
            // For Google OAuth, the ID is the googleId (profile.sub)
            // We need to check if user exists by either googleId or email
            const existingUser = await prisma.user.findFirst({
                where: {
                    OR: [
                        { email: userEmail },
                        { googleId: session.user.id }
                    ]
                }
            })

            if (existingUser) {
                // Update existing user
                const updatedUser = await prisma.user.update({
                    where: { id: existingUser.id },
                    data: {
                        ...(image && { image }),
                        ...(name && { name }),
                        email: userEmail, // Ensure email is up-to-date
                        googleId: session.user.id,
                        loginMethod: 'google'
                    }
                })

                console.log('Profile synced successfully for:', userEmail)
                return NextResponse.json({
                    message: 'Profile synced successfully',
                    user: {
                        id: updatedUser.id,
                        email: updatedUser.email,
                        name: updatedUser.name,
                        image: updatedUser.image
                    }
                }, { status: 200 })
            } else {
                // Create new user with googleId
                const newUser = await prisma.user.create({
                    data: {
                        email: userEmail,
                        name: name || userEmail.split('@')[0],
                        image: image || null,
                        googleId: session.user.id,
                        loginMethod: 'google',
                        isEmailVerified: true // Google emails are verified
                    }
                })

                console.log('New user created for Google OAuth:', userEmail)
                return NextResponse.json({
                    message: 'Profile created successfully',
                    user: {
                        id: newUser.id,
                        email: newUser.email,
                        name: newUser.name,
                        image: newUser.image
                    }
                }, { status: 200 })
            }
        } else {
            // Non-Google authentication - use standard upsert
            const user = await prisma.user.upsert({
                where: { email: userEmail },
                update: {
                    ...(image && { image }),
                    ...(name && { name })
                },
                create: {
                    email: userEmail,
                    name: name || userEmail.split('@')[0],
                    image: image || null,
                    loginMethod: 'email'
                }
            })

            console.log('Profile synced successfully for:', userEmail)
            return NextResponse.json({
                message: 'Profile synced successfully',
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    image: user.image
                }
            }, { status: 200 })
        }

    } catch (error) {
        console.error('Profile sync error:', {
            message: error.message,
            code: error.code,
            statusCode: error.statusCode,
            timestamp: new Date().toISOString()
        })

        // Return appropriate error response
        return NextResponse.json(
            { 
                message: error.message || 'Failed to sync profile',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            },
            { status: 500 }
        )
    }
}
