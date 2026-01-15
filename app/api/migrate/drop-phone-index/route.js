import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    // Add a secret key check for security
    const { secret } = await request.json();
    
    if (secret !== process.env.MIGRATION_SECRET) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('Dropping unique index on phone field...');
    
    await prisma.$runCommandRaw({
      dropIndexes: 'User',
      index: 'User_phone_key'
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Successfully dropped User_phone_key index' 
    });
  } catch (error) {
    if (error.message?.includes('index not found')) {
      return NextResponse.json({ 
        success: true, 
        message: 'Index already dropped or does not exist' 
      });
    }
    
    console.error('Error dropping index:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
