// SMS service using Twilio or AWS SNS
// Install: npm install twilio

export async function POST(request) {
    try {
        const { phoneNumber, message } = await request.json()

        if (!phoneNumber || !message) {
            return new Response(
                JSON.stringify({ error: 'Missing required fields' }),
                { status: 400 }
            )
        }

        // Using Twilio
        if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
            const twilio = require('twilio')
            const client = twilio(
                process.env.TWILIO_ACCOUNT_SID,
                process.env.TWILIO_AUTH_TOKEN
            )

            const result = await client.messages.create({
                body: message,
                from: process.env.TWILIO_PHONE_NUMBER,
                to: formatPhoneNumber(phoneNumber)
            })

            return new Response(
                JSON.stringify({
                    success: true,
                    messageId: result.sid,
                    message: 'SMS sent successfully'
                }),
                { status: 200 }
            )
        }

        // Using AWS SNS (commented - aws-sdk not installed)
        // if (process.env.AWS_REGION && process.env.AWS_ACCESS_KEY_ID) {
        //     const AWS = require('aws-sdk')
        //     const sns = new AWS.SNS({
        //         region: process.env.AWS_REGION
        //     })
        //
        //     const result = await sns.publish({
        //         Message: message,
        //         PhoneNumber: formatPhoneNumber(phoneNumber)
        //     }).promise()
        //
        //     return new Response(
        //         JSON.stringify({
        //             success: true,
        //             messageId: result.MessageId,
        //             message: 'SMS sent successfully'
        //         }),
        //         { status: 200 }
        //     )
        // }

        // Demo mode - just log the message
        console.log(`[SMS] To: ${phoneNumber}, Message: ${message}`)
        return new Response(
            JSON.stringify({
                success: true,
                message: 'SMS queued (demo mode)',
                demo: true
            }),
            { status: 200 }
        )

    } catch (error) {
        console.error('SMS send error:', error)
        return new Response(
            JSON.stringify({
                error: error.message,
                success: false
            }),
            { status: 500 }
        )
    }
}

function formatPhoneNumber(phone) {
    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '')
    
    // Add country code if not present (India: +91)
    if (!cleaned.startsWith('91')) {
        return '+91' + cleaned.slice(-10)
    }
    return '+' + cleaned
}
