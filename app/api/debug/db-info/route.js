import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        const dbUrl = process.env.DATABASE_URL || 'NOT SET';
        
        // Extract database name from connection string (hide password)
        const urlMatch = dbUrl.match(/mongodb\+srv:\/\/([^:]+):[^@]+@([^/]+)\/([^?]+)/);
        
        const info = {
            databaseHost: urlMatch ? urlMatch[2] : 'Unknown',
            databaseName: urlMatch ? urlMatch[3] : 'Unknown',
            username: urlMatch ? urlMatch[1] : 'Unknown',
            environment: process.env.NODE_ENV,
            orderCount: 0,
            userCount: 0,
            productCount: 0
        };
        
        // Get actual counts from database
        const [orderCount, userCount, productCount] = await Promise.all([
            prisma.order.count(),
            prisma.user.count(),
            prisma.product.count()
        ]);
        
        info.orderCount = orderCount;
        info.userCount = userCount;
        info.productCount = productCount;
        
        return NextResponse.json({
            success: true,
            info
        });
    } catch (error) {
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}
