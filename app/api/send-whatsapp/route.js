// WhatsApp service using Twilio WhatsApp or similar
// Requires: npm install twilio

export async function POST(request) {
    try {
        const { phoneNumber, message } = await request.json()

        if (!phoneNumber || !message) {
            return new Response(
                JSON.stringify({ error: 'Missing required fields' }),
                { status: 400 }
            )
        }

        // Using Twilio WhatsApp
        if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
            const twilio = require('twilio')
            const client = twilio(
                process.env.TWILIO_ACCOUNT_SID,
                process.env.TWILIO_AUTH_TOKEN
            )

            const result = await client.messages.create({
                body: message,
                from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
                to: `whatsapp:${formatPhoneNumber(phoneNumber)}`
            })

            return new Response(
                JSON.stringify({
                    success: true,
                    messageId: result.sid,
                    message: 'WhatsApp message sent successfully'
                }),
                { status: 200 }
            )
        }

        // Using WhatsApp Business API
        if (process.env.WHATSAPP_BUSINESS_ACCOUNT_ID && process.env.WHATSAPP_API_TOKEN) {
            const response = await fetch(
                `https://graph.instagram.com/v18.0/${process.env.WHATSAPP_BUSINESS_ACCOUNT_ID}/messages`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${process.env.WHATSAPP_API_TOKEN}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        messaging_product: 'whatsapp',
                        recipient_type: 'individual',
                        to: formatPhoneNumber(phoneNumber),
                        type: 'text',
                        text: {
                            preview_url: true,
                            body: message
                        }
                    })
                }
            )

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error?.message || 'WhatsApp API error')
            }

            return new Response(
                JSON.stringify({
                    success: true,
                    messageId: data.messages[0].id,
                    message: 'WhatsApp message sent successfully'
                }),
                { status: 200 }
            )
        }

        // Demo mode - just log the message
        console.log(`[WhatsApp] To: ${phoneNumber}, Message: ${message}`)
        return new Response(
            JSON.stringify({
                success: true,
                message: 'WhatsApp message queued (demo mode)',
                demo: true
            }),
            { status: 200 }
        )

    } catch (error) {
        console.error('WhatsApp send error:', error)
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
    const cleaned = phone.replace(/\D/g, '')
    
    if (!cleaned.startsWith('91')) {
        return '91' + cleaned.slice(-10)
    }
    return cleaned
}
