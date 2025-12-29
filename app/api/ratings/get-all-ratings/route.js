import { prisma } from '@/lib/prisma';

export async function GET(request) {
    try {
        console.log('🔍 Admin fetching all reviews/ratings');

        // Get all ratings with product and user details
        const ratings = await prisma.rating.findMany({
            include: {
                product: {
                    select: {
                        id: true,
                        name: true,
                        images: true,
                        price: true,
                    },
                },
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        console.log(`⭐ Found ${ratings.length} total reviews`);

        return Response.json(
            { success: true, ratings },
            { status: 200 }
        );
    } catch (error) {
        console.error('❌ Error fetching all ratings:', error);
        return Response.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
