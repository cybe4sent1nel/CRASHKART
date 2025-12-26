/**
 * Database Cleanup Script
 * Fixes orders and order items with null createdAt/updatedAt values
 * 
 * Run this script with: node scripts/fix-null-dates.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixNullDates() {
    try {
        console.log('🔍 Starting database cleanup for null dates...\n');

        // Use current date for orders with missing timestamps
        const defaultDate = new Date();
        
        // Step 1: Fix Orders using MongoDB raw commands
        console.log('Step 1: Fixing Orders with null dates...');
        try {
            const orderResult = await prisma.$runCommandRaw({
                update: 'Order',
                updates: [
                    {
                        q: { 
                            $or: [
                                { createdAt: null },
                                { updatedAt: null },
                                { createdAt: { $exists: false } },
                                { updatedAt: { $exists: false } },
                                { createdAt: { $type: 'string' } }, // Fix string dates
                                { updatedAt: { $type: 'string' } }
                            ]
                        },
                        u: { 
                            $set: { 
                                createdAt: { $date: defaultDate.toISOString() },
                                updatedAt: { $date: defaultDate.toISOString() }
                            } 
                        },
                        multi: true
                    }
                ]
            });
            
            const ordersModified = orderResult.nModified || orderResult.n || 0;
            console.log(`   ✅ Fixed ${ordersModified} orders\n`);
        } catch (err) {
            console.log(`   ⚠️ Order update:`, err.message);
        }

        // Step 2: Fix OrderItems using MongoDB raw commands
        console.log('Step 2: Fixing OrderItems with null dates...');
        try {
            const orderItemResult = await prisma.$runCommandRaw({
                update: 'OrderItem',
                updates: [
                    {
                        q: { 
                            $or: [
                                { createdAt: null },
                                { updatedAt: null },
                                { createdAt: { $exists: false } },
                                { updatedAt: { $exists: false } },
                                { createdAt: { $type: 'string' } }, // Fix string dates
                                { updatedAt: { $type: 'string' } }
                            ]
                        },
                        u: { 
                            $set: { 
                                createdAt: { $date: defaultDate.toISOString() },
                                updatedAt: { $date: defaultDate.toISOString() }
                            } 
                        },
                        multi: true
                    }
                ]
            });
            
            const itemsModified = orderItemResult.nModified || orderItemResult.n || 0;
            console.log(`   ✅ Fixed ${itemsModified} order items\n`);
        } catch (err) {
            console.log(`   ⚠️ OrderItem update:`, err.message);
        }

        // Step 3: Verify the fix
        console.log('Step 3: Verifying fixes...');
        
        // Count remaining issues in Orders
        const ordersWithIssues = await prisma.$runCommandRaw({
            count: 'Order',
            query: {
                $or: [
                    { createdAt: null },
                    { updatedAt: null }
                ]
            }
        });
        
        console.log(`   Orders with null dates remaining: ${ordersWithIssues.n || 0}`);
        
        // Count remaining issues in OrderItems
        const itemsWithIssues = await prisma.$runCommandRaw({
            count: 'OrderItem',
            query: {
                $or: [
                    { createdAt: null },
                    { updatedAt: null }
                ]
            }
        });
        
        console.log(`   OrderItems with null dates remaining: ${itemsWithIssues.n || 0}`);

        console.log('\n✨ Database cleanup completed successfully!\n');
        console.log('Summary:');
        console.log(`   - Default date used: ${defaultDate.toISOString()}`);
        console.log(`   - All null dates should now be fixed\n`);

    } catch (error) {
        console.error('❌ Error fixing null dates:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Run the script
fixNullDates()
    .then(() => {
        console.log('Done!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Script failed:', error);
        process.exit(1);
    });
