import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { sendPasswordChangedEmail } from '@/lib/email';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

let prisma;

function getPrismaClient() {
    if (!prisma) {
        prisma = new PrismaClient();
    }
    return prisma;
}

/**
 * POST /api/auth/reset-password
 * Reset password using token from email
 */
export async function POST(request) {
  const client = getPrismaClient();
  
  try {
    const { token, password, confirmPassword } = await request.json();

    // Validate inputs
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Reset token is required' },
        { status: 400 }
      );
    }

    if (!password || !confirmPassword) {
      return NextResponse.json(
        { success: false, error: 'Password and confirmation are required' },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { success: false, error: 'Passwords do not match' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // Hash the token from URL to match stored token
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find valid token
    const resetToken = await client.passwordResetToken.findFirst({
      where: {
        token: hashedToken,
        isUsed: false,
        expiresAt: {
          gt: new Date()
        }
      }
    });

    if (!resetToken) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired reset token. Please request a new one.' },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await client.user.findUnique({
      where: { email: resetToken.email }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Update user password
    await client.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        loginMethod: 'password' // Update login method to password
      }
    });

    // Mark token as used
    await client.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { isUsed: true }
    });

    // Send password changed confirmation email
    await sendPasswordChangedEmail(user.email, user.name || 'User');

    console.log(`Password reset successful for: ${user.email}`);

    return NextResponse.json({
      success: true,
      message: 'Password has been reset successfully. You can now log in with your new password.'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { success: false, error: 'An error occurred. Please try again.' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/auth/reset-password?token=xxx
 * Verify if reset token is valid
 */
export async function GET(request) {
  const client = getPrismaClient();
  
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { success: false, valid: false, error: 'Token is required' },
        { status: 400 }
      );
    }

    // Hash the token to match stored token
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find valid token
    const resetToken = await client.passwordResetToken.findFirst({
      where: {
        token: hashedToken,
        isUsed: false,
        expiresAt: {
          gt: new Date()
        }
      }
    });

    if (!resetToken) {
      return NextResponse.json({
        success: true,
        valid: false,
        error: 'Invalid or expired reset token'
      });
    }

    return NextResponse.json({
      success: true,
      valid: true,
      email: resetToken.email.replace(/(.{2})(.*)(@.*)/, '$1***$3') // Mask email
    });

  } catch (error) {
    console.error('Verify token error:', error);
    return NextResponse.json(
      { success: false, valid: false, error: 'An error occurred' },
      { status: 500 }
    );
  }
}
