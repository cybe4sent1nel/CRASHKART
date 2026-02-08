import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { getSuperAdminEmails } from '../lib/adminAuth.js';

const prisma = new PrismaClient();

async function initSuperAdmins() {
  try {
    console.log('🔧 Initializing super admin accounts...');
    
    const superAdminEmails = getSuperAdminEmails();
    console.log(`📧 Found ${superAdminEmails.length} super admin email(s):`, superAdminEmails);
    
    for (const email of superAdminEmails) {
      // Check if admin already exists
      const existingAdmin = await prisma.admin.findUnique({
        where: { email }
      });
      
      if (existingAdmin) {
        console.log(`✅ Admin already exists: ${email}`);
        continue;
      }
      
      // Check if user exists
      let user = await prisma.user.findUnique({
        where: { email }
      });
      
      if (!user) {
        // Create user account
        user = await prisma.user.create({
          data: {
            id: crypto.randomUUID(),
            email,
            name: 'Super Admin',
            isProfileSetup: true,
            isEmailVerified: true,
            loginMethod: 'email'
          }
        });
        console.log(`👤 Created user account for: ${email}`);
      }
      
      // Create admin record
      await prisma.admin.create({
        data: {
          email,
          name: user.name || 'Super Admin',
          addedBy: null
        }
      });
      
      console.log(`✅ Created admin record for: ${email}`);
    }
    
    console.log('🎉 Super admin initialization complete!');
  } catch (error) {
    console.error('❌ Error initializing super admins:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

initSuperAdmins();
