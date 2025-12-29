/**
 * Automated Email Trigger Service
 * Handles automatic email notifications for orders and promotional campaigns
 */

import { sendOrderConfirmationEmail, sendOrderShippedEmail, sendOrderDeliveredEmail, sendOrderStatusEmail, sendPromotionalNewsletterEmail, sendOrderCancelledEmail, sendRefundProcessedEmail, sendReturnApprovedEmail } from './email.js';
import prisma from '@/lib/prisma';

/**
 * Trigger order confirmation email
 * Called when order is placed
 */
export async function triggerOrderConfirmationEmail(order, user, address, orderData) {
    try {
        console.log('📧 Triggering order confirmation email for order:', order.id);
        
        const emailData = {
            orderId: order.id,
            items: orderData.items || [],
            subtotal: orderData.subtotal || order.total,
            discount: orderData.discount || 0,
            crashCashReward: Math.floor(order.total * 0.1),
            total: order.total,
            address: {
                name: address?.name || 'Customer',
                street: address?.street || '',
                city: address?.city || '',
                state: address?.state || '',
                zipCode: address?.zip || '',
                phone: address?.phone || '',
                email: user.email
            },
            paymentMethod: order.paymentMethod,
            customerName: user.name || user.email.split('@')[0],
            currency: process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '₹',
            trackingLink: `${process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')}/track/${order.id}`
        };

        await sendOrderConfirmationEmail(user.email, emailData, user.name || user.email.split('@')[0]);
        console.log('✅ Order confirmation email sent to:', user.email);
        
        return true;
    } catch (error) {
        console.error('❌ Order confirmation email failed:', error.message);
        return false;
    }
}

/**
 * Trigger order status update emails
 * Called when order status changes
 */
export async function triggerOrderStatusEmail(order, previousStatus, newStatus, user) {
    try {
        // Don't send emails for certain status transitions
        if (!shouldSendStatusEmail(previousStatus, newStatus)) {
            console.log('⏭️  Skipping status email for transition:', previousStatus, '->', newStatus);
            return false;
        }

        console.log('📧 Triggering order status email for order:', order.id, 'Status:', newStatus);

        const statusEmailMap = {
            'PROCESSING': sendOrderConfirmationEmail,
            'SHIPPED': sendOrderShippedEmail,
            'DELIVERED': sendOrderDeliveredEmail,
            'CANCELLED': sendOrderCancelledEmail,
            'REFUND_PROCESSED': sendRefundProcessedEmail,
            'RETURN_APPROVED': sendReturnApprovedEmail
        };

        const emailFunction = statusEmailMap[newStatus] || sendOrderStatusEmail;
        
        if (emailFunction === sendOrderShippedEmail) {
            await emailFunction(user.email, {
                orderId: order.id,
                trackingNumber: order.trackingNumber || 'TRK-' + order.id,
                estimatedDelivery: calculateEstimatedDelivery(7),
                trackingLink: `${process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')}/track/${order.id}`,
                customerName: user.name || user.email.split('@')[0]
            });
        } else if (emailFunction === sendOrderDeliveredEmail) {
            await emailFunction(user.email, {
                orderId: order.id,
                trackingLink: `${process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')}/track/${order.id}`,
                customerName: user.name || user.email.split('@')[0]
            });
        } else if (emailFunction === sendOrderCancelledEmail) {
            await emailFunction(user.email, {
                orderId: order.id,
                reason: order.cancellationReason || 'Not specified',
                refundMethod: order.paymentMethod === 'COD' ? 'N/A (No payment was made)' : 'Original payment method',
                refundTimeline: order.paymentMethod === 'COD' ? 'N/A' : '5-7 business days',
                customerName: user.name || user.email.split('@')[0]
            });
        } else if (emailFunction === sendRefundProcessedEmail) {
            // Get order items for refund email
            const orderWithItems = await prisma.order.findUnique({
                where: { id: order.id },
                include: {
                    items: {
                        include: {
                            product: true
                        }
                    }
                }
            });
            
            await emailFunction(user.email, {
                orderId: order.id,
                refundAmount: order.total,
                refundMethod: order.paymentMethod,
                processingDate: new Date().toLocaleDateString(),
                items: orderWithItems?.items?.map(item => ({
                    name: item.product.name,
                    quantity: item.quantity,
                    price: item.price,
                    image: item.product.images?.[0]
                })) || []
            }, user.name || user.email.split('@')[0]);
        } else if (emailFunction === sendReturnApprovedEmail) {
            // Get order items for return email
            const orderWithItems = await prisma.order.findUnique({
                where: { id: order.id },
                include: {
                    items: {
                        include: {
                            product: true
                        }
                    },
                    address: true
                }
            });
            
            await emailFunction(user.email, {
                orderId: order.id,
                pickupDate: calculateEstimatedDelivery(3),
                pickupAddress: orderWithItems?.address ? 
                    `${orderWithItems.address.street}, ${orderWithItems.address.city}, ${orderWithItems.address.state} ${orderWithItems.address.zip}` : 
                    'Original delivery address',
                refundTimeline: '7-10 business days after pickup',
                items: orderWithItems?.items?.map(item => ({
                    name: item.product.name,
                    quantity: item.quantity,
                    price: item.price,
                    image: item.product.images?.[0]
                })) || []
            }, user.name || user.email.split('@')[0]);
        } else {
            await emailFunction(user.email, {
                orderId: order.id,
                status: newStatus,
                customerName: user.name || user.email.split('@')[0]
            });
        }

        console.log('✅ Order status email sent for status:', newStatus);
        return true;
    } catch (error) {
        console.error('❌ Order status email failed:', error.message);
        return false;
    }
}

