import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { sendPasswordChangedEmail } from '@/lib/email'
import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import { passwordIssues } from '@/lib/passwordPolicy'

export const dynamic = 'force-dynamic'

let prisma

function getPrismaClient() {
  if (!prisma) {
    prisma = new PrismaClient()
  }
  return prisma
}

function maskEmail(email) {
  return email.replace(/(.{2})(.*)(@.*)/, '$1***$3')
}

// GET /api/auth/reset-password?token=...
// Validate a reset token and return masked email if valid
export async function GET(request) {
  const client = getPrismaClient()

  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json({ success: false, valid: false, error: 'Token is required' }, { status: 400 })
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex')

    const resetToken = await client.passwordResetToken.findFirst({
      where: {
        token: hashedToken,
        isUsed: false,
        expiresAt: { gt: new Date() }
      }
    })

    if (!resetToken) {
      return NextResponse.json({ success: true, valid: false, error: 'Invalid or expired reset token' })
    }

    return NextResponse.json({
      success: true,
      valid: true,
      email: maskEmail(resetToken.email)
    })
  } catch (error) {
    console.error('Verify token error:', error)
    return NextResponse.json({ success: false, valid: false, error: 'An error occurred' }, { status: 500 })
  }
}

// POST /api/auth/reset-password
// Reset password using a valid token
export async function POST(request) {
  const client = getPrismaClient()

  try {
    const { token, password, confirmPassword } = await request.json()

    if (!token) {
      return NextResponse.json({ success: false, error: 'Reset token is required' }, { status: 400 })
    }

    if (!password || !confirmPassword) {
      return NextResponse.json({ success: false, error: 'Password and confirmation are required' }, { status: 400 })
    }

    if (password !== confirmPassword) {
      return NextResponse.json({ success: false, error: 'Passwords do not match' }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ success: false, error: 'Password must be at least 8 characters long' }, { status: 400 })
    }

    const issues = passwordIssues(password)
    if (issues.length > 0) {
      return NextResponse.json({ success: false, error: 'Password does not meet requirements', issues }, { status: 400 })
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex')

    const resetToken = await client.passwordResetToken.findFirst({
      where: {
        token: hashedToken,
        isUsed: false,
        expiresAt: { gt: new Date() }
      }
    })

    if (!resetToken) {
      return NextResponse.json({ success: false, error: 'Invalid or expired reset token. Please request a new one.' }, { status: 400 })
    }

    const user = await client.user.findUnique({ where: { email: resetToken.email } })
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    await client.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        loginMethod: 'password',
        ...(user.sessionVersion !== undefined ? { sessionVersion: { increment: 1 } } : {})
      }
    })

    await client.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { isUsed: true }
    })

    // Fire-and-forget email; don't fail the reset if email send fails
    sendPasswordChangedEmail(resetToken.email).catch((err) => console.error('Password changed email error:', err))

    return NextResponse.json({ success: true, message: 'Password reset successful', email: maskEmail(resetToken.email) })
  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json({ success: false, error: 'An error occurred' }, { status: 500 })
  }
}
