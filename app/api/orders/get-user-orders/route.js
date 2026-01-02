import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
;
import { jwtVerify } from 'jose';

// Prevent Next.js from attempting to pre-render this route
export const dynamic = 'force-dynamic';

// GET and POST - Get all orders for the current user
export async function GET(request) {
    return handleOrdersRequest(request);
}

export async function POST(request) {
    return handleOrdersRequest(request);
}

async function handleOrdersRequest(request) {
    try {
                const { authOptions } = await import('@/lib/auth')
let userEmail = null;
        let userId = null;

        // First try: Get user from NextAuth session
        const session = await getServerSession(authOptions);
        if (session?.user?.email) {
            userEmail = session.user.email;
        }

        // Second try: Get user from JWT token in Authorization header
        if (!userEmail) {
            const authHeader = request.headers.get('Authorization');
            if (authHeader?.startsWith('Bearer ')) {
                const token = authHeader.substring(7);
                try {
                            const { authOptions } = await import('@/lib/auth')
const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || 'your-secret-key');
                    const verified = await jwtVerify(token, secret);
                    userEmail = verified.payload.email;
                } catch (err) {
                    console.log('JWT verification failed:', err.message);
                }
            }
        }

        // Third try: Get user from localStorage data sent in request (fallback for frontend)
        if (!userEmail) {
            try {
                        const { authOptions } = await import('@/lib/auth')
const body = await request.json().catch(() => ({}));
                userEmail = body.email;
            } catch (e) {
                // Ignore if no body
            }
        }

        if (!userEmail) {
            return NextResponse.json(
                { message: 'Unauthorized - No valid authentication found', success: false },
                { status: 401 }
            );
        }

        // Find user by email
        const user = await prisma.user.findUnique({
            where: { email: userEmail }
        });

        if (!user) {
            return NextResponse.json(
                { message: 'User not found', success: false },
                { status: 404 }
            );
        }

        console.log(`📦 [Get User Orders] Fetching orders for user: ${user.email} (${user.id})`)
        
        // Fetch all orders for this user
        const orders = await prisma.order.findMany({
            where: {
                userId: user.id
            },
            include: {
                orderItems: {
                    include: {
                        product: {
                            select: {
                                id: true,
                                name: true,
                                images: true,
                                price: true,
                                category: true
                            }
                        }
                    }
                },
                address: true,
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true
                    }
                }
            },
            orderBy: [
                { updatedAt: 'desc' },
                { createdAt: 'desc' }
            ]
        });
        
        console.log(`✅ [Get User Orders] Found ${orders.length} orders for user ${user.email}`)
        if (orders.length > 0) {
            console.log('🔍 Order IDs:', orders.map(o => o.id).slice(0, 5).join(', '))
        }

        // Format orders for response
        const formattedOrders = orders.map(order => ({
            id: order.id,
            status: order.status,
            paymentMethod: order.paymentMethod,
            total: order.total,
            isPaid: order.isPaid,
            createdAt: order.createdAt,
            updatedAt: order.updatedAt,
            items: order.orderItems.map(item => ({
                id: item.id,
                productId: item.productId,
                name: item.product?.name,
                quantity: item.quantity,
                price: item.price,
                product: item.product
            })),
            address: order.address ? {
                id: order.address.id,
                name: order.address.name,
                street: order.address.street,
                city: order.address.city,
                state: order.address.state,
                zip: order.address.zip,
                country: order.address.country,
                phone: order.address.phone,
                isDefault: order.address.isDefault
            } : null,
            coupon: order.coupon,
            isCouponUsed: order.isCouponUsed
        }));

        console.log(`✅ Fetched ${formattedOrders.length} orders for user: ${user.email}`);

        return NextResponse.json({
            success: true,
            orders: formattedOrders,
            count: formattedOrders.length
        });

    } catch (error) {
        console.error('Error fetching user orders:', error);
        return NextResponse.json(
            { message: 'Failed to fetch orders', error: error.message },
            { status: 500 }
        );
    }
}
