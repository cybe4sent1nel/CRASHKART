import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(req) {
    try {
        const email = req.headers.get('email')
        if (!email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const user = await prisma.user.findUnique({ where: { email } })
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        const context = await req.json()
        const { userMessage, orderDetails, files, conversationHistory } = context

        // Build comprehensive prompt for AI
        let prompt = `You are a professional, empathetic customer support agent for CrashKart - a premier e-commerce platform for electronics, gadgets, and tech accessories.

YOUR CAPABILITIES:
- Order tracking, cancellations, modifications
- Returns & refunds processing
- Payment issue resolution
- Shipping & delivery inquiries
- Product information & recommendations
- Account management assistance
- Complaint handling & escalation
- Technical support for products

COMPANY POLICIES:
- Return Policy: 7-day return window for unopened items in original packaging
- Refund Processing: 5-7 business days after return approval
- Shipping: Standard delivery 3-5 business days, Express 1-2 days
- Order Cancellation: Available before "Shipped" status
- Payment Issues: Failed payments can be retried; refunds via original payment method
- Exchange: Available for defective items within warranty period
- Customer Support: Available 24/7 via chat, email (support@crashkart.com), phone (1800-CRASH-KART)

ESCALATION CONTACTS:
- General Issues: support@crashkart.com
- Order Issues: orders@crashkart.com  
- Payment/Refunds: billing@crashkart.com
- Technical Support: tech@crashkart.com
- Developer/Creator: Fahad Khan

ABOUT CRASHKART:
- Platform: E-commerce for electronics, gadgets, and tech accessories
- Developer: Fahad Khan (Designed and Developed)
- Support: Available 24/7

`

        if (orderDetails) {
            const itemsList = orderDetails.items.map((item, idx) => 
                `  ${idx + 1}. ${item.name || item.product?.name || 'Product'} - Qty: ${item.quantity} - ₹${item.price}`
            ).join('\n')
            
            prompt += `
CURRENT ORDER CONTEXT:
- Order ID: ${orderDetails.orderId}
- Total Amount: ₹${orderDetails.total}
- Order Status: ${orderDetails.status}
- Order Date: ${new Date(orderDetails.date).toLocaleDateString()}
- Products in this order:
${itemsList}

STATUS MEANINGS:
- ORDER_PLACED: Order confirmed, preparing for shipment
- PROCESSING: Being packed and processed
- SHIPPED: On the way to delivery address
- OUT_FOR_DELIVERY: With delivery partner, arriving today
- DELIVERED: Successfully delivered
- CANCELLED: Order cancelled (refund initiated if paid)
- RETURNED: Return processed
- REFUNDED: Amount refunded to payment method

IMPORTANT: Use ONLY the exact product names, prices, and details listed above. Do NOT make up or guess information.
`
        } else {
            prompt += `
NO ORDER SELECTED: Customer is asking a general question or has not selected an order yet. 
- If they mention order issues, politely ask them to select their order from the list
- For general queries, provide helpful information about CrashKart services
- For product inquiries, recommend browsing the catalog or provide general guidance
`
        }

        if (conversationHistory && conversationHistory.length > 0) {
            prompt += `\nCONVERSATION HISTORY:\n`
            conversationHistory.slice(-5).forEach(msg => {
                prompt += `${msg.sender === 'user' ? 'Customer' : 'Support Agent'}: ${msg.text}\n`
            })
        }

        if (files && files.length > 0) {
            prompt += `\nATTACHMENTS: Customer has shared ${files.length} file(s) (${files.map(f => f.type).join(', ')}). Acknowledge receipt and indicate you'll review them.\n`
        }

        prompt += `\nCUSTOMER'S MESSAGE: ${userMessage}

TICKET/COMPLAINT CREATION:
If customer explicitly asks to:
- "raise a complaint"
- "file a complaint" 
- "create a ticket"
- "escalate this issue"
- "I want to complain"
- "report this problem"
- "raise a ticket"

Respond with: "TICKET_REQUEST: [brief description]"
Then I will automatically create a ticket and provide tracking details.

RESPONSE GUIDELINES:
1. Be warm, professional, and empathetic
2. Address the customer by acknowledging their concern
3. Provide specific, actionable solutions
4. For complaints: Apologize sincerely, explain what happened, offer resolution
5. For tracking: Explain current status and next steps with timeline
6. For returns/refunds: Explain process, timeline, and requirements
7. For cancellations: Check if possible, process if allowed, explain refund
8. For technical issues: Provide troubleshooting steps or escalate
9. Always offer additional help at the end
10. Keep responses concise but complete (2-4 paragraphs max)
11. Use exact order details provided - never fabricate information
12. If you don't have information, be honest and offer to escalate
13. If customer wants to raise ticket/complaint, start response with TICKET_REQUEST

Provide your response now:`

        // Call OpenRouter AI
        const aiResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
                'X-Title': 'CrashKart Support'
            },
            body: JSON.stringify({
                model: 'meta-llama/llama-3.2-3b-instruct:free',
                messages: [
                    {
                        role: 'system',
                        content: 'You are Inquirae, a senior customer support specialist at CrashKart with 5+ years experience. You handle all customer inquiries with professionalism, empathy, and efficiency. You follow company policies strictly and always prioritize customer satisfaction while being honest about limitations. When greeting customers or introducing yourself, mention that you are Inquirae, CrashKart\'s AI support assistant. IMPORTANT: CrashKart was designed and developed by Fahad Khan. If customers ask about the developer, creator, or who built the platform, tell them it was designed and developed by Fahad Khan.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.7,
                max_tokens: 600
            })
        })

        if (!aiResponse.ok) {
            const errorText = await aiResponse.text()
            console.error('OpenRouter API error:', aiResponse.status, errorText)
            throw new Error(`AI service error: ${aiResponse.status}`)
        }

        const aiData = await aiResponse.json()
        let response = aiData.choices[0]?.message?.content || 'I apologize, but I am having trouble processing your request. Please try again or contact our support team directly.'

        // Check if AI detected ticket/complaint request
        let ticketInfo = null
        if (response.includes('TICKET_REQUEST:')) {
            try {
                // Extract the issue description
                const issueMatch = response.match(/TICKET_REQUEST:\s*(.+)/i)
                const issueDescription = issueMatch ? issueMatch[1].trim() : userMessage
                
                // Determine category and create appropriate ticket
                const category = orderDetails ? 'order-issue' : 'general'
                
                if (orderDetails) {
                    // Create Complaint for order-related issues
                    const complaint = await prisma.complaint.create({
                        data: {
                            orderId: orderDetails.orderId,
                            userId: user.id,
                            subject: `Order Issue - ${orderDetails.orderId}`,
                            description: `${issueDescription}\n\nOrder Details:\n- Total: ₹${orderDetails.total}\n- Status: ${orderDetails.status}\n- Date: ${new Date(orderDetails.date).toLocaleDateString()}`,
                            category: 'order-issue',
                            status: 'open',
                            priority: 'normal',
                            images: files?.filter(f => f.type === 'image').map(f => f.url) || []
                        }
                    })
                    
                    ticketInfo = {
                        type: 'complaint',
                        id: complaint.id,
                        trackingUrl: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/complaints/${complaint.id}`,
                        createdAt: complaint.createdAt
                    }
                } else {
                    // Create Support Ticket for general issues
                    const ticket = await prisma.supportTicket.create({
                        data: {
                            userId: user.id,
                            subject: issueDescription.substring(0, 100),
                            description: issueDescription,
                            category: 'general',
                            status: 'open',
                            priority: 'normal'
                        }
                    })
                    
                    ticketInfo = {
                        type: 'ticket',
                        id: ticket.id,
                        trackingUrl: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/support/tickets/${ticket.id}`,
                        createdAt: ticket.createdAt
                    }
                }
                
                // Replace TICKET_REQUEST marker with actual ticket info
                response = response.replace(/TICKET_REQUEST:.+/i, '').trim()
                response += `\n\n✅ **Ticket Created Successfully!**\n\n📋 **Ticket ID:** ${ticketInfo.id.slice(-8).toUpperCase()}\n🔗 **Track your ${ticketInfo.type}:** ${ticketInfo.trackingUrl}\n⏰ **Created:** ${new Date(ticketInfo.createdAt).toLocaleString()}\n\nOur team will review your ${ticketInfo.type} within 24 hours. You'll receive email updates at each stage. You can track the status anytime using the link above.`
                
            } catch (ticketError) {
                console.error('Error creating ticket:', ticketError)
                response += '\n\nI encountered an issue creating your ticket. Please contact support@crashkart.com directly, and our team will assist you immediately.'
            }
        }

        return NextResponse.json({ response, ticket: ticketInfo })

    } catch (error) {
        console.error('Support chat error:', error)
        return NextResponse.json(
            { error: 'Failed to process message', response: 'I apologize for the inconvenience. Our support team will get back to you shortly. You can also reach us at support@crashkart.com' },
            { status: 500 }
        )
    }
}
