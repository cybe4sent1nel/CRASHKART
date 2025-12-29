/**
 * Referral System Helper Functions
 */

import prisma from './prisma';

/**
 * Process referral when referred user makes first purchase
 */
export async function completeReferral(referralCode, newUserId) {
  try {
    const referral = await prisma.referral.findUnique({
      where: { referrerCode: referralCode }
    });

    if (!referral || referral.status !== 'pending') {
      return { success: false, message: 'Invalid or expired referral code' };
    }

    // Check if already used
    if (referral.referredId) {
      return { success: false, message: 'Referral code already used' };
    }

    // Check if expired
    if (new Date() > referral.expiresAt) {
      await prisma.referral.update({
        where: { referrerCode: referralCode },
        data: { status: 'expired' }
      });
      return { success: false, message: 'Referral code expired' };
    }

    // Set rewards (customize these amounts)
    const REFERRER_BONUS = 500; // ₹500 for referrer
    const REFERRER_REWARD = 500; // ₹500 for new user

    // Update referral
    const updated = await prisma.referral.update({
      where: { referrerCode: referralCode },
      data: {
        referredId: newUserId,
        status: 'completed',
        completedAt: new Date(),
        referrerBonus: REFERRER_BONUS,
        rewardAmount: REFERRER_REWARD
      }
    });

    // TODO: Add bonus to referrer's account (CrashCash or wallet)
    // TODO: Add reward to referred user's account

    return {
      success: true,
      referral: updated,
      referrerBonus: REFERRER_BONUS,
      referredReward: REFERRER_REWARD
    };

  } catch (error) {
    console.error('Complete referral error:', error);
    return { success: false, message: 'Failed to process referral' };
  }
}

/**
 * Get user's referral code
 */
export async function getUserReferralCode(userId) {
  try {
    const referral = await prisma.referral.findFirst({
      where: {
        referrerId: userId,
        status: 'completed'
      }
    });

    return referral?.referrerCode || null;
  } catch (error) {
    console.error('Get referral code error:', error);
    return null;
  }
}

/**
 * Validate referral code before user signup
 */
export async function validateReferralCode(code) {
  try {
    const referral = await prisma.referral.findUnique({
      where: { referrerCode: code }
    });

    if (!referral) {
      return { valid: false, message: 'Code not found' };
    }

    if (referral.status !== 'pending' && referral.status !== 'completed') {
      return { valid: false, message: 'Code is not valid' };
    }

    if (new Date() > referral.expiresAt) {
      return { valid: false, message: 'Code has expired' };
    }

    if (referral.status === 'completed' && referral.referredId) {
      return { valid: false, message: 'Code has already been used' };
    }

    return { valid: true, referrerId: referral.referrerId };

  } catch (error) {
    console.error('Validate referral code error:', error);
    return { valid: false, message: 'Failed to validate code' };
  }
}

/**
 * Get referral statistics
 */
export async function getReferralStats(userId) {
  try {
    const referrals = await prisma.referral.findMany({
      where: { referrerId: userId }
    });

    const stats = {
      totalInvites: referrals.length,
      successfulReferrals: referrals.filter(r => r.status === 'completed').length,
      pendingReferrals: referrals.filter(r => r.status === 'pending').length,
      expiredReferrals: referrals.filter(r => r.status === 'expired').length,
      totalEarned: referrals.reduce((sum, r) => sum + r.referrerBonus, 0),
      totalFriendsEarned: referrals.reduce((sum, r) => sum + r.rewardAmount, 0),
      conversionRate: referrals.length > 0
        ? (referrals.filter(r => r.status === 'completed').length / referrals.length) * 100
        : 0
    };

    return stats;
  } catch (error) {
    console.error('Get referral stats error:', error);
    return null;
  }
}
