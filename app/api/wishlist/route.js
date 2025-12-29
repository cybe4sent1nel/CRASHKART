import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const prisma = new PrismaClient()

// GET - Fetch user's wishlist items
export async function GET(req) {
    try {
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

        const wishlistItems = await prisma.wishlistItem.findMany({
            where: { userId: user.id }
        })

        return Response.json({
            success: true,
            items: wishlistItems
        })

    } catch (error) {
        console.error('Wishlist GET Error:', error)
        return Response.json(
            { message: error.message },
            { status: 500 }
        )
    }
}

// POST - Add item to wishlist
export async function POST(req) {
    try {
        const session = await getServerSession(authOptions)
        
        if (!session?.user?.email) {
            return Response.json(
                { message: 'Unauthorized' },
                { status: 401 }
            )
        }

        const { productId, priceAtAdd, notifyStock, notifyPrice } = await req.json()

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

        // Upsert wishlist item
        const wishlistItem = await prisma.wishlistItem.upsert({
            where: {
                userId_productId: {
                    userId: user.id,
                    productId: productId
                }
            },
            update: {
                notifyStock: notifyStock ?? true,
                notifyPrice: notifyPrice ?? true
            },
            create: {
                userId: user.id,
                productId: productId,
                priceAtAdd: priceAtAdd || 0,
                notifyStock: notifyStock ?? true,
                notifyPrice: notifyPrice ?? true
            }
        })

        return Response.json({
            success: true,
            wishlistItem: wishlistItem
        })

    } catch (error) {
        console.error('Wishlist POST Error:', error)
        return Response.json(
            { message: error.message },
            { status: 500 }
        )
    }
}

// DELETE - Remove item from wishlist
export async function DELETE(req) {
    try {
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

        await prisma.wishlistItem.delete({
            where: {
                userId_productId: {
                    userId: user.id,
                    productId: productId
                }
            }
        })

        return Response.json({
            success: true,
            message: 'Item removed from wishlist'
        })

    } catch (error) {
        console.error('Wishlist DELETE Error:', error)
        return Response.json(
            { message: error.message },
            { status: 500 }
        )
    }
}
