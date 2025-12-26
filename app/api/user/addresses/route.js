import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

// GET all addresses for user
export async function GET(req) {
    try {
        // Get userId from query parameter or headers
        const email = req.headers.get('x-user-email') || new URL(req.url).searchParams.get('email');
        
        if (!email) {
            return NextResponse.json({ error: 'Email required' }, { status: 400 });
        }
        
        // Find user by email
        const user = await prisma.user.findUnique({
            where: { email },
            select: { id: true }
        });
        
        const userId = user?.id;

        if (!userId) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const addresses = await prisma.address.findMany({
            where: { userId },
            orderBy: [
                { isDefault: 'desc' },
                { createdAt: 'desc' }
            ]
        });

        return NextResponse.json({ addresses });
    } catch (error) {
        console.error('Error fetching addresses:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// CREATE new address
export async function POST(req) {
    try {
        const email = req.headers.get('x-user-email') || new URL(req.url).searchParams.get('email');
        
        if (!email) {
            return NextResponse.json({ error: 'Email required' }, { status: 400 });
        }
        
        const user = await prisma.user.findUnique({
            where: { email },
            select: { id: true }
        });
        
        const userId = user?.id;

        if (!userId) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const body = await req.json();
        const {
            name,
            phone,
            street,
            city,
            state,
            zip,
            country,
            isDefault,
            latitude,
            longitude
        } = body;

        // Validate required fields
        if (!name || !email || !phone || !street || !city || !state || !zip) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // If this is set as default, unset other defaults
        if (isDefault) {
            await prisma.address.updateMany({
                where: { userId, isDefault: true },
                data: { isDefault: false }
            });
        }

        const address = await prisma.address.create({
            data: {
                userId,
                name,
                email,
                phone,
                street,
                city,
                state,
                zip,
                country: country || 'India',
                isDefault: isDefault || false,
                latitude: latitude ? parseFloat(latitude) : null,
                longitude: longitude ? parseFloat(longitude) : null
            }
        });

        return NextResponse.json(address, { status: 201 });
    } catch (error) {
        console.error('Error creating address:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// UPDATE address
export async function PUT(req) {
    try {
        const email = req.headers.get('x-user-email') || new URL(req.url).searchParams.get('email');
        
        if (!email) {
            return NextResponse.json({ error: 'Email required' }, { status: 400 });
        }
        
        const user = await prisma.user.findUnique({
            where: { email },
            select: { id: true }
        });
        
        const userId = user?.id;

        if (!userId) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const body = await req.json();
        const {
            id,
            name,
            phone,
            street,
            city,
            state,
            zip,
            country,
            isDefault,
            latitude,
            longitude
        } = body;

        if (!id) {
            return NextResponse.json(
                { error: 'Address ID required' },
                { status: 400 }
            );
        }

        // Verify user owns this address
        const existingAddress = await prisma.address.findUnique({
            where: { id }
        });

        if (!existingAddress || existingAddress.userId !== userId) {
            return NextResponse.json(
                { error: 'Not authorized to update this address' },
                { status: 403 }
            );
        }

        // If this is set as default, unset other defaults
        if (isDefault) {
            await prisma.address.updateMany(
                { where: { userId, isDefault: true, NOT: { id } } },
                { data: { isDefault: false } }
            );
        }

        const updatedAddress = await prisma.address.update({
            where: { id },
            data: {
                ...(name && { name }),
                ...(email && { email }),
                ...(phone && { phone }),
                ...(street && { street }),
                ...(city && { city }),
                ...(state && { state }),
                ...(zip && { zip }),
                ...(country && { country }),
                ...(isDefault !== undefined && { isDefault }),
                ...(latitude !== undefined && { latitude: latitude ? parseFloat(latitude) : null }),
                ...(longitude !== undefined && { longitude: longitude ? parseFloat(longitude) : null })
            }
        });

        return NextResponse.json(updatedAddress);
    } catch (error) {
        console.error('Error updating address:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE address
export async function DELETE(req) {
    try {
        const email = req.headers.get('x-user-email') || new URL(req.url).searchParams.get('email');
        
        if (!email) {
            return NextResponse.json({ error: 'Email required' }, { status: 400 });
        }
        
        const user = await prisma.user.findUnique({
            where: { email },
            select: { id: true }
        });
        
        const userId = user?.id;

        if (!userId) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const { searchParams } = new URL(req.url);
        const addressId = searchParams.get('id');

        if (!addressId) {
            return NextResponse.json(
                { error: 'Address ID required' },
                { status: 400 }
            );
        }

        // Verify user owns this address
        const address = await prisma.address.findUnique({
            where: { id: addressId }
        });

        if (!address || address.userId !== userId) {
            return NextResponse.json(
                { error: 'Not authorized to delete this address' },
                { status: 403 }
            );
        }

        // Check if address is used in any orders
        const ordersWithAddress = await prisma.order.findFirst({
            where: { addressId: addressId }
        });

        if (ordersWithAddress) {
            return NextResponse.json(
                { error: 'Cannot delete address that is used in existing orders' },
                { status: 400 }
            );
        }

        // Delete the address
        await prisma.address.delete({
            where: { id: addressId }
        });

        // If this was the default, set another as default
        if (address.isDefault) {
            const anotherAddress = await prisma.address.findFirst({
                where: { userId },
                orderBy: { createdAt: 'desc' }
            });

            if (anotherAddress) {
                await prisma.address.update({
                    where: { id: anotherAddress.id },
                    data: { isDefault: true }
                });
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting address:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
