import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { generateVibrantInvoicePDF } from '@/lib/vibrantInvoiceGenerator';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

/**
 * GET /api/orders/[orderId]/invoice
 * Generates and downloads invoice PDF for an order
 * Supports single and multi-product orders
 */
export async function GET(request, { params }) {
    try {
        const { orderId } = params;

        if (!orderId) {
            return NextResponse.json(
                { error: 'Order ID is required' },
                { status: 400 }
            );
        }

        // Fetch order with all items and product details
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                user: true,
                orderItems: {
                    include: {
                        product: true
                    }
                },
                address: true
            }
        });

        if (!order) {
            return NextResponse.json(
                { error: 'Order not found' },
                { status: 404 }
            );
        }

        // Prepare invoice data - single invoice with all products
        const invoiceData = {
            orderId: order.id,
            customerName: order.user?.name || order.user?.email || 'Customer',
            customerEmail: order.user?.email || '',
            customerPhone: order.address?.phone || 'Not provided',
            items: order.orderItems.map((item) => ({
                name: item.product?.name || `Product ${item.productId}`,
                quantity: item.quantity,
                price: item.price,
                shipmentId: item.shipmentId,
                image: item.product?.image || '',
                status: item.status,
                trackingNumber: item.trackingNumber
            })),
            subtotal: order.subtotal || order.total,
            discount: order.discount || 0,
            tax: order.tax || 0,
            crashCashApplied: order.crashCashUsed || 0,
            total: order.total,
            address: {
                street: order.address?.street || '',
                city: order.address?.city || '',
                state: order.address?.state || '',
                zipCode: order.address?.zipCode || order.address?.zip || '',
                country: order.address?.country || 'India',
                phone: order.address?.phone || ''
            },
            paymentMethod: order.paymentMethod || 'N/A',
            orderDate: order.createdAt,
            currency: '₹'
        };

        // Generate vibrant PDF invoice
        const pdfBuffer = await generateVibrantInvoicePDF(invoiceData);

        // Return PDF as downloadable file
        return new NextResponse(pdfBuffer, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="Invoice-${orderId}.pdf"`,
                'Cache-Control': 'no-cache, no-store, must-revalidate'
            }
        });
    } catch (error) {
        console.error('Invoice generation error:', error);
        return NextResponse.json(
            { error: 'Failed to generate invoice' },
            { status: 500 }
        );
    }
}
