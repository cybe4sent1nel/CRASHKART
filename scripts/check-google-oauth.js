#!/usr/bin/env node

/**
 * NextAuth Google OAuth Configuration Checker
 * 
 * This script validates your Google OAuth setup for NextAuth
 * Run: node scripts/check-google-oauth.js
 */

import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') })

console.log('🔍 Checking Google OAuth Configuration...\n')

const checks = []

// Check 1: Google Client ID
const clientId = process.env.GOOGLE_CLIENT_ID
if (!clientId) {
    checks.push({ name: 'GOOGLE_CLIENT_ID', status: '❌', message: 'Missing' })
} else if (!clientId.endsWith('.apps.googleusercontent.com')) {
    checks.push({ name: 'GOOGLE_CLIENT_ID', status: '⚠️', message: 'Invalid format (should end with .apps.googleusercontent.com)' })
} else {
    checks.push({ name: 'GOOGLE_CLIENT_ID', status: '✅', message: 'Valid' })
}

// Check 2: Google Client Secret
const clientSecret = process.env.GOOGLE_CLIENT_SECRET
if (!clientSecret) {
    checks.push({ name: 'GOOGLE_CLIENT_SECRET', status: '❌', message: 'Missing' })
} else if (!clientSecret.startsWith('GOCSPX-')) {
    checks.push({ name: 'GOOGLE_CLIENT_SECRET', status: '⚠️', message: 'Unexpected format (usually starts with GOCSPX-)' })
} else {
    checks.push({ name: 'GOOGLE_CLIENT_SECRET', status: '✅', message: 'Valid' })
}

// Check 3: NextAuth Secret
const nextAuthSecret = process.env.NEXTAUTH_SECRET
if (!nextAuthSecret) {
    checks.push({ name: 'NEXTAUTH_SECRET', status: '❌', message: 'Missing' })
} else if (nextAuthSecret.length < 32) {
    checks.push({ name: 'NEXTAUTH_SECRET', status: '⚠️', message: `Too short (${nextAuthSecret.length} chars, minimum 32 recommended)` })
} else {
    checks.push({ name: 'NEXTAUTH_SECRET', status: '✅', message: `Valid (${nextAuthSecret.length} chars)` })
}

// Check 4: NextAuth URL
const nextAuthUrl = process.env.NEXTAUTH_URL
if (!nextAuthUrl) {
    checks.push({ name: 'NEXTAUTH_URL', status: '❌', message: 'Missing' })
} else if (nextAuthUrl === 'http://localhost:3000') {
    checks.push({ name: 'NEXTAUTH_URL', status: '⚠️', message: 'Set to localhost (change for production!)' })
} else if (!nextAuthUrl.startsWith('http://') && !nextAuthUrl.startsWith('https://')) {
    checks.push({ name: 'NEXTAUTH_URL', status: '❌', message: 'Invalid URL format' })
} else if (nextAuthUrl.endsWith('/')) {
    checks.push({ name: 'NEXTAUTH_URL', status: '⚠️', message: 'Remove trailing slash' })
} else if (nextAuthUrl.startsWith('https://')) {
    checks.push({ name: 'NEXTAUTH_URL', status: '✅', message: 'Valid (HTTPS)' })
} else {
    checks.push({ name: 'NEXTAUTH_URL', status: '✅', message: 'Valid (HTTP - use HTTPS in production)' })
}

// Check 5: Database URL
const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
    checks.push({ name: 'DATABASE_URL', status: '❌', message: 'Missing (required for user storage)' })
} else {
    checks.push({ name: 'DATABASE_URL', status: '✅', message: 'Set' })
}

// Display results
console.log('Environment Variables:\n')
checks.forEach(check => {
    console.log(`${check.status} ${check.name.padEnd(25)} ${check.message}`)
})

// Calculate overall status
const hasErrors = checks.some(c => c.status === '❌')
const hasWarnings = checks.some(c => c.status === '⚠️')

console.log('\n' + '='.repeat(60))

if (hasErrors) {
    console.log('❌ Configuration has errors - Google OAuth will not work')
    console.log('\n📖 Please check: docs/NEXTAUTH_GOOGLE_OAUTH_GUIDE.md')
    process.exit(1)
} else if (hasWarnings) {
    console.log('⚠️  Configuration has warnings - review before production')
    console.log('\n📖 See guide: docs/NEXTAUTH_GOOGLE_OAUTH_GUIDE.md')
} else {
    console.log('✅ All checks passed!')
}

// Additional checks
console.log('\n' + '='.repeat(60))
console.log('\n📋 Additional Information:\n')

if (nextAuthUrl) {
    const callbackUrl = `${nextAuthUrl}/api/auth/callback/google`
    console.log(`Google Redirect URI (add this in Google Console):`)
    console.log(`   ${callbackUrl}`)
}

console.log('\n🔐 Security Recommendations:')
console.log('   • Never commit .env file to version control')
console.log('   • Use environment variables in deployment (Vercel, etc.)')
console.log('   • Regenerate NEXTAUTH_SECRET for production')
console.log('   • Enable HTTPS in production')

console.log('\n🧪 Testing Steps:')
console.log('   1. Start dev server: npm run dev')
console.log('   2. Go to: http://localhost:3000/login')
console.log('   3. Click "Sign in with Google"')
console.log('   4. Check browser console for errors')
console.log('   5. Check server logs for sync errors')

console.log('\n📚 Resources:')
console.log('   • Troubleshooting: docs/NEXTAUTH_GOOGLE_OAUTH_GUIDE.md')
console.log('   • NextAuth Docs: https://next-auth.js.org/')
console.log('   • Google Console: https://console.cloud.google.com/')

console.log('\n' + '='.repeat(60) + '\n')
