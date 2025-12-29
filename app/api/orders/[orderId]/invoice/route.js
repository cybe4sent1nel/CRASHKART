/**
 * Invoice Generation API
 * Generates and downloads PDF invoice for orders
 */

import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET(req, { params }) {
    try {
        const session = await getServerSession(authOptions);
        
        if (!session?.user?.email) {
            return Response.json(
                { message: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Await params in Next.js 15
        const { orderId } = await params;

        // Fetch order with all details
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                user: {
                    select: { id: true, name: true, email: true, phone: true }
                },
                address: true,
                orderItems: {
                    include: {
                        product: {
                            select: { id: true, name: true, price: true }
                        }
                    }
                }
            }
        });

        if (!order) {
            return Response.json(
                { message: 'Order not found' },
                { status: 404 }
            );
        }

        // Verify user is the order owner or admin
        const userEmail = session.user.email;
        const isAdmin = userEmail === 'crashkart.help@gmail.com';
        const isOwner = order.user.email === userEmail;

        if (!isOwner && !isAdmin) {
            return Response.json(
                { message: 'Unauthorized' },
                { status: 403 }
            );
        }

        // Generate invoice HTML
        const invoiceHTML = generateInvoiceHTML(order);

        // Return HTML invoice with proper PDF-print styling
        // This allows the browser to view and save/print as PDF
        return new Response(invoiceHTML, {
            status: 200,
            headers: {
                'Content-Type': 'text/html; charset=utf-8',
                'Content-Disposition': `inline; filename="invoice-${orderId}.html"`,
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'X-Content-Type-Options': 'nosniff',
                'Pragma': 'no-cache'
            }
        });

    } catch (error) {
        console.error('Invoice generation error:', error);
        return Response.json(
            { message: error.message || 'Failed to generate invoice' },
            { status: 500 }
        );
    }
}

/**
 * Generate invoice HTML
 */
