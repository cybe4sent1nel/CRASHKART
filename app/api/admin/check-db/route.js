import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request) {
    try {
        // Get database connection info
        const databaseUrl = process.env.DATABASE_URL || 'NOT_SET';
        const dbName = databaseUrl.split('/').pop()?.split('?')[0] || 'UNKNOWN';
        const dbHost = databaseUrl.includes('mongodb.net') ? 'MongoDB Atlas' : 'Local MongoDB';
        
        // Count records in database
        const [orderCount, userCount, productCount] = await Promise.all([
            prisma.order.count(),
            prisma.user.count(),
            prisma.product.count()
        ]);

        // Get first 3 order IDs to verify which database
        const sampleOrders = await prisma.order.findMany({
            take: 3,
            select: { id: true, createdAt: true, total: true },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({
            success: true,
            database: {
                name: dbName,
                host: dbHost,
                connectionString: databaseUrl.substring(0, 30) + '...' // Partial for security
            },
            stats: {
                orders: orderCount,
                users: userCount,
                products: productCount
            },
            sampleOrders,
            environment: process.env.NODE_ENV || 'unknown',
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Database check error:', error);
        return NextResponse.json({
            success: false,
            error: error.message,
            database: {
                connectionString: (process.env.DATABASE_URL || 'NOT_SET').substring(0, 30) + '...'
            }
        }, { status: 500 });
    }
}
