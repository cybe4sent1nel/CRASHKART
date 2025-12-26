import { NextResponse } from 'next/server'

const systemPrompt = `You are an expert customer support representative for CrashKart, a leading e-commerce platform for electronics and gadgets. You are powered by INQUIARE AI (developed by Fahad Khan) and have extensive experience in handling customer inquiries with professionalism and empathy.

## Your Role and Responsibilities:
- Provide friendly, professional, and knowledgeable customer support
- Help with order tracking, returns, shipping, and product inquiries
- Answer questions about CrashKart policies, discounts, and delivery
- Resolve customer issues efficiently and proactively
- Maintain a warm, professional, and empathetic tone
- Escalate complex issues when necessary
- You are powered by INQUIARE AI (BY FAHAD KHAN)

## How to Handle Different Topics:

### E-commerce & Customer Service:
- Answer all queries about products, orders, shipping, returns, refunds, and policies
- Provide specific information about CrashKart's services
- Offer solutions and next steps for customer issues
- Be helpful and solution-oriented

### Technical/Development Questions:
When asked about development, technical implementation, coding, or system architecture:
- Politely acknowledge the question
- Mention: "For technical and development-related queries, I'd recommend reaching out to Fahad Khan, our senior developer. He can provide expert guidance on our technical infrastructure and implementation details."
- Remain helpful by offering to connect them with the support team

## Response Guidelines:
- Keep responses concise (2-3 sentences maximum)
- Use clear, friendly language
- Provide actionable information when possible
- Ask follow-up questions when clarification is needed
- Always remain professional and courteous
- Offer escalation to human support for complex issues

## CrashKart Policy Guidelines:
- Order tracking: Available in My Orders section with real-time updates
- Returns: 30-day hassle-free return policy
- Shipping: Standard 3-5 business days, Express 1-2 days
- Refunds: Processed within 5-7 business days after return receipt
- Payment: All major cards, debit cards, and digital wallets accepted
- Damaged/Wrong items: Immediate replacement or refund at no extra cost

## Important Notes:
- Never make false promises about refunds or replacements
- Don't share sensitive customer data
- Don't make up product specifications
- Always recommend contacting support for sensitive matters
- Be empathetic to customer frustrations`

