import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'
import { winBackInactiveUserEmail } from '@/lib/emailTemplates'
import { NextResponse } from 'next/server'

// Generate random coupon code
const generateCouponCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = 'COMEBACK'
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

export async function POST(request) {
  try {
    // Verify this is a cron request (in production, verify with cron secret)
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    // Find users with no orders in the last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const inactiveUsers = await prisma.user.findMany({
      where: {
        OR: [
          {
            orders: {
              none: {
                createdAt: { gte: thirtyDaysAgo }
              }
            }
          },
          {
            lastLogin: { lt: thirtyDaysAgo }
          }
        ]
      },
      select: {
        id: true,
        name: true,
        email: true,
        orders: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { createdAt: true }
        }
      }
    })

    let emailsSent = 0
    let emailsFailed = 0

    for (const user of inactiveUsers) {
      try {
        // Check if already alerted
        const existingAlert = await prisma.inactiveUserAlert.findUnique({
          where: { userId: user.id }
        })

        if (existingAlert && existingAlert.emailSent) {
          continue // Skip if already sent email
        }

        const lastActivityDate = user.orders[0]?.createdAt || new Date(0)
        const daysSinceActivity = Math.floor(
          (Date.now() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24)
        )

        // Generate offer
        const offerCode = generateCouponCode()
        const offerDiscount = 20

        // Send email
        const emailContent = winBackInactiveUserEmail(user.name || 'Valued Customer', offerCode, offerDiscount)
        
        await sendEmail({
          to: user.email,
          subject: emailContent.subject,
          html: emailContent.html
        })

        // Create or update alert record
        if (existingAlert) {
          await prisma.inactiveUserAlert.update({
            where: { userId: user.id },
            data: {
              emailSent: true,
              emailSentAt: new Date(),
              daysSinceActivity,
              offerCode,
              offerDiscount
            }
          })
        } else {
          await prisma.inactiveUserAlert.create({
            data: {
              userId: user.id,
              userEmail: user.email,
              userName: user.name,
              emailSent: true,
              emailSentAt: new Date(),
              daysSinceActivity,
              offerCode,
              offerDiscount,
              lastOrderDate: lastActivityDate
            }
          })
        }

        emailsSent++
      } catch (error) {
        console.error(`Error processing user ${user.id}:`, error)
        emailsFailed++
      }
    }

    return NextResponse.json({
      message: 'Inactive user check completed',
      emailsSent,
      emailsFailed,
      totalProcessed: inactiveUsers.length
    })
  } catch (error) {
    console.error('Cron job error:', error)
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    )
  }
}
