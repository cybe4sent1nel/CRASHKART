import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

// GET user profile
export async function GET(req) {
    try {
        // Get email from request headers or query
        const email = req.headers.get('x-user-email') || new URL(req.url).searchParams.get('email');
        
        if (!email) {
            return NextResponse.json({ error: 'Email required' }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { email },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                image: true,
                Address: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                        street: true,
                        city: true,
                        state: true,
                        zip: true,
                        country: true,
                        isDefault: true,
                        createdAt: true
                    },
                    orderBy: { createdAt: 'desc' }
                }
            }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json(user);
    } catch (error) {
        console.error('Error fetching user profile:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// UPDATE user profile
export async function PUT(req) {
    try {
        const body = await req.json();
        const { name, phone, image, address, email } = body;

        console.log('[PUT /api/user/profile] Request body:', { name, phone, email });

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        // Find existing user
        let existingUser = await prisma.user.findUnique({
            where: { email }
        });

        let userId;

        if (existingUser) {
            userId = existingUser.id;
            console.log('[PUT /api/user/profile] Found user by email:', userId);
        } else {
            // Create user if doesn't exist
            console.log('[PUT /api/user/profile] Creating new user with email:', email);
            const newUser = await prisma.user.create({
                data: {
                    email,
                    name: name || 'User',
                    phone: phone || '',
                    isProfileSetup: true
                }
            });
            userId = newUser.id;
        }

        console.log('[PUT /api/user/profile] Updating user:', userId);

        // Update user profile
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                ...(name && { name }),
                ...(phone && { phone }),
                ...(image && { image }),
                isProfileSetup: true
            }
        });

        // If address is provided, update or create default address
        if (address) {
            try {
                // Find existing default address
                const existingDefaultAddress = await prisma.address.findFirst({
                    where: {
                        userId: userId
                    },
                    orderBy: { createdAt: 'desc' },
                    take: 1
                });

                if (existingDefaultAddress) {
                    // Update existing address
                    await prisma.address.update({
                        where: { id: existingDefaultAddress.id },
                        data: {
                            street: address,
                            name: name || 'Default Address',
                            email: email || updatedUser.email || '',
                            phone: phone || updatedUser.phone || '',
                            isDefault: true
                        }
                    });
                    console.log('[PUT /api/user/profile] Updated existing address');
                } else {
                    // Create new address
                    await prisma.address.create({
                        data: {
                            userId: userId,
                            street: address,
                            name: name || 'Default Address',
                            email: email || updatedUser.email || '',
                            phone: phone || updatedUser.phone || '',
                            city: 'Not Specified',
                            state: 'Not Specified',
                            zip: '000000',
                            country: 'India',
                            isDefault: true
                        }
                    });
                    console.log('[PUT /api/user/profile] Created new address');
                }
            } catch (addressError) {
                console.error('Error updating address:', addressError);
                // Continue even if address update fails
            }
        }

        // Fetch updated user with addresses
        const userWithAddresses = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                image: true,
                Address: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                        street: true,
                        city: true,
                        state: true,
                        zip: true,
                        country: true,
                        isDefault: true,
                        createdAt: true
                    },
                    orderBy: { createdAt: 'desc' }
                }
            }
        });

        console.log('[PUT /api/user/profile] Profile updated successfully');
        return NextResponse.json(userWithAddresses);
    } catch (error) {
        console.error('Error updating user profile:', {
            message: error.message,
            code: error.code
        });
        return NextResponse.json({ 
            error: 'Internal server error',
            details: error.message 
        }, { status: 500 });
    }
}