const frequentQuestions = {
    'track order': "You can track your order in the 'My Orders' section of your account. You'll see real-time tracking updates with estimated delivery dates. Need help finding something specific?",
    'return': 'We offer a hassle-free 30-day return policy! Simply go to My Orders, select the item, and click "Return Order". Our team will contact you within 24 hours to arrange the return.',
    'shipping': 'Standard shipping takes 3-5 business days, while Express shipping takes 1-2 days. You can check real-time shipping status in your My Orders section.',
    'payment': 'We accept all major credit cards, debit cards, UPI, and digital wallets. If you face any payment issues, please try again or reach out to crashkart.help@gmail.com.',
    'refund': 'Refunds are processed within 5-7 business days after we receive your returned item. You\'ll get an email confirmation when your refund is initiated.',
    'damaged': "I'm sorry to hear that! Please initiate a return from My Orders and select 'Damaged During Shipping' as the reason. We'll process a replacement or refund immediately.",
    'wrong item': "That's on us! Please initiate a return with 'Wrong Item Received' as the reason, and we'll send the correct item right away at no extra cost.",
    'cancel': 'You can cancel orders within 24 hours of placement. Go to My Orders and click the cancel button if it\'s still available.',
    'password': 'Click "Forgot Password" on the login page and follow the email instructions to reset your password.',
    'account': 'Visit your Profile page to update your personal information, address, and preferences.',
    'warranty': 'Most products come with manufacturer warranty. Check your product details or contact us for specific warranty information.',
    'delivery estimate': 'Check the delivery estimate on the product page by entering your pincode. You\'ll see the exact delivery date based on your location.',
    'flash sale': 'Flash sales feature discounted products with limited-time offers. Check our homepage for current flash sale deals!',
    'offers': 'We offer discounts on select items, cashback with credit cards, and special promotions. Check the product page for available offers.',
    'development': 'For technical and development-related queries, I\'d recommend reaching out to Fahad Khan, our senior developer. He can provide expert guidance on our technical infrastructure.',
    'hello': 'Hi there! Welcome to CrashKart! How can I help you today?',
    'hi': 'Hello! I\'m here to help. What do you need assistance with?',
    'help': 'I\'m here to help! You can ask me about orders, returns, shipping, payment, or any other CrashKart-related questions.',
    'price': 'Product prices vary by item. You can browse our full catalog to see prices and current discounts available.',
    'discount': 'We offer various discounts throughout the year! Check product pages for active discounts and also look for our flash sales.',
    'promo': 'We run regular promotional campaigns. Check your email for promo codes and visit our homepage for current offers!',
    'coupon': 'Check your email and homepage for available coupon codes. Coupon terms and validity are displayed at checkout.',
    'bulk': 'For bulk orders, please contact our sales team at crashkart.help@gmail.com with your requirements. We\'ll provide special pricing!',
    'corporate': 'We offer corporate solutions and bulk purchasing discounts. Please reach out to our B2B team at crashkart.help@gmail.com for details.',
    'gift': 'You can gift products from CrashKart! Use the gift option during checkout to send directly to the recipient.',
    'replacement': 'For damaged or wrong items, we offer free replacements. Initiate a return with the reason, and we\'ll send a replacement immediately.',
    'complaint': 'We\'re sorry to hear about your issue! Please contact our support team at crashkart.help@gmail.com with details, and we\'ll resolve it quickly.',
    'quality': 'CrashKart is committed to providing high-quality electronics and gadgets. All our products are authentic and come with proper warranties.',
    'authenticity': 'All products on CrashKart are 100% authentic from authorized distributors. We guarantee genuine products or your money back.',
    'exchange': 'You can exchange items within 30 days. Go to My Orders, select the product, and choose the exchange option.',
    'address': 'You can update your delivery address during checkout. If your order hasn\'t shipped yet, contact us to change the address.',
    'contact': 'You can reach our support team at crashkart.help@gmail.com or call 1-800-CRASH-KART. We\'re available 24/7!',
    'support': 'Our customer support team is here to help! Email us at crashkart.help@gmail.com or call our hotline for immediate assistance.',
    'sales': 'Our biggest sales happen during seasonal events and flash sales. Subscribe to our newsletter to stay updated on upcoming sales!',
    'new': 'We regularly add new products to our catalog! Check the "New Arrivals" section to see the latest gadgets and electronics.',
    'trending': 'Check out our Trending section to see the most popular products right now at CrashKart!',
    'review': 'You can leave a review for purchased items in your My Orders section. Your feedback helps other customers make informed decisions!',
    'rating': 'Product ratings on CrashKart are from verified buyers. You can filter products by rating to find the best ones!',
    'safe': 'CrashKart uses industry-standard security to protect your personal and payment information. Your data is safe with us!',
    'secure': 'All transactions on CrashKart are secure and encrypted. We use trusted payment gateways for your protection.',
    'install': 'For product installation services, please check the product page for available services or contact our support team.',
    'warranty claim': 'To claim warranty, contact the manufacturer directly with your proof of purchase from CrashKart. We can help you with documentation!',
    'delivery time': 'Delivery times depend on your location and chosen shipping method. Express takes 1-2 days, Standard takes 3-5 days.',
    'pincode': 'Enter your pincode on the product page to see exact delivery estimates and available shipping options for your area.',
    'mobile': 'Looking for mobiles? We have a wide range of smartphones from top brands. Browse our Mobile category for the latest models!',
    'laptop': 'Check out our Laptop section for the latest computers from popular brands. Find the perfect device for your needs!',
    'accessories': 'We offer a variety of tech accessories including chargers, cables, cases, and more. Browse our Accessories category!',
    'headphones': 'Our Headphones & Audio section has options from budget-friendly to premium brands. Find your perfect audio companion!',
    'tablet': 'Browse our Tablet collection for various screen sizes and specifications. Great for entertainment and productivity!',
    'camera': 'Check our Camera section for DSLRs, mirrorless cameras, and action cams from top manufacturers.',
    'thank': 'You\'re welcome! Feel free to ask if you need anything else. Happy shopping!',
    'thanks': 'You\'re welcome! Is there anything else I can help you with?',
    'sorry': 'No problem at all! How can I assist you?',
    'bye': 'Thanks for visiting CrashKart! Have a great day and happy shopping!',
    'goodbye': 'Take care! Feel free to reach out anytime you need help!',
    'ok': 'Great! Is there anything else you\'d like to know?',
    'sure': 'Absolutely! What can I help you with?',
    'developer': 'CrashKart was developed by Fahad Khan, our senior developer and founder. INQUIARE AI, your customer support assistant, was also created by Fahad Khan. He\'s passionate about building great e-commerce experiences!',
    'fahad': 'Fahad Khan is the developer and founder of CrashKart. He also created INQUIARE AI, the intelligent chatbot powering your support experience.',
    'inquiare': 'INQUIARE is an intelligent customer support AI developed by Fahad Khan. I\'m INQUIARE, here to help you with all your CrashKart needs!',
    'who created': 'CrashKart and INQUIARE AI were created by Fahad Khan, our talented developer and founder.',
    'about': 'CrashKart is a premium e-commerce platform for electronics and gadgets, built by developer Fahad Khan. INQUIARE AI, powered by Fahad Khan, provides intelligent customer support.',
    'creator': 'Fahad Khan is the creator of CrashKart and INQUIARE AI. He\'s dedicated to providing excellent customer service through innovative technology!'
}

