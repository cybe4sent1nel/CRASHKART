#!/usr/bin/env node
/**
 * Helper script to backfill `appliesToCharges` for existing Coupon documents
 * Uses Prisma Client to issue a raw MongoDB update command.
 *
 * Usage:
 *   Ensure `DATABASE_URL` (and any other env vars) are available, then run:
 *     node prisma/scripts/apply_appliesToCharges_mongo.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Running appliesToCharges backfill via Prisma Client...');

  try {
    // Raw MongoDB update command to set appliesToCharges: [] where it doesn't exist
    const rawCmd = {
      update: 'Coupon',
      updates: [
        {
          q: { appliesToCharges: { $exists: false } },
          u: { $set: { appliesToCharges: [] } },
          upsert: false
        }
      ]
    };

    const rawRes = await prisma.$runCommandRaw(rawCmd);
    console.log('Raw update result:', JSON.stringify(rawRes));

    // Normalize documents with appliesToCharges: null
    try {
      const nullRes = await prisma.coupon.updateMany({
        where: { appliesToCharges: null },
        data: { appliesToCharges: [] }
      });
      console.log('Normalized null fields result:', nullRes);
    } catch (err) {
      console.log('No null-field coupons or updateMany not supported in this environment:', err.message || err);
    }

    console.log('✅ Backfill completed.');
  } catch (err) {
    console.error('❌ Error while running backfill:', err);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();
