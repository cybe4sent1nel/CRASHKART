import nodemailer from 'nodemailer'

// Configure your email service
const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
})

export async function POST(request) {
    try {
        const { to, subject, html } = await request.json()

        if (!to || !subject || !html) {
            return new Response(
                JSON.stringify({ error: 'Missing required fields' }),
                { status: 400 }
            )
        }

        const mailOptions = {
            from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
            to,
            subject,
            html
        }

        const info = await transporter.sendMail(mailOptions)

        return new Response(
            JSON.stringify({ 
                success: true, 
                messageId: info.messageId,
                message: 'Email sent successfully'
            }),
            { status: 200 }
        )
    } catch (error) {
        console.error('Email send error:', error)
        return new Response(
            JSON.stringify({ 
                error: error.message,
                success: false
            }),
            { status: 500 }
        )
    }
}