async function getAIResponse(userMessage) {
    // Check for keyword matches first (faster response)
    const messageLower = userMessage.toLowerCase()
    
    for (const [keyword, response] of Object.entries(frequentQuestions)) {
        if (messageLower.includes(keyword)) {
            return response
        }
    }

    // Use OpenRouter API for more complex queries
    const openrouterKey = process.env.OPENROUTER_API_KEY
    
    if (openrouterKey) {
        try {
            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${openrouterKey}`,
                    'HTTP-Referer': 'https://crashkart.com',
                    'X-Title': 'CrashKart Customer Support'
                },
                body: JSON.stringify({
                    model: 'kwaipilot/kat-coder-pro:free',
                    messages: [
                        {
                            role: 'system',
                            content: systemPrompt
                        },
                        {
                            role: 'user',
                            content: userMessage
                        }
                    ],
                    max_tokens: 200,
                    temperature: 0.7,
                    top_p: 0.95
                })
            })

            if (!response.ok) {
                const errorData = await response.json()
                console.error('OpenRouter API error:', errorData)
                throw new Error('OpenRouter API request failed')
            }

            const data = await response.json()
            return data.choices[0].message.content
        } catch (error) {
            console.error('OpenRouter API error:', error)
            // Fallback to generic response
            return `Thank you for your question! I don't have specific information about that right now. Please contact our support team at crashkart.help@gmail.com or call 1-800-CRASH-KART for detailed assistance. We're here to help!`
        }
    }

    // Default response if no OpenRouter API key
    return `Thank you for reaching out! For detailed assistance with your query, please contact our support team at crashkart.help@gmail.com or call 1-800-CRASH-KART. We're available 24/7 to help!`
}

export async function POST(request) {
    try {
        const { message } = await request.json()

        if (!message || message.trim().length === 0) {
            return NextResponse.json(
                { success: false, response: 'Please enter a message.' },
                { status: 400 }
            )
        }

        const botResponse = await getAIResponse(message)

        return NextResponse.json({
            success: true,
            response: botResponse
        })
    } catch (error) {
        console.error('Chatbot API error:', error)
        return NextResponse.json(
            {
                success: false,
                response: 'I encountered an issue processing your message. Please try again later or contact our support team at crashkart.help@gmail.com.'
            },
            { status: 500 }
        )
    }
}
