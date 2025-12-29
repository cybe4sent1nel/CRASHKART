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
- Customer Support: Available 24/7 via chat, email (crashkart.help@gmail.com), phone (1800-CRASH-KART)

ESCALATION CONTACTS:
- General Issues: crashkart.help@gmail.com
- Order Issues: crashkart.help@gmail.com  
- Payment/Refunds: crashkart.help@gmail.com
- Technical Support: crashkart.help@gmail.com
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
            prompt += `\nATTACHMENTS: Customer has shared ${files.length} file(s):\n`
            files.forEach((f, idx) => {
                prompt += `  ${idx + 1}. ${f.type} - ${f.name}\n`
            })
            prompt += `\nIMPORTANT: Acknowledge these files and mention you will review them. If creating a complaint, mention these files will be attached to their ticket.\n`
        }

        prompt += `\nCUSTOMER'S MESSAGE: ${userMessage}

TICKET/COMPLAINT CREATION - AUTO-DETECT AND CREATE:

**AUTO-CREATE TICKET** for these situations:
1. Customer explicitly asks: "raise complaint", "file ticket", "escalate", "report issue"
2. Customer describes order problems: damaged, wrong item, not delivered, defective, broken
3. Customer expresses dissatisfaction: "bad experience", "disappointed", "not satisfied"
4. Customer reports product/service issues with details

**TICKET CREATION - IMMEDIATE ACTION:**
When ANY issue is reported, respond with:
TICKET_REQUEST: [1-2 sentence summary of the issue]

**AUTOMATIC TICKET EXAMPLES:**

User: "My product arrived damaged"
You: "I sincerely apologize for receiving a damaged product. I'm creating a complaint ticket immediately for our team to resolve this.

TICKET_REQUEST: Damaged product received"

User: "Order not delivered yet, very late"
You: "I understand your concern about the delayed delivery. Let me escalate this to our team right away.

TICKET_REQUEST: Order delivery delayed beyond expected timeframe"

User: "Wrong item sent, I ordered something else"
You: "I apologize for the wrong item delivery. Creating a complaint ticket now to fix this immediately.

TICKET_REQUEST: Wrong item delivered - incorrect product sent"

**RESPONSE AFTER TICKET CREATION:**
The system will automatically append:
- ✅ Ticket ID
- 🔗 Tracking link
- Email for further details: crashkart.help@gmail.com
- Team follow-up message

**WHEN NOT TO CREATE TICKET:**
- Simple tracking questions (just answer with order status)
- Product browsing/shopping questions (just answer)
- General policy questions (just answer)

**YOUR RESPONSE STRUCTURE:**
1. Empathize with the issue (1 sentence)
2. State you're creating ticket immediately (1 sentence)
3. Add: TICKET_REQUEST: [issue summary]

Keep it brief - system will add all ticket details, email, and next steps automatically!

Provide your response now:`

        // Free OpenRouter models with vision + text capabilities and fallback
        const freeModels = [
            process.env.OPENROUTER_MODEL || 'google/gemini-2.0-flash-exp:free', // Primary from env
            'google/gemini-2.0-flash-exp:free', // Google Gemini - best vision + text
            'meta-llama/llama-3.2-11b-vision-instruct:free', // Llama 3.2 Vision
            'google/gemini-flash-1.5:free', // Gemini Flash - fast vision
            'qwen/qwen-2-vl-7b-instruct:free', // Qwen VL - vision capable
        ];

        let aiResponse = null;
        let lastError = null;
        
        // Try each model until one works
        for (const model of freeModels) {
            try {
                console.log(`🤖 Trying model: ${model}`);
                
                aiResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                        'Content-Type': 'application/json',
                        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'),
                        'X-Title': 'CrashKart Support'
                    },
                    body: JSON.stringify({
                        model: model,
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
                });

                if (aiResponse.ok) {
                    console.log(`✅ Model ${model} responded successfully`);
                    break; // Success! Use this response
                } else {
                    const errorText = await aiResponse.text();
                    lastError = `${model}: ${aiResponse.status} - ${errorText}`;
                    console.warn(`⚠️ Model ${model} failed:`, aiResponse.status, errorText);
                    
                    // If rate limited, try next model immediately
                    if (aiResponse.status === 429) {
                        continue;
                    }
                }
            } catch (error) {
                lastError = `${model}: ${error.message}`;
                console.warn(`⚠️ Model ${model} error:`, error.message);
                continue; // Try next model
            }
        }

        // If all models failed
        if (!aiResponse || !aiResponse.ok) {
            console.error('❌ All AI models failed. Last error:', lastError);
            throw new Error(`AI service unavailable. Please try again shortly.`);
        }

        const aiData = await aiResponse.json()
        let response = aiData.choices[0]?.message?.content || 'I apologize, but I am having trouble processing your request. Please try again or contact our support team directly.'

        // Check if AI detected ticket/complaint request OR if user explicitly wants to raise complaint/ticket
        let ticketInfo = null
        const shouldCreateTicket = response.includes('TICKET_REQUEST:') || 
                                   userMessage.toLowerCase().match(/(?:raise|create|file|open)\s+(?:a\s+)?(?:complaint|ticket|request)/);
        
        if (shouldCreateTicket) {
            try {
                // Extract the issue description
                let issueDescription = userMessage;
                if (response.includes('TICKET_REQUEST:')) {
                    const issueMatch = response.match(/TICKET_REQUEST:\s*(.+)/i)
                    issueDescription = issueMatch ? issueMatch[1].trim() : userMessage
                }
                
                console.log('🎫 Creating ticket/complaint:', {
                    hasOrder: !!orderDetails,
                    issueDescription: issueDescription.substring(0, 50),
                    userId: user.id,
                    filesCount: files?.length || 0
                })
                
                // Build file attachments list
                const attachmentsList = files?.length > 0 ? 
                    `\n\nAttachments:\n${files.map((f, i) => `${i+1}. ${f.type} - ${f.name}`).join('\n')}` : '';
                
                if (orderDetails) {
                    // Create Complaint for order-related issues
                    const complaint = await prisma.complaint.create({
                        data: {
                            orderId: orderDetails.orderId,
                            userId: user.id,
                            subject: `Order Issue - ${orderDetails.orderId}`,
                            description: `${issueDescription}\n\nOrder Details:\n- Order ID: ${orderDetails.orderId}\n- Total: ₹${orderDetails.total}\n- Status: ${orderDetails.status}\n- Date: ${new Date(orderDetails.date).toLocaleDateString()}${attachmentsList}`,
                            category: 'other', // Valid categories: return, refund, damaged, wrong-item, delivery, quality, other
                            status: 'open',
                            priority: 'normal',
                            images: files?.filter(f => f.type === 'image').map(f => f.url) || []
                        }
                    })
                    
                    console.log('✅ Complaint created successfully:', complaint.id)
                    
                    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                                   process.env.NEXT_PUBLIC_SITE_URL || 
                                   (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
                    
                    ticketInfo = {
                        type: 'complaint',
                        id: complaint.id,
                        shortId: complaint.id.substring(0, 8).toUpperCase(),
                        trackingUrl: `${baseUrl}/complaints/${complaint.id}`,
                        createdAt: complaint.createdAt
                    }
                } else {
                    // Create Support Ticket for general issues
                    const ticket = await prisma.supportTicket.create({
                        data: {
                            userId: user.id,
                            subject: issueDescription.substring(0, 100),
                            description: `${issueDescription}${attachmentsList}`,
                            category: 'other', // Valid categories: billing, product, delivery, other
                            status: 'open',
                            priority: 'normal'
                        }
                    })
                    
                    console.log('✅ Support ticket created successfully:', ticket.id)
                    
                    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                                   process.env.NEXT_PUBLIC_SITE_URL || 
                                   (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
                    
                    ticketInfo = {
                        type: 'ticket',
                        id: ticket.id,
                        shortId: ticket.id.substring(0, 8).toUpperCase(),
                        trackingUrl: `${baseUrl}/support/tickets/${ticket.id}`,
                        createdAt: ticket.createdAt
                    }
                }
                
                // Replace TICKET_REQUEST marker with actual ticket info
                if (response.includes('TICKET_REQUEST:')) {
                    response = response.replace(/TICKET_REQUEST:.+/i, '').trim()
                }
                
                // Add ticket creation confirmation with detailed instructions
                const filesInfo = files?.length > 0 ? `\n📎 **${files.length} file(s) attached** to your ${ticketInfo.type}` : '';
                response += `\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n✅ **${ticketInfo.type === 'complaint' ? 'COMPLAINT RAISED' : 'SUPPORT TICKET CREATED'}**\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n🎫 **Your Ticket ID:** ${ticketInfo.shortId}\n🔗 **Track Status:** ${ticketInfo.trackingUrl}\n⏰ **Raised:** ${new Date(ticketInfo.createdAt).toLocaleString()}${filesInfo}\n\n📧 **Send Further Details:**\nEmail: **crashkart.help@gmail.com**\nInclude Ticket ID: **${ticketInfo.shortId}** in subject\n\n👥 **What Happens Next:**\n• Our support team will contact you within 24 hours\n• You'll receive email updates at each stage\n• Team will ask for any additional details needed\n• We'll resolve your issue as quickly as possible\n\n💡 **Important:**\n• Use the tracking link above to check real-time status\n• Reply to our emails with any additional information\n• Keep your Ticket ID handy for reference\n\n🆘 **Need Urgent Help?**\n📞 Phone: 1800-987-6543\n📧 Email: crashkart.help@gmail.com\n\nThank you for reaching out. We're on it! 🚀`
                
            } catch (ticketError) {
                console.error('❌ Error creating ticket:', ticketError)
                response += `\n\n⚠️ I encountered an issue creating your ticket. Please contact us directly:\n📧 Email: crashkart.help@gmail.com\n📞 Phone: 1800-987-6543\n\nOur team will assist you immediately!`
            }
        }

        return NextResponse.json({ response, ticket: ticketInfo })

    } catch (error) {
        console.error('Support chat error:', error)
        return NextResponse.json(
            { error: 'Failed to process message', response: 'I apologize for the inconvenience. Our support team will get back to you shortly. You can also reach us at crashkart.help@gmail.com' },
            { status: 500 }
        )
    }
}
