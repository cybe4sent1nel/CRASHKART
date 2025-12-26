import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendEmail } from '@/lib/email';
import { nanoid } from 'nanoid';

// POST - Create referral code or send referral invite
export async function POST(request) {
  try {
    const body = await request.json();
    const { action, userId, friendEmail, friendName } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    if (action === 'generate') {
      // Generate unique referral code
      const referralCode = `CK${nanoid(10).toUpperCase()}`;
      
      const referral = await prisma.referral.create({
        data: {
          referrerCode: referralCode,
          referrerId: userId,
          referredEmail: userId, // Self reference for code generation
          status: 'completed',
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        }
      });

      return NextResponse.json({
        success: true,
        referralCode: referralCode,
        referralUrl: `${process.env.NEXT_PUBLIC_APP_URL}?ref=${referralCode}`,
        message: 'Referral code generated'
      });
    }

    if (action === 'invite') {
      // Send invite to friend
      if (!friendEmail || !friendName) {
        return NextResponse.json(
          { error: 'Friend email and name required' },
          { status: 400 }
        );
      }

      // Get referrer info
      const referrer = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, email: true }
      });

      if (!referrer) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      // Generate referral code
      const referralCode = `CK${nanoid(10).toUpperCase()}`;

      // Create referral record
      const referral = await prisma.referral.create({
        data: {
          referrerCode: referralCode,
          referrerId: userId,
          referredEmail: friendEmail,
          status: 'pending',
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        }
      });

      // Send email invitation
      try {
        await sendEmail(friendEmail, {
          template: 'referral-invite',
          name: friendName,
          referrerName: referrer.name,
          referralCode: referralCode,
          referralUrl: `${process.env.NEXT_PUBLIC_APP_URL}?ref=${referralCode}`,
          rewardAmount: 500 // ₹500 reward
        });
      } catch (emailError) {
        console.error('Failed to send referral email:', emailError);
      }

      return NextResponse.json({
        success: true,
        message: `Invitation sent to ${friendEmail}`,
        referralCode: referralCode
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Referral error:', error);
    return NextResponse.json({ error: 'Failed to process referral' }, { status: 500 });
  }
}

// GET - Get referral stats for user
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Get all referrals made by this user
    const referrals = await prisma.referral.findMany({
      where: { referrerId: userId },
      orderBy: { createdAt: 'desc' }
    });

    // Calculate stats
    const stats = {
      totalInvites: referrals.length,
      completed: referrals.filter(r => r.status === 'completed').length,
      pending: referrals.filter(r => r.status === 'pending').length,
      expired: referrals.filter(r => r.status === 'expired').length,
      totalRewardsEarned: referrals.reduce((sum, r) => sum + r.referrerBonus, 0),
      totalFriendsRewards: referrals.reduce((sum, r) => sum + r.rewardAmount, 0)
    };

    return NextResponse.json({
      success: true,
      stats,
      referrals: referrals.map(r => ({
        code: r.referrerCode,
        email: r.referredEmail,
        status: r.status,
        yourReward: r.referrerBonus,
        theirReward: r.rewardAmount,
        date: r.createdAt
      }))
    });

  } catch (error) {
    console.error('Get referrals error:', error);
    return NextResponse.json({ error: 'Failed to fetch referrals' }, { status: 500 });
  }
}
