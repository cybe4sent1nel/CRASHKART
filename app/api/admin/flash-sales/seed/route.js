'use server'
import { PrismaClient } from '@prisma/client'
import { NextResponse } from 'next/server'

const prisma = new PrismaClient()

export async function POST(request) {
    try {
        // Get all products
        const allProducts = await prisma.product.findMany({
            select: { id: true },
            take: 26
        })

        if (allProducts.length < 5) {
            return NextResponse.json(
                { error: 'Not enough products to create flash sales' },
                { status: 400 }
            )
        }

        // Clear existing flash sales
        await prisma.flashSale.deleteMany({})

        // Create Flash Sale 1: Electronics Mega Sale
        const sale1Products = allProducts.slice(0, 5).map(p => p.id)
        
        const flashSale1 = await prisma.flashSale.create({
            data: {
                title: 'Electronics Mega Sale',
                description: 'Get up to 30% off on all electronics. Limited time offer!',
                products: sale1Products,
                discount: 30,
                maxQuantity: 50,
                startTime: new Date(),
                endTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
                bannerImage: null,
                isActive: true
            }
        })

        // Create Flash Sale 2: Fashion Fiesta
        const sale2Products = allProducts.slice(5, 10).map(p => p.id)
        
        const flashSale2 = await prisma.flashSale.create({
            data: {
                title: 'Fashion Fiesta',
                description: 'Upto 25% off on trending fashion items',
                products: sale2Products,
                discount: 25,
                maxQuantity: 75,
                startTime: new Date(),
                endTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
                bannerImage: null,
                isActive: true
            }
        })

        // Create Flash Sale 3: Home & Kitchen
        const sale3Products = allProducts.slice(10, 15).map(p => p.id)
        
        const flashSale3 = await prisma.flashSale.create({
            data: {
                title: 'Home Essentials Flash Sale',
                description: 'Transform your home with our exclusive 35% discount',
                products: sale3Products,
                discount: 35,
                maxQuantity: 100,
                startTime: new Date(),
                endTime: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // 4 days from now
                bannerImage: null,
                isActive: true
            }
        })

        // Create Flash Sale 4: Books & More
        const sale4Products = allProducts.slice(15, 20).map(p => p.id)
        
        const flashSale4 = await prisma.flashSale.create({
            data: {
                title: 'Books & Media Bonanza',
                description: 'Knowledge at great prices - 20% off',
                products: sale4Products,
                discount: 20,
                maxQuantity: 200,
                startTime: new Date(),
                endTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
                bannerImage: null,
                isActive: true
            }
        })

        const totalProducts = sale1Products.length + sale2Products.length + sale3Products.length + sale4Products.length

        return NextResponse.json({
            success: true,
            message: 'Flash sales seeded successfully',
            data: {
                flashSalesCreated: 4,
                totalProducts: totalProducts,
                sales: [flashSale1.title, flashSale2.title, flashSale3.title, flashSale4.title]
            }
        }, { status: 201 })

    } catch (error) {
        console.error('Error seeding flash sales:', error)
        return NextResponse.json(
            { error: 'Failed to seed flash sales', details: error.message },
            { status: 500 }
        )
    }
}
