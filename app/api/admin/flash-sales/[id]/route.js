'use server'
import { PrismaClient } from '@prisma/client'
import { NextResponse } from 'next/server'

const prisma = new PrismaClient()

// GET single flash sale
export async function GET(request, { params }) {
    try {
        const { id } = await params;
        
        const flashSale = await prisma.flashSale.findUnique({
            where: { id }
        })
        
        if (!flashSale) {
            return NextResponse.json({ error: 'Flash sale not found' }, { status: 404 })
        }
        
        // Get product details
        const products = await prisma.product.findMany({
            where: {
                id: {
                    in: flashSale.products
                }
            }
        })
        
        return NextResponse.json({
            ...flashSale,
            productDetails: products
        })
    } catch (error) {
        console.error('Error fetching flash sale:', error)
        return NextResponse.json({ error: 'Failed to fetch flash sale' }, { status: 500 })
    }
}

// UPDATE flash sale
export async function PUT(request, { params }) {
    try {
        const { id } = await params;
        const body = await request.json()
        
        const {
            title,
            description,
            products,
            discount,
            maxQuantity,
            startTime,
            endTime,
            isActive,
            bannerImage
        } = body
        
        const updateData = {}
        if (title) updateData.title = title
        if (description !== undefined) updateData.description = description
        if (products) updateData.products = products
        if (discount) updateData.discount = parseFloat(discount)
        if (maxQuantity) updateData.maxQuantity = parseInt(maxQuantity)
        if (startTime) updateData.startTime = new Date(startTime)
        if (endTime) updateData.endTime = new Date(endTime)
        if (isActive !== undefined) updateData.isActive = isActive
        if (bannerImage) updateData.bannerImage = bannerImage
        
        const flashSale = await prisma.flashSale.update({
            where: { id },
            data: updateData
        })
        
        return NextResponse.json(flashSale)
    } catch (error) {
        console.error('Error updating flash sale:', error)
        return NextResponse.json({ error: 'Failed to update flash sale' }, { status: 500 })
    }
}

// DELETE flash sale
export async function DELETE(request, { params }) {
    try {
        const { id } = await params;
        
        await prisma.flashSale.delete({
            where: { id }
        })
        
        return NextResponse.json({ message: 'Flash sale deleted successfully' })
    } catch (error) {
        console.error('Error deleting flash sale:', error)
        return NextResponse.json({ error: 'Failed to delete flash sale' }, { status: 500 })
    }
}
