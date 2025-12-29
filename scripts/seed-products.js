const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const dummyProducts = [
    { name: "Modern table lamp", description: "Modern table lamp with a sleek design.", mrp: 3320, price: 2407, images: [], category: "Decoration" },
    { name: "Smart speaker gray", description: "Smart speaker with a sleek design.", mrp: 4150, price: 2899, images: [], category: "Speakers" },
    { name: "Smart watch white", description: "Smart watch with a sleek design.", mrp: 4980, price: 3299, images: [], category: "Watch" },
    { name: "Wireless headphones", description: "Wireless headphones with a sleek design.", mrp: 5810, price: 3699, images: [], category: "Headphones" },
    { name: "Smart watch black", description: "Smart watch with a sleek design.", mrp: 4067, price: 2799, images: [], category: "Watch" },
    { name: "Security Camera", description: "Security Camera with a sleek design.", mrp: 4897, price: 3449, images: [], category: "Camera" },
    { name: "Smart Pen for iPad", description: "Smart Pen for iPad with precision and pressure sensitivity.", mrp: 15000, price: 9999, images: [], category: "Pen" },
    { name: "Home Theater", description: "Home Theater system with excellent sound quality.", mrp: 49999, price: 34999, images: [], category: "Theater" },
    { name: "Apple Wireless Earbuds", description: "Apple Wireless Earbuds with premium sound.", mrp: 20000, price: 14999, images: [], category: "Earbuds" },
    { name: "Apple Smart Watch", description: "Apple Smart Watch with health tracking.", mrp: 45000, price: 34999, images: [], category: "Watch" },
    { name: "RGB Gaming Mouse", description: "RGB Gaming Mouse with precision tracking.", mrp: 5000, price: 3499, images: [], category: "Mouse" },
    { name: "Smart Home Cleaner", description: "Smart Home Cleaner with intelligent navigation.", mrp: 25000, price: 17999, images: [], category: "Cleaner" },
    { name: "Garmin Smart Sports Watch", description: "Garmin smartwatch with advanced fitness tracking, heart rate monitoring, and GPS navigation.", mrp: 14999, price: 9999, images: [], category: "Watch" },
    { name: "PlayStation 5 Console", description: "PlayStation 5 Console with stunning graphics.", mrp: 49999, price: 44999, images: [], category: "Gaming" },
    { name: "Bose Noise Cancelling Headphones", description: "Bose Noise Cancelling Headphones with premium sound.", mrp: 35000, price: 24999, images: [], category: "Headphones" },
    { name: "Smart Security Camera Pro", description: "Smart Security Camera Pro with 2K resolution.", mrp: 15000, price: 9999, images: [], category: "Camera" },
    { name: "Portable External SSD 2TB", description: "Portable External SSD 2TB with fast speeds.", mrp: 20000, price: 14999, images: [], category: "Storage" },
    { name: "LED Ring Light Studio Pro", description: "LED Ring Light Studio Pro for content creators.", mrp: 8000, price: 5999, images: [], category: "Lighting" },
    { name: "4K Ultra HD Webcam Professional", description: "4K Ultra HD Webcam Professional for streaming.", mrp: 12000, price: 8999, images: [], category: "Camera" },
    { name: "Power Bank 30000mAh Ultra Fast", description: "Power Bank 30000mAh Ultra Fast charging.", mrp: 5000, price: 3499, images: [], category: "Charger" }
]

async function main() {
    try {
        // Get or create default store
        let store = await prisma.store.findFirst()
        
        if (!store) {
            console.log('Creating default store...')
            store = await prisma.store.create({
                data: {
                    userId: "seed-user",
                    name: "Default Store",
                    description: "Default store for products",
                    username: "default-store",
                    address: "Default Address",
                    logo: "",
                    email: "store@example.com",
                    contact: "0000000000"
                }
            })
            console.log('✅ Store created:', store.id)
        }

        // Create products
        let createdCount = 0
        for (const product of dummyProducts) {
            // Check if product with same name exists
            const existing = await prisma.product.findFirst({
                where: { name: product.name }
            })

            if (!existing) {
                await prisma.product.create({
                    data: {
                        ...product,
                        storeId: store.id
                    }
                })
                createdCount++
                console.log(`✅ Created: ${product.name}`)
            }
        }

        console.log(`\n✅ Seeding complete! Created ${createdCount} products`)
        console.log(`Store ID: ${store.id}`)
    } catch (error) {
        console.error('❌ Seeding failed:', error.message)
        process.exit(1)
    } finally {
        await prisma.$disconnect()
    }
}

main()