function generateInvoiceHTML(order) {
    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '₹';
    const invoiceDate = new Date(order.createdAt).toLocaleDateString('en-IN');
    const invoiceNo = `INV-${order.id.substring(0, 8).toUpperCase()}-${new Date(order.createdAt).getTime().toString().slice(-6)}`;
    const orderId = order.id; // Define orderId for use in template

    // Generate QR Code for order tracking
    const orderDetailsUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://crashkart.vercel.app'}/order-details/${orderId}`;
    const qrData = encodeURIComponent(orderDetailsUrl);
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${qrData}`;

    const itemsHTML = order.orderItems.map((item, index) => `
        <tr>
            <td style="padding: 10px; border-bottom: 1px solid #ddd;">${index + 1}</td>
            <td style="padding: 10px; border-bottom: 1px solid #ddd;">${item.product.name}</td>
            <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center;">${item.quantity}</td>
            <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">${currency}${item.price}</td>
            <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">${currency}${(item.price * item.quantity).toFixed(2)}</td>
        </tr>
    `).join('');

    const subtotal = order.orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discount = subtotal - order.total;
    const crashCashReward = Math.floor(order.total * 0.1);

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Invoice - ${invoiceNo}</title>
            <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
            <style>
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }
                body {
                    font-family: Arial, sans-serif;
                    color: #333;
                    margin: 0;
                    padding: 0;
                    background: #f5f5f5;
                }
                @media print {
                    body {
                        background: white;
                        padding: 0;
                    }
                    .no-print {
                        display: none !important;
                    }
                    .invoice-container {
                        box-shadow: none;
                        margin: 0;
                        max-width: 100%;
                    }
                }
                .invoice-container {
                    background: white;
                    padding: 40px;
                    max-width: 900px;
                    margin: 0 auto;
                    border-radius: 8px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                }
                .invoice-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: start;
                    border-bottom: 3px solid #ff0000;
                    padding-bottom: 20px;
                    margin-bottom: 30px;
                }
                .company-info h1 {
                    margin: 0;
                    color: #ff0000;
                    font-size: 28px;
                }
                .company-info p {
                    margin: 5px 0;
                    font-size: 12px;
                    color: #666;
                }
                .invoice-info {
                    text-align: right;
                    font-size: 12px;
                }
                .invoice-info p {
                    margin: 5px 0;
                }
                .invoice-info strong {
                    color: #ff0000;
                }
                .qr-section {
                    background: #f9fafb;
                    padding: 10px;
                    border-radius: 8px;
                    text-align: center;
                    margin-top: 15px;
                }
                .qr-section img {
                    width: 120px;
                    height: 120px;
                    border: 2px solid #e5e7eb;
                    border-radius: 8px;
                    padding: 5px;
                    background: white;
                }
                .qr-section p {
                    font-size: 10px;
                    color: #666;
                    margin-top: 8px;
                }
                .section {
                    margin-bottom: 30px;
                }
                .section-title {
                    font-weight: bold;
                    font-size: 14px;
                    color: #333;
                    margin-bottom: 10px;
                    border-bottom: 2px solid #ddd;
                    padding-bottom: 5px;
                }
                .address-section {
                    display: flex;
                    gap: 40px;
                    margin-bottom: 30px;
                }
                .address-block {
                    flex: 1;
                    font-size: 12px;
                    line-height: 1.6;
                }
                .address-block strong {
                    display: block;
                    margin-bottom: 5px;
                    color: #ff0000;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 20px;
                }
                table th {
                    background: #f0f0f0;
                    padding: 10px;
                    text-align: left;
                    font-weight: bold;
                    border-bottom: 2px solid #ddd;
                    font-size: 12px;
                }
                table td {
                    padding: 10px;
                    border-bottom: 1px solid #ddd;
                    font-size: 12px;
                }
                .totals {
                    display: flex;
                    justify-content: flex-end;
                    margin-bottom: 30px;
                }
                .totals-table {
                    width: 300px;
                    font-size: 12px;
                }
                .totals-table tr {
                    display: flex;
                    justify-content: space-between;
                    padding: 8px 0;
                    border-bottom: 1px solid #ddd;
                }
                .totals-table tr.total {
                    border-bottom: 2px solid #ff0000;
                    font-weight: bold;
                    font-size: 14px;
                    color: #ff0000;
                    padding: 10px 0;
                }
                .footer {
                    text-align: center;
                    font-size: 11px;
                    color: #999;
                    margin-top: 40px;
                    padding-top: 20px;
                    border-top: 1px solid #ddd;
                }
                .status-badge {
                    display: inline-block;
                    padding: 6px 12px;
                    background: #4caf50;
                    color: white;
                    border-radius: 4px;
                    font-size: 11px;
                    font-weight: bold;
                    margin-top: 10px;
                }
                .action-buttons {
                    text-align: center;
                    margin: 20px 0;
                }
                .action-buttons button {
                    background: #ff0000;
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    margin: 0 10px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: bold;
                }
                .action-buttons button:hover {
                    background: #cc0000;
                }
                @media print {
                    .action-buttons {
                        display: none;
                    }
                }
            </style>
        </head>
        <body>
            <!-- Action Buttons -->
            <div class="action-buttons">
                <button id="printBtn">🖨️ Print Invoice</button>
            </div>
            
            <div class="invoice-container">
                <!-- Header -->
                <div class="invoice-header">
                    <div class="company-info">
                        <img src="https://disabled-blue-pxxlqc3pk9-hwn0d1df7j.edgeone.app/LOGO.png" alt="CrashKart Logo" style="max-width: 250px; height: auto; margin-bottom: 15px; display: block;">
                        <p><strong>Invoice Number:</strong> ${invoiceNo}</p>
                        <p><strong>Date:</strong> ${invoiceDate}</p>
                        <p>Email: crashkart.help@gmail.com</p>
                        <p>Phone: 1800-123-4567 (Toll Free)</p>
                    </div>
                    <div class="invoice-info">
                        <p><strong>Invoice No:</strong> ${invoiceNo}</p>
                        <p><strong>Invoice Date:</strong> ${invoiceDate}</p>
                        <p><strong>Order ID:</strong> ${order.id}</p>
                        <div class="qr-section">
                            <img src="${qrCodeUrl}" alt="Order QR Code" onerror="this.style.display='none';this.nextElementSibling.textContent='QR code unavailable'" />
                            <p><strong>Scan to track order</strong></p>
                        </div>
                    </div>
                </div>

                <!-- Addresses -->
                <div class="address-section">
                    <div class="address-block">
                        <div class="section-title">Billing Address</div>
                        <strong>${order.address.name}</strong>
                        ${order.address.street}<br>
                        ${order.address.city}, ${order.address.state} ${order.address.zip}<br>
                        ${order.address.country}<br>
                        <strong>Phone:</strong> ${order.address.phone}<br>
                        <strong>Email:</strong> ${order.user.email}
                    </div>
                    <div class="address-block">
                        <div class="section-title">Shipping Address</div>
                        <strong>${order.address.name}</strong>
                        ${order.address.street}<br>
                        ${order.address.city}, ${order.address.state} ${order.address.zip}<br>
                        ${order.address.country}<br>
                        <strong>Phone:</strong> ${order.address.phone}
                    </div>
                </div>

                <!-- Order Items -->
                <div class="section">
                    <div class="section-title">Order Items</div>
                    <table>
                        <thead>
                            <tr>
                                <th width="5%">#</th>
                                <th width="50%">Product Name</th>
                                <th width="15%">Quantity</th>
                                <th width="15%">Unit Price</th>
                                <th width="15%">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${itemsHTML}
                        </tbody>
                    </table>
                </div>

                <!-- Totals -->
                <div class="totals">
                    <div class="totals-table">
                        <tr>
                            <td>Subtotal:</td>
                            <td>${currency}${subtotal.toFixed(2)}</td>
                        </tr>
                        ${discount > 0 ? `
                        <tr>
                            <td>Discount:</td>
                            <td>-${currency}${discount.toFixed(2)}</td>
                        </tr>
                        ` : ''}
                        <tr>
                            <td>Shipping:</td>
                            <td>Free</td>
                        </tr>
                        <tr class="total">
                            <td>Total Amount:</td>
                            <td>${currency}${order.total}</td>
                        </tr>
                    </div>
                </div>

                <!-- Payment & CrashCash Info -->
                <div class="section">
                    <div class="section-title">Order Summary</div>
                    <table>
                        <tr>
                            <td><strong>Payment Method:</strong></td>
                            <td>${order.paymentMethod === 'COD' ? 'Cash on Delivery' : 'Card Payment (Cashfree)'}</td>
                        </tr>
                        <tr>
                            <td><strong>Payment Status:</strong></td>
                            <td>${order.isPaid ? '✓ Paid' : 'Pending'}</td>
                        </tr>
                        <tr>
                            <td><strong>Order Status:</strong></td>
                            <td>${order.status.replace(/_/g, ' ')}</td>
                        </tr>
                        <tr>
                            <td><strong>CrashCash Earned:</strong></td>
                            <td>+${currency}${crashCashReward} (Can be used on next purchase)</td>
                        </tr>
                    </table>
                </div>

                <!-- Status -->
                <div style="text-align: center;">
                    <div class="status-badge">${order.status === 'DELIVERED' ? '✓ Order Delivered' : '⏳ ' + order.status.replace(/_/g, ' ')}</div>
                </div>

                <!-- Footer -->
                <div class="footer">
                    <p>Thank you for shopping with CRASHKART!</p>
                    <p>Track your order: <strong>https://crashkart.com/track/${order.id}</strong></p>
                    <p>For queries, contact: crashkart.help@gmail.com</p>
                    <p style="margin-top: 20px; font-size: 10px;">
                        This is a computer-generated invoice. No signature required.<br>
                        Invoice Generated on: ${new Date().toLocaleString('en-IN')}
                    </p>
                </div>
            </div>
        </body>
        <script>
            // Add print button click handler
            window.addEventListener('load', function() {
                const printBtn = document.getElementById('printBtn');
                if (printBtn) {
                    printBtn.addEventListener('click', function() {
                        window.print();
                    });
                }
            });
        </script>
        </html>
    `;
}
