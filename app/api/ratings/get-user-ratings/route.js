import { prisma } from '@/lib/prisma';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return Response.json(
                { success: false, error: 'User ID is required' },
                { status: 400 }
            );
        }

        console.log('🔍 Fetching reviews for userId:', userId);

        // Get user ratings with product details
        const ratings = await prisma.rating.findMany({
            where: {
                userId,
            },
            include: {
                product: {
                    select: {
                        id: true,
                        name: true,
                        images: true,
                        price: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        console.log(`⭐ Found ${ratings.length} reviews for user ${userId}`);

        return Response.json(
            { success: true, ratings },
            { status: 200 }
        );
    } catch (error) {
        console.error('❌ Error fetching ratings:', error);
        return Response.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
