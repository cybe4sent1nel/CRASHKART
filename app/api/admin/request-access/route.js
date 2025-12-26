import { prisma } from '@/lib/prisma'
import { sendAdminApprovalEmail } from '@/lib/email'
import crypto from 'crypto'

const MAIN_ADMIN_EMAIL = 'crashkart.help@gmail.com'

export async function POST(request) {
    try {
        const { email } = await request.json()

        if (!email) {
            return Response.json(
                { message: 'Email is required' },
                { status: 400 }
            )
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
            return Response.json(
                { message: 'Invalid email format' },
                { status: 400 }
            )
        }

        // Check if request already exists
        const existingRequest = await prisma.adminAccessRequest.findUnique({
            where: { email }
        })

        if (existingRequest) {
            if (existingRequest.status === 'pending') {
                return Response.json(
                    { message: 'Request already sent. Please wait for approval.' },
                    { status: 400 }
                )
            } else if (existingRequest.status === 'approved') {
                return Response.json(
                    { message: 'Your access has already been approved.' },
                    { status: 400 }
                )
            }
            // If rejected, allow resubmitting
        }

        // Generate unique approval token
        const approvalToken = crypto.randomBytes(32).toString('hex')

        // Create or update access request
        const accessRequest = await prisma.adminAccessRequest.upsert({
            where: { email },
            update: {
                status: 'pending',
                approvalToken,
                requestedAt: new Date()
            },
            create: {
                email,
                status: 'pending',
                approvalToken
            }
        })

        // Send approval email to main admin
        const approvalLink = `${process.env.NEXT_PUBLIC_APP_URL}/api/admin/approve-access?token=${approvalToken}&action=approve`
        const rejectLink = `${process.env.NEXT_PUBLIC_APP_URL}/api/admin/approve-access?token=${approvalToken}&action=reject`

        await sendAdminApprovalEmail(MAIN_ADMIN_EMAIL, {
            requesterEmail: email,
            approvalLink,
            rejectLink,
            requestId: accessRequest.id
        })

        return Response.json(
            { 
                message: 'Access request sent successfully',
                requestId: accessRequest.id
            },
            { status: 201 }
        )
    } catch (error) {
        console.error('Admin access request error:', error)
        return Response.json(
            { message: 'Internal server error' },
            { status: 500 }
        )
    }
}
