import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
// Prevent Next.js from attempting to pre-render this route
export const dynamic = 'force-dynamic'

// GET - Fetch user's cart items
export async function GET(req) {
    try {
                const { authOptions } = await import('@/lib/auth')
const session = await getServerSession(authOptions)
        
        if (!session?.user?.email) {
            return Response.json(
                { message: 'Unauthorized' },
                { status: 401 }
            )
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        })

        if (!user) {
            return Response.json(
                { message: 'User not found' },
                { status: 404 }
            )
        }

        const cartItems = await prisma.cartItem.findMany({
            where: { userId: user.id },
            include: {
                product: true
            }
        })

        return Response.json({
            success: true,
            items: cartItems
        })

    } catch (error) {
        console.error('Cart GET Error:', error)
        return Response.json(
            { message: error.message },
            { status: 500 }
        )
    }
}

// POST - Add item to cart
export async function POST(req) {
    try {
                const { authOptions } = await import('@/lib/auth')
const session = await getServerSession(authOptions)
        
        if (!session?.user?.email) {
            return Response.json(
                { message: 'Unauthorized' },
                { status: 401 }
            )
        }

        const { productId, quantity, price } = await req.json()

        if (!productId || !quantity) {
            return Response.json(
                { message: 'Missing required fields' },
                { status: 400 }
            )
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        })

        if (!user) {
            return Response.json(
                { message: 'User not found' },
                { status: 404 }
            )
        }

        // Upsert cart item (update if exists, create if not)
        const cartItem = await prisma.cartItem.upsert({
            where: {
                userId_productId: {
                    userId: user.id,
                    productId: productId
                }
            },
            update: {
                quantity: quantity,
                updatedAt: new Date()
            },
            create: {
                userId: user.id,
                productId: productId,
                quantity: quantity,
                price: price || 0
            }
        })

        return Response.json({
            success: true,
            cartItem: cartItem
        })

    } catch (error) {
        console.error('Cart POST Error:', error)
        return Response.json(
            { message: error.message },
            { status: 500 }
        )
    }
}

// DELETE - Remove item from cart
export async function DELETE(req) {
    try {
                const { authOptions } = await import('@/lib/auth')
const session = await getServerSession(authOptions)
        
        if (!session?.user?.email) {
            return Response.json(
                { message: 'Unauthorized' },
                { status: 401 }
            )
        }

        const { productId } = await req.json()

        if (!productId) {
            return Response.json(
                { message: 'Missing product ID' },
                { status: 400 }
            )
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        })

        if (!user) {
            return Response.json(
                { message: 'User not found' },
                { status: 404 }
            )
        }

        await prisma.cartItem.delete({
            where: {
                userId_productId: {
                    userId: user.id,
                    productId: productId
                }
            }
        })

        return Response.json({
            success: true,
            message: 'Item removed from cart'
        })

    } catch (error) {
        console.error('Cart DELETE Error:', error)
        return Response.json(
            { message: error.message },
            { status: 500 }
        )
    }
}
