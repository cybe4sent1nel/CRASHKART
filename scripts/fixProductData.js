/**
 * Fix Product Data Script
 * This script fixes mismatched product names and images in the database
 * Run with: node scripts/fixProductData.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Correct product mappings from assets.js
const correctProducts = [
    { id: 'prod_1', name: 'Modern table lamp', category: 'Decoration' },
    { id: 'prod_2', name: 'Smart speaker gray', category: 'Speakers' },
    { id: 'prod_3', name: 'Smart watch white', category: 'Watch' },
    { id: 'prod_4', name: 'Wireless headphones', category: 'Headphones' },
    { id: 'prod_5', name: 'Smart watch black', category: 'Watch' },
    { id: 'prod_6', name: 'Security Camera', category: 'Camera' },
    { id: 'prod_7', name: 'Smart Pen for iPad', category: 'Pen' },
    { id: 'prod_8', name: 'Home Theater', category: 'Theater' },
    { id: 'prod_9', name: 'Apple Wireless Earbuds', category: 'Earbuds' },
    { id: 'prod_10', name: 'Apple Smart Watch', category: 'Watch' },
    { id: 'prod_11', name: 'RGB Gaming Mouse', category: 'Mouse' },
    { id: 'prod_12', name: 'Smart Home Cleaner', category: 'Cleaner' },
    { id: 'prod_13', name: 'Garmin Smart Sports Watch', category: 'Watch' },
    { id: 'prod_14', name: 'PlayStation 5 Console', category: 'Gaming' },
    { id: 'prod_15', name: 'Bose Noise Cancelling Headphones', category: 'Headphones' },
    { id: 'prod_16', name: 'Smart Security Camera Pro', category: 'Camera' },
    { id: 'prod_17', name: 'Premium 4K Monitor', category: 'Monitor' },
    { id: 'prod_18', name: 'Wireless Charging Pad', category: 'Charger' },
    { id: 'prod_19', name: 'Portable External SSD 2TB', category: 'Storage' },
    { id: 'prod_20', name: 'LED Ring Light Studio Pro', category: 'Lighting' },
    { id: 'prod_21', name: 'USB-C Hub Pro', category: 'Accessories' },
    { id: 'prod_22', name: 'Mechanical Keyboard RGB', category: 'Keyboard' },
    { id: 'prod_23', name: 'Portable Bluetooth Speaker', category: 'Speakers' },
    { id: 'prod_24', name: 'Wireless Mouse Pro', category: 'Mouse' },
    { id: 'prod_25', name: '4K Ultra HD Webcam Professional', category: 'Camera' },
    { id: 'prod_26', name: 'Power Bank 30000mAh Ultra Fast', category: 'Charger' },
];

async function fixProductData() {
    try {
        console.log('Starting product data fix...\n');

        let fixedCount = 0;
        let errorCount = 0;

        for (const product of correctProducts) {
            try {
                const existing = await prisma.product.findUnique({
                    where: { id: product.id }
                });

                if (existing) {
                    // Update product with correct data
                    await prisma.product.update({
                        where: { id: product.id },
                        data: {
                            name: product.name,
                            category: product.category,
                        }
                    });

                    console.log(`✓ Fixed: ${product.id} → ${product.name}`);
                    fixedCount++;
                } else {
                    console.log(`⚠ Not found: ${product.id}`);
                }
            } catch (error) {
                console.error(`✗ Error fixing ${product.id}:`, error.message);
                errorCount++;
            }
        }

        console.log(`\n✓ Successfully fixed ${fixedCount} products`);
        if (errorCount > 0) {
            console.log(`✗ Failed to fix ${errorCount} products`);
        }

        // Report database status
        const totalProducts = await prisma.product.count();
        console.log(`\nDatabase now contains ${totalProducts} total products`);

        // List all products
        console.log('\nAll products in database:');
        const allProducts = await prisma.product.findMany({
            select: { id: true, name: true, category: true }
        });

        allProducts.forEach(p => {
            console.log(`  - ${p.id}: ${p.name} (${p.category})`);
        });

    } catch (error) {
        console.error('Fatal error:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

// Run the fix
fixProductData();
