import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function dropPhoneUniqueIndex() {
  try {
    console.log('Dropping unique index on phone field...');
    
    // Access the MongoDB collection directly
    const db = prisma.$queryRawUnsafe;
    
    // Use Prisma's executeRaw to run MongoDB commands
    await prisma.$runCommandRaw({
      dropIndexes: 'User',
      index: 'User_phone_key'
    });

    console.log('✅ Successfully dropped User_phone_key index');
  } catch (error) {
    if (error.message?.includes('index not found')) {
      console.log('ℹ️  Index already dropped or does not exist');
    } else {
      console.error('❌ Error dropping index:', error.message);
      throw error;
    }
  } finally {
    await prisma.$disconnect();
  }
}

dropPhoneUniqueIndex();
