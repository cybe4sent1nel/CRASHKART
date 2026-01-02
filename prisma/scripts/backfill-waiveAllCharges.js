#!/usr/bin/env node
/**
 * Backfill script to set `waiveAllCharges` = true for coupons whose
 * `appliesToCharges` contains shipping, convenience and platform.
 *
 * Run after `npx prisma db push`:
 *   node prisma/scripts/backfill-waiveAllCharges.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Backfilling waiveAllCharges from appliesToCharges...');

  try {
    // Use raw MongoDB update via prisma.$runCommandRaw to avoid Prisma type
    // validation issues in some environments. This sets `waiveAllCharges: true`
    // where `appliesToCharges` contains all three target entries and the
    // flag is missing or false.
    const rawUpdate = {
      update: 'Coupon',
      updates: [
        {
          q: {
            $and: [
              { appliesToCharges: { $all: ['shipping', 'convenience', 'platform'] } },
              { $or: [ { waiveAllCharges: false }, { waiveAllCharges: { $exists: false } } ] }
            ]
          },
          u: { $set: { waiveAllCharges: true } },
          upsert: false
        }
      ]
    };

    const rawRes = await prisma.$runCommandRaw(rawUpdate);
    console.log('Raw update result:', JSON.stringify(rawRes));

    // Ensure any documents missing the field are initialized to false
    const initCmd = {
      update: 'Coupon',
      updates: [
        {
          q: { waiveAllCharges: { $exists: false } },
          u: { $set: { waiveAllCharges: false } },
          upsert: false
        }
      ]
    };

    try {
      const initRes = await prisma.$runCommandRaw(initCmd);
      console.log('Init field raw result:', JSON.stringify(initRes));
    } catch (err) {
      console.log('Init raw command failed (non-fatal):', err.message || err);
    }

    console.log('✅ Backfill complete.');
  } catch (err) {
    console.error('❌ Backfill error:', err);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();
