/**
 * Fix Payment Status Script
 * Updates orders with PAYMENT_PENDING status to ORDER_PLACED
 * and marks CASHFREE orders as paid
 * 
 * Run this script with: node scripts/fix-payment-status.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixPaymentStatus() {
    try {
        console.log('🔍 Starting payment status fix...\n');

        // Step 1: Find orders with PAYMENT_PENDING status
        console.log('Step 1: Finding orders with PAYMENT_PENDING status...');
        const pendingOrders = await prisma.order.findMany({
            where: {
                status: 'PAYMENT_PENDING'
            },
            select: {
                id: true,
                status: true,
                paymentMethod: true,
                isPaid: true,
                total: true
            }
        });

        console.log(`   Found ${pendingOrders.length} orders with PAYMENT_PENDING status\n`);

        // Step 2: Update all CASHFREE orders to mark as paid
        console.log('Step 2: Updating CASHFREE orders to mark as paid...');
        const cashfreeOrders = await prisma.order.findMany({
            where: {
                paymentMethod: 'CASHFREE',
                isPaid: false
            }
        });
        
        if (cashfreeOrders.length > 0) {
            for (const order of cashfreeOrders) {
                await prisma.order.update({
                    where: { id: order.id },
                    data: { isPaid: true }
                });
            }
            console.log(`   ✅ Marked ${cashfreeOrders.length} CASHFREE orders as paid\n`);
        }

        // Step 3: Update orders to ORDER_PLACED
        if (pendingOrders.length > 0) {
            console.log('Step 3: Updating order statuses to ORDER_PLACED...');
            
            for (const order of pendingOrders) {
                try {
                    // For CASHFREE payments, mark as paid and ORDER_PLACED
                    // For COD, keep as not paid but change status to ORDER_PLACED
                    const isPaid = order.paymentMethod === 'CASHFREE' ? true : order.isPaid;
                    
                    await prisma.order.update({
                        where: { id: order.id },
                        data: {
                            status: 'ORDER_PLACED',
                            isPaid: isPaid
                        }
                    });
                    
                    // Also update order items
                    await prisma.orderItem.updateMany({
                        where: { orderId: order.id },
                        data: {
                            status: 'ORDER_PLACED'
                        }
                    });
                    
                    console.log(`   ✓ Fixed order ${order.id.substring(0, 12)}... (${order.paymentMethod}, isPaid: ${isPaid})`);
                } catch (err) {
                    console.log(`   ✗ Failed to fix order ${order.id}:`, err.message);
                }
            }
            
            console.log(`\n   ✅ Updated ${pendingOrders.length} orders\n`);
        } else {
            console.log('Step 3: No orders need fixing ✓\n');
        }

        // Step 4: Verify - count remaining PAYMENT_PENDING orders
        console.log('Step 4: Verifying fixes...');
        const remainingPending = await prisma.order.count({
            where: {
                status: 'PAYMENT_PENDING'
            }
        });
        
        console.log(`   Orders with PAYMENT_PENDING status remaining: ${remainingPending}`);

        // Step 5: Show summary of current order statuses
        const statusSummary = await prisma.order.groupBy({
            by: ['status'],
            _count: { status: true }
        });

        console.log('\n📊 Current Order Status Summary:');
        statusSummary.forEach(stat => {
            console.log(`   ${stat.status}: ${stat._count.status} orders`);
        });

        console.log('\n✨ Payment status fix completed successfully!\n');

    } catch (error) {
        console.error('❌ Error fixing payment status:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Run the script
fixPaymentStatus()
    .then(() => {
        console.log('Done!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Script failed:', error);
        process.exit(1);
    });
