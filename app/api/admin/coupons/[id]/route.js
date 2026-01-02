import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// PATCH /api/admin/coupons/[id] - Update coupon
export async function PATCH(req, { params }) {
    try {
        const { id } = params
        const body = await req.json()

        const coupon = await prisma.coupon.update({
            where: { id },
            data: body
        })

        return NextResponse.json({
            success: true,
            coupon,
            message: 'Coupon updated successfully'
        })
    } catch (error) {
        console.error('❌ Error updating coupon:', error)
        return NextResponse.json(
            { 
                success: false, 
                error: 'Failed to update coupon',
                message: error.message 
            },
            { status: 500 }
        )
    }
}

// DELETE /api/admin/coupons/[id] - Delete coupon
export async function DELETE(req, { params }) {
    try {
        const { id } = params

        await prisma.coupon.delete({
            where: { id }
        })

        return NextResponse.json({
            success: true,
            message: 'Coupon deleted successfully'
        })
    } catch (error) {
        console.error('❌ Error deleting coupon:', error)
        return NextResponse.json(
            { 
                success: false, 
                error: 'Failed to delete coupon',
                message: error.message 
            },
            { status: 500 }
        )
    }
}
