import { prisma } from '@/lib/prisma'
import { sendAdminApprovedEmail, sendAdminRejectedEmail } from '@/lib/email'

const MAIN_ADMIN_EMAIL = 'crashkart.help@gmail.com'

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url)
        const token = searchParams.get('token')
        const action = searchParams.get('action')

        if (!token || !action || !['approve', 'reject'].includes(action)) {
            return new Response(
                `<html><body><h1>Invalid Request</h1><p>Token or action is missing.</p></body></html>`,
                { status: 400, headers: { 'Content-Type': 'text/html' } }
            )
        }

        // Find the access request
        const accessRequest = await prisma.adminAccessRequest.findUnique({
            where: { approvalToken: token }
        })

        if (!accessRequest) {
            return new Response(
                `<html><body><h1>Invalid Token</h1><p>The approval token is invalid or has expired.</p></body></html>`,
                { status: 404, headers: { 'Content-Type': 'text/html' } }
            )
        }

        if (accessRequest.status !== 'pending') {
            return new Response(
                `<html><body><h1>Already Processed</h1><p>This request has already been ${accessRequest.status}.</p></body></html>`,
                { status: 400, headers: { 'Content-Type': 'text/html' } }
            )
        }

        if (action === 'approve') {
            // Find the user and escalate to admin
            const user = await prisma.user.findUnique({
                where: { email: accessRequest.email }
            })

            if (!user) {
                return new Response(
                    `<html><body><h1>User Not Found</h1><p>No user account found with email ${accessRequest.email}. Please create an account first.</p></body></html>`,
                    { status: 404, headers: { 'Content-Type': 'text/html' } }
                )
            }

            // Escalate user to admin role
            await prisma.user.update({
                where: { id: user.id },
                data: { role: 'admin' }
            })

            // Update request status to approved
            const updatedRequest = await prisma.adminAccessRequest.update({
                where: { id: accessRequest.id },
                data: {
                    status: 'approved',
                    reviewedAt: new Date(),
                    reviewedBy: MAIN_ADMIN_EMAIL
                }
            })

            // Send approval email to requester
            const loginLink = `${process.env.NEXT_PUBLIC_APP_URL}/admin/login`
            await sendAdminApprovedEmail(accessRequest.email, {
                loginLink,
                mainAdminEmail: MAIN_ADMIN_EMAIL
            })

            return new Response(
                `<html>
                    <head>
                        <style>
                            body { font-family: Arial, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
                            .container { background: white; padding: 40px; border-radius: 10px; text-align: center; box-shadow: 0 10px 40px rgba(0,0,0,0.1); max-width: 500px; }
                            h1 { color: #10b981; margin: 0 0 10px 0; }
                            p { color: #6b7280; margin: 10px 0; }
                            .highlight { color: #ef4444; font-weight: bold; }
                            a { color: #667eea; text-decoration: none; font-weight: bold; }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <h1>✅ Approved!</h1>
                            <p>Admin access has been <span class="highlight">approved</span> for:</p>
                            <p><strong>${accessRequest.email}</strong></p>
                            <p>A confirmation email has been sent with login instructions.</p>
                            <p style="margin-top: 30px;"><a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/login">Go to Admin Login →</a></p>
                        </div>
                    </body>
                </html>`,
                { status: 200, headers: { 'Content-Type': 'text/html' } }
            )
        } else {
            // Update request status to rejected
            await prisma.adminAccessRequest.update({
                where: { id: accessRequest.id },
                data: {
                    status: 'rejected',
                    reviewedAt: new Date(),
                    reviewedBy: MAIN_ADMIN_EMAIL
                }
            })

            // Send rejection email to requester
            await sendAdminRejectedEmail(accessRequest.email, {
                mainAdminEmail: MAIN_ADMIN_EMAIL
            })

            return new Response(
                `<html>
                    <head>
                        <style>
                            body { font-family: Arial, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); }
                            .container { background: white; padding: 40px; border-radius: 10px; text-align: center; box-shadow: 0 10px 40px rgba(0,0,0,0.1); max-width: 500px; }
                            h1 { color: #ef4444; margin: 0 0 10px 0; }
                            p { color: #6b7280; margin: 10px 0; }
                            .highlight { color: #ef4444; font-weight: bold; }
                            a { color: #667eea; text-decoration: none; font-weight: bold; }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <h1>❌ Request Declined</h1>
                            <p>The admin access request for <strong>${accessRequest.email}</strong> has been <span class="highlight">declined</span>.</p>
                            <p>If you believe this is a mistake, please contact the admin team.</p>
                            <p style="margin-top: 30px;"><a href="${process.env.NEXT_PUBLIC_APP_URL}">Return to Home →</a></p>
                        </div>
                    </body>
                </html>`,
                { status: 200, headers: { 'Content-Type': 'text/html' } }
            )
        }
    } catch (error) {
        console.error('Admin approval error:', error)
        return new Response(
            `<html><body><h1>Error</h1><p>An error occurred while processing your request.</p></body></html>`,
            { status: 500, headers: { 'Content-Type': 'text/html' } }
        )
    }
}
