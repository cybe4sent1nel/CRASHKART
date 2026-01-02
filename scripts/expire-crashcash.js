#!/usr/bin/env node
import { prisma } from '../lib/prisma'
import { expireDueCrashCashRewards } from '../lib/rewards'

async function run() {
    console.log('Running expire-crashcash job...')
    try {
        const result = await expireDueCrashCashRewards()
        console.log('Expire job result:', result)
    } catch (err) {
        console.error('Expire job failed:', err)
        process.exit(1)
    } finally {
        await prisma.$disconnect()
    }
}

run()
