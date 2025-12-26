import { prisma } from '@/lib/prisma';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');
        const status = searchParams.get('status');

        let complaints;

        if (userId) {
            // Get user complaints
            complaints = await prisma.complaint.findMany({
                where: {
                    userId,
                    ...(status && { status }),
                },
                include: {
                    order: {
                        select: {
                            id: true,
                            total: true,
                            status: true,
                            createdAt: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
            });
        } else {
            // Get all complaints (admin)
            complaints = await prisma.complaint.findMany({
                include: {
                    order: {
                        select: {
                            id: true,
                            total: true,
                            status: true,
                            createdAt: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
            });
        }

        return Response.json(
            { success: true, complaints },
            { status: 200 }
        );
    } catch (error) {
        console.error('Error fetching complaints:', error);
        return Response.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
