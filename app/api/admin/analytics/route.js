import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const period = searchParams.get('period') || '30'; // days
        const periodDays = parseInt(period);

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - periodDays);

        // Run all queries in parallel for better performance
        const [
            totalUsers,
            newUsers,
            totalProducts,
            lowStockProducts,
            totalOrders,
            recentOrders,
            ordersByStatus,
            totalRevenue,
            revenueData,
            topProducts,
            topCustomers,
            pendingStores,
            categoryStats,
            dailyStats,
            ratings
        ] = await Promise.all([
            // Total users
            prisma.user.count(),

            // New users in period
            prisma.user.count({
                where: { createdAt: { gte: startDate } }
            }),

            // Total products
            prisma.product.count(),

            // Low stock products (using inStock as a boolean)
            prisma.product.count({
                where: { inStock: false }
            }),

            // Total orders
            prisma.order.count(),

            // Recent orders in period
            prisma.order.count({
                where: { createdAt: { gte: startDate } }
            }),

            // Orders by status
            prisma.order.groupBy({
                by: ['status'],
                _count: { status: true }
            }),

            // Total revenue (all time) - both COD and Cashfree
            prisma.order.aggregate({
                where: {
                    // Include both paid orders and COD orders (which are marked as unpaid but completed)
                    OR: [
                        { isPaid: true }, // Cashfree payments
                        {
                            paymentMethod: 'COD',
                            status: { in: ['DELIVERED', 'SHIPPED', 'PROCESSING'] }
                        }
                    ]
                },
                _sum: { total: true }
            }),

            // Revenue in period - both COD and Cashfree
            prisma.order.aggregate({
                where: {
                    createdAt: { gte: startDate },
                    OR: [
                        { isPaid: true },
                        {
                            paymentMethod: 'COD',
                            status: { in: ['DELIVERED', 'SHIPPED', 'PROCESSING'] }
                        }
                    ]
                },
                _sum: { total: true }
            }),

            // Top selling products
            prisma.orderItem.groupBy({
                by: ['productId'],
                _sum: { quantity: true },
                _count: { productId: true },
                orderBy: { _sum: { quantity: 'desc' } },
                take: 10
            }),

            // Top customers by order value
            prisma.order.groupBy({
                by: ['userId'],
                _sum: { total: true },
                _count: { userId: true },
                orderBy: { _sum: { total: 'desc' } },
                take: 10
            }),

            // Pending store applications
            prisma.store.count({
                where: { status: 'pending' }
            }),

            // Category distribution
            prisma.product.groupBy({
                by: ['category'],
                _count: { category: true }
            }),

            // Daily orders for chart
            prisma.order.findMany({
                where: { createdAt: { gte: startDate } },
                select: {
                    createdAt: true,
                    total: true,
                    isPaid: true,
                    status: true
                },
                orderBy: { createdAt: 'asc' }
            }),

            // Average rating
            prisma.rating.aggregate({
                _avg: { rating: true },
                _count: { rating: true }
            })
        ]);

        // Get product details for top products
        const topProductIds = topProducts.map(p => p.productId);
        const productDetails = await prisma.product.findMany({
            where: { id: { in: topProductIds } },
            select: { id: true, name: true, price: true, images: true, category: true }
        });

        const topProductsWithDetails = topProducts.map(tp => {
            const product = productDetails.find(p => p.id === tp.productId);
            return {
                ...tp,
                product: product || null,
                totalSold: tp._sum.quantity,
                orderCount: tp._count.productId
            };
        });

        // Get user details for top customers
        const topCustomerIds = topCustomers.map(c => c.userId);
        const customerDetails = await prisma.user.findMany({
            where: { id: { in: topCustomerIds } },
            select: { id: true, name: true, email: true, image: true }
        });

        const topCustomersWithDetails = topCustomers.map(tc => {
            const customer = customerDetails.find(c => c.id === tc.userId);
            return {
                ...tc,
                user: customer || null,
                totalSpent: tc._sum.total,
                orderCount: tc._count.userId
            };
        });

        // Process daily stats for chart
        const dailyStatsMap = new Map();
        dailyStats.forEach(order => {
            const date = order.createdAt.toISOString().split('T')[0];
            const existing = dailyStatsMap.get(date) || { orders: 0, revenue: 0, paidOrders: 0 };
            existing.orders += 1;
            existing.revenue += order.total;
            if (order.isPaid) existing.paidOrders += 1;
            dailyStatsMap.set(date, existing);
        });

        const chartData = Array.from(dailyStatsMap.entries())
            .map(([date, data]) => ({
                date,
                orders: data.orders,
                revenue: data.revenue,
                paidOrders: data.paidOrders
            }))
            .sort((a, b) => new Date(a.date) - new Date(b.date));

        // Calculate growth rates
        const previousStartDate = new Date(startDate);
        previousStartDate.setDate(previousStartDate.getDate() - periodDays);

        const [previousUsers, previousOrders, previousRevenue] = await Promise.all([
            prisma.user.count({
                where: {
                    createdAt: {
                        gte: previousStartDate,
                        lt: startDate
                    }
                }
            }),
            prisma.order.count({
                where: {
                    createdAt: {
                        gte: previousStartDate,
                        lt: startDate
                    }
                }
            }),
            prisma.order.aggregate({
                where: {
                    isPaid: true,
                    createdAt: {
                        gte: previousStartDate,
                        lt: startDate
                    }
                },
                _sum: { total: true }
            })
        ]);

        const calculateGrowth = (current, previous) => {
            if (previous === 0) return current > 0 ? 100 : 0;
            return ((current - previous) / previous * 100).toFixed(1);
        };

        return NextResponse.json({
            success: true,
            overview: {
                totalUsers,
                newUsers,
                userGrowth: calculateGrowth(newUsers, previousUsers),
                totalProducts,
                lowStockProducts,
                totalOrders,
                recentOrders,
                orderGrowth: calculateGrowth(recentOrders, previousOrders),
                totalRevenue: totalRevenue._sum.total || 0,
                periodRevenue: revenueData._sum.total || 0,
                revenueGrowth: calculateGrowth(
                    revenueData._sum.total || 0,
                    previousRevenue._sum.total || 0
                ),
                pendingStores,
                averageRating: ratings._avg.rating?.toFixed(1) || '0',
                totalRatings: ratings._count.rating
            },
            ordersByStatus: ordersByStatus.reduce((acc, item) => {
                acc[item.status] = item._count.status;
                return acc;
            }, {}),
            categoryDistribution: categoryStats.map(c => ({
                category: c.category,
                count: c._count.category
            })),
            chartData,
            topProducts: topProductsWithDetails,
            topCustomers: topCustomersWithDetails,
            period: periodDays
        });

    } catch (error) {
        console.error('Dashboard analytics error:', error);
        return NextResponse.json({
            error: 'Failed to fetch analytics',
            details: error.message
        }, { status: 500 });
    }
}
