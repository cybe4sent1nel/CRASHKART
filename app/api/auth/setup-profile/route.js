import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request) {
    try {
        const { userId, name, phone, address, dateOfBirth, gender, profileImage } = await request.json();

        if (!userId || !name) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Update user with profile information
        const user = await prisma.user.update({
            where: { id: userId },
            data: {
                name,
                phone: phone || undefined,
                image: profileImage || undefined,
                isProfileSetup: true
            },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                image: true,
                isProfileSetup: true,
                loginMethod: true
            }
        });

        // Create default address if provided
        if (address) {
            await prisma.address.create({
                data: {
                    userId,
                    name,
                    email: user.email,
                    street: address.street || '',
                    city: address.city || '',
                    state: address.state || '',
                    zip: address.zip || '',
                    country: address.country || 'India',
                    phone: phone || ''
                }
            });
        }

        return NextResponse.json({
            success: true,
            user,
            message: 'Profile setup completed'
        });

    } catch (error) {
        console.error('Profile setup error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
