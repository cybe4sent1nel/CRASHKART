import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { sendPasswordResetEmail } from '@/lib/email';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

let prisma;

function getPrismaClient() {
    if (!prisma) {
        prisma = new PrismaClient();
    }
    return prisma;
}

/**
 * POST /api/auth/forgot-password
 * Send password reset email
 */
export async function POST(request) {
  const client = getPrismaClient();
  
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await client.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    // Always return success to prevent email enumeration
    if (!user) {
      console.log(`Password reset requested for non-existent email: ${email}`);
      return NextResponse.json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.'
      });
    }

    // Check if user signed up with Google (no password)
    if (user.loginMethod === 'google' && !user.password) {
      return NextResponse.json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.'
      });
    }

    // Generate secure reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    
    // Token expires in 1 hour
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    // Delete any existing tokens for this email
    await client.passwordResetToken.deleteMany({
      where: { email: email.toLowerCase() }
    });

    // Create new password reset token
    await client.passwordResetToken.create({
      data: {
        email: email.toLowerCase(),
        token: hashedToken,
        expiresAt
      }
    });

    // Send password reset email
    const emailResult = await sendPasswordResetEmail(
      email,
      resetToken, // Send unhashed token in email
      user.name || 'User'
    );

    if (!emailResult.success) {
      console.error('Failed to send password reset email:', emailResult.error);
      return NextResponse.json(
        { success: false, error: 'Failed to send email. Please try again.' },
        { status: 500 }
      );
    }

    console.log(`Password reset email sent to: ${email}`);

    return NextResponse.json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.'
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { success: false, error: 'An error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