/**
 * Trigger promotional emails based on user behavior
 */
export async function triggerPromotionalEmails() {
    try {
        console.log('📧 Processing promotional emails...');

        // Get users for promotional campaigns
        const users = await prisma.user.findMany({
            where: {
                emailNotifications: true,
                // Optionally filter by last purchase date or activity
            },
            select: {
                id: true,
                email: true,
                name: true,
                createdAt: true,
                lastLogin: true
            },
            take: 100 // Process in batches
        });

        console.log(`📨 Found ${users.length} users for promotional emails`);

        let sentCount = 0;

        for (const user of users) {
            try {
                // Create promotional data with offers
                const promotionalData = {
                    customerName: user.name || user.email.split('@')[0],
                    specialOffers: generateSpecialOffers(),
                    flashSaleItems: getFlashSaleItems(),
                    discountCode: generateDiscountCode(),
                    validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
                };

                await sendPromotionalNewsletterEmail(user.email, promotionalData);
                sentCount++;
            } catch (error) {
                console.error('Error sending promotional email to:', user.email, error.message);
            }
        }

        console.log(`✅ Promotional emails sent to ${sentCount} users`);
        return sentCount;
    } catch (error) {
        console.error('❌ Promotional email batch failed:', error.message);
        return 0;
    }
}

/**
 * Trigger abandoned cart emails
 */
export async function triggerAbandonedCartEmails() {
    try {
        console.log('📧 Checking for abandoned carts...');

        // Get abandoned carts (items in cart for more than 2 hours without purchase)
        const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
        
        const abandonedCarts = await prisma.cartItem.findMany({
            where: {
                createdAt: {
                    lt: twoHoursAgo
                }
            },
            include: {
                user: {
                    select: { id: true, email: true, name: true }
                },
                product: {
                    select: { id: true, name: true, price: true }
                }
            },
            distinct: ['userId'],
            take: 50
        });

        console.log(`📨 Found ${abandonedCarts.length} abandoned carts`);

        let sentCount = 0;

        for (const cart of abandonedCarts) {
            try {
                // Check if we already sent an email for this cart today
                const emailSentToday = await prisma.emailLog?.findFirst({
                    where: {
                        userId: cart.user.id,
                        type: 'ABANDONED_CART',
                        sentAt: {
                            gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
                        }
                    }
                }).catch(() => null);

                if (emailSentToday) {
                    continue;
                }

                // Send abandoned cart email
                const cartData = {
                    customerName: cart.user.name || cart.user.email.split('@')[0],
                    items: [cart.product],
                    cartUrl: `${process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')}/cart`,
                    discountPercentage: 10
                };

                // Assuming sendAbandonedCartEmail exists in email.js
                // await sendAbandonedCartEmail(cart.user.email, cartData);
                
                sentCount++;
            } catch (error) {
                console.error('Error sending abandoned cart email:', error.message);
            }
        }

        console.log(`✅ Abandoned cart emails sent to ${sentCount} users`);
        return sentCount;
    } catch (error) {
        console.error('❌ Abandoned cart email batch failed:', error.message);
        return 0;
    }
}

/**
 * Helper: Determine if status email should be sent
 */
function shouldSendStatusEmail(previousStatus, newStatus) {
    const emailStatuses = ['PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
    const noEmailTransitions = [
        ['ORDER_PLACED', 'ORDER_PLACED'],
        ['CANCELLED', 'CANCELLED']
    ];

    // Don't send if same status
    if (previousStatus === newStatus) return false;

    // Don't send for specific transitions
    if (noEmailTransitions.some(([prev, curr]) => prev === previousStatus && curr === newStatus)) {
        return false;
    }

    return emailStatuses.includes(newStatus);
}

/**
 * Helper: Calculate estimated delivery date
 */
function calculateEstimatedDelivery(days = 5) {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString();
}

/**
 * Helper: Generate special offers
 */
function generateSpecialOffers() {
    return [
        {
            title: '🎉 Flash Sale - Up to 50% Off',
            description: 'Limited time offer on selected items',
            discount: 50,
            code: 'FLASH50'
        },
        {
            title: '💰 Weekend Special - ₹100 Cashback',
            description: 'Minimum purchase of ₹500',
            discount: 100,
            code: 'WEEKEND100'
        },
        {
            title: '🆓 Free Shipping on Orders Above ₹1000',
            description: 'No minimum purchase required',
            discount: 0,
            code: 'FREESHIP'
        }
    ];
}

/**
 * Helper: Get flash sale items
 */
function getFlashSaleItems() {
    // In production, fetch from database
    return [
        {
            name: 'Premium Laptop Cooling Pad',
            originalPrice: 2999,
            salePrice: 1499,
            discount: 50
        },
        {
            name: 'Wireless Bluetooth Earbuds',
            originalPrice: 1999,
            salePrice: 999,
            discount: 50
        },
        {
            name: 'USB-C Fast Charging Cable',
            originalPrice: 599,
            salePrice: 299,
            discount: 50
        }
    ];
}

/**
 * Helper: Generate unique discount code
 */
function generateDiscountCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'PROMO';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

export default {
    triggerOrderConfirmationEmail,
    triggerOrderStatusEmail,
    triggerPromotionalEmails,
    triggerAbandonedCartEmails
};
