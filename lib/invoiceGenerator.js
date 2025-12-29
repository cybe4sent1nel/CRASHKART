/**
 * Generate invoice and return as attachment object for email
 * Returns HTML invoice that can be viewed in browser and printed as PDF
 * Note: Browsers have native Print to PDF functionality
 */
export async function getInvoiceAttachment(orderData) {
    try {
        const htmlContent = generateInvoiceHTML(orderData);
        
        return {
            filename: `Invoice-${orderData.orderId}.html`,
            content: htmlContent,
            contentType: 'text/html; charset=utf-8'
        };
    } catch (error) {
        console.error('Failed to generate invoice attachment:', error);
        return null;
    }
}

/**
 * Generate a preview HTML of the invoice (for web display)
 */
export function generateInvoiceHTML(orderData) {
    const {
        orderId,
        customerName,
        customerEmail,
        customerPhone,
        items = [],
        subtotal = 0,
        discount = 0,
        tax = 0,
        crashCashApplied = 0,
        total = 0,
        address = {},
        paymentMethod = 'N/A',
        isPaid = false,
        orderDate = new Date(),
        currency = '₹'
    } = orderData;

    // Generate QR Code Data URL for order tracking - points to order details page
    const orderDetailsUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://crashkart.vercel.app'}/order-details/${orderId}`;
    const qrData = encodeURIComponent(orderDetailsUrl);
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${qrData}`;

    // CrashKart Logo
    const logoHTML = `<img src="https://disabled-blue-pxxlqc3pk9-hwn0d1df7j.edgeone.app/LOGO.png" alt="CrashKart Logo" style="max-width: 180px; height: auto;">`;

    const itemsHTML = items.map((item, idx) => {
        const productImage = item.product?.images?.[0] || item.images?.[0] || '';
        return `
        <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 12px;">
                <div style="display: flex; align-items: center; gap: 10px;">
                    ${productImage ? `<img src="${productImage}" alt="${item.name}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 6px; border: 1px solid #e5e7eb;" onerror="this.style.display='none'">` : ''}
                    <span>${item.name}</span>
                </div>
            </td>
            <td style="padding: 12px; text-align: center;">${item.quantity}</td>
            <td style="padding: 12px; text-align: right;">${currency}${item.price.toFixed(2)}</td>
            <td style="padding: 12px; text-align: right; font-weight: 600;">${currency}${(item.price * item.quantity).toFixed(2)}</td>
        </tr>
    `}).join('');

    // Determine payment status
    const paymentStatus = paymentMethod === 'COD' 
        ? 'Cash on Delivery (Payment Pending)' 
        : (isPaid ? '✓ Paid' : 'Payment Pending');
    
    const paymentStatusColor = paymentMethod === 'COD' ? '#f59e0b' : (isPaid ? '#22c55e' : '#ef4444');

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Invoice - ${orderId}</title>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { 
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                    background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); 
                    padding: 20px; 
                    line-height: 1.6;
                }
                .invoice-container { 
                    max-width: 900px; 
                    margin: 0 auto; 
                    background: white; 
                    padding: 40px; 
                    border-radius: 12px; 
                    box-shadow: 0 4px 20px rgba(0,0,0,0.15); 
                }
                .invoice-header { 
                    display: flex; 
                    justify-content: space-between; 
                    align-items: flex-start;
                    margin-bottom: 40px; 
                    padding-bottom: 25px; 
                    border-bottom: 3px solid #ef4444; 
                }
                .company-info { flex: 1; }
                .company-logo { margin-bottom: 10px; }
                .company-details { color: #6b7280; font-size: 13px; line-height: 1.8; }
                .invoice-meta { text-align: right; }
                .invoice-meta h1 { 
                    color: #1f2937; 
                    font-size: 32px; 
                    margin-bottom: 10px; 
                    font-weight: 700;
                }
                .invoice-meta p { margin: 5px 0; color: #6b7280; font-size: 14px; }
                .invoice-meta strong { color: #1f2937; }
                .qr-section {
                    background: #f9fafb;
                    padding: 15px;
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
                    font-size: 11px; 
                    color: #6b7280; 
                    margin-top: 8px; 
                }
                .sections { 
                    display: grid; 
                    grid-template-columns: 1fr 1fr; 
                    gap: 30px; 
                    margin: 30px 0; 
                    background: #f9fafb;
                    padding: 25px;
                    border-radius: 8px;
                }
                .section h3 { 
                    font-size: 11px; 
                    font-weight: 700; 
                    color: #ef4444; 
                    margin-bottom: 15px; 
                    text-transform: uppercase; 
                    letter-spacing: 1px; 
                }
                .section p { 
                    margin: 8px 0; 
                    color: #1f2937; 
                    font-size: 14px;
                }
                .section strong { color: #111827; }
                .items-table { 
                    width: 100%; 
                    border-collapse: collapse; 
                    margin: 30px 0; 
                    border: 1px solid #e5e7eb;
                    border-radius: 8px;
                    overflow: hidden;
                }
                .items-table thead { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); }
                .items-table th { 
                    padding: 15px 12px; 
                    text-align: left; 
                    font-weight: 600; 
                    color: white; 
                    font-size: 13px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                .items-table td { 
                    padding: 12px; 
                    border-bottom: 1px solid #e5e7eb; 
                    font-size: 14px;
                }
                .items-table tbody tr:last-child td { border-bottom: none; }
                .items-table tbody tr:hover { background: #f9fafb; }
                .summary { 
                    margin: 30px 0; 
                    border: 2px solid #e5e7eb;
                    border-radius: 8px;
                    padding: 20px;
                    background: #fafafa;
                }
                .summary-row { 
                    display: flex; 
                    justify-content: space-between; 
                    padding: 12px 0; 
                    font-size: 15px;
                    border-bottom: 1px dashed #e5e7eb;
                }
                .summary-row:last-child { border-bottom: none; }
                .summary-row.total { 
                    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); 
                    padding: 18px 20px; 
                    margin: 15px -20px -20px -20px;
                    border-radius: 0 0 6px 6px; 
                    font-size: 20px; 
                    font-weight: 700; 
                    color: white; 
                }
                .summary-label { color: #6b7280; font-weight: 500; }
                .summary-value { font-weight: 600; color: #1f2937; }
                .payment-section { 
                    background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); 
                    border-left: 4px solid #22c55e; 
                    padding: 20px; 
                    border-radius: 8px; 
                    margin: 30px 0; 
                }
                .payment-section strong { color: #166534; }
                .footer { 
                    text-align: center; 
                    color: #6b7280; 
                    font-size: 12px; 
                    margin-top: 40px; 
                    padding-top: 25px; 
                    border-top: 2px solid #e5e7eb; 
                }
                .footer p { margin: 8px 0; }
                .print-button { 
                    display: inline-block; 
                    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); 
                    color: white; 
                    padding: 14px 35px; 
                    border-radius: 8px; 
                    text-decoration: none; 
                    font-weight: 600; 
                    font-size: 15px;
                    margin: 25px 0; 
                    border: none; 
                    cursor: pointer; 
                    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
                    transition: all 0.3s ease;
                }
                .print-button:hover { 
                    transform: translateY(-2px); 
                    box-shadow: 0 6px 16px rgba(239, 68, 68, 0.4); 
                }
                @media print {
                    body { background: white; padding: 0; }
                    .print-button { display: none !important; }
                    .invoice-container { box-shadow: none; padding: 20px; }
                }
                @media (max-width: 768px) {
                    .invoice-container { padding: 20px; }
                    .invoice-header { flex-direction: column; gap: 20px; }
                    .sections { grid-template-columns: 1fr; gap: 20px; }
                    .items-table { font-size: 12px; }
                    .items-table th, .items-table td { padding: 8px; }
                }
            </style>
        </head>
        <body>
            <div class="invoice-container">
                <div class="invoice-header">
                    <div class="company-info">
                        <div class="company-logo">${logoHTML}</div>
                        <div class="company-details">
                            <p><strong>CrashKart Private Limited</strong></p>
                            <p>📍 123 Shopping Street, E-Commerce Hub</p>
                            <p>New Delhi, India - 110001</p>
                            <p>📧 crashkart.help@gmail.com</p>
                            <p>☎️ 1800-987-6543 (Toll Free)</p>
                            <p>🌐 www.crashkart.com</p>
                        </div>
                    </div>
                    <div class="invoice-meta">
                        <h1>INVOICE</h1>
                        <p><strong>Invoice No:</strong> INV-${orderId.substring(0, 15)}</p>
                        <p><strong>Invoice Date:</strong> ${new Date(orderDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                        <p><strong>Order ID:</strong> ${orderId}</p>
                        <div class="qr-section">
                            <img src="${qrCodeUrl}" alt="Order QR Code" onerror="this.style.display='none';this.nextElementSibling.textContent='QR code unavailable'" />
                            <p><strong>Scan to track your order</strong></p>
                        </div>
                    </div>
                </div>

                <div class="sections">
                    <div class="section">
                        <h3>📋 Billing Address</h3>
                        <p><strong>${customerName || 'N/A'}</strong></p>
                        <p>${address.street || ''}</p>
                        <p>${address.city || ''}, ${address.state || ''}</p>
                        <p>${address.zipCode || ''}, ${address.country || 'India'}</p>
                        <p>📱 <strong>Phone:</strong> ${customerPhone || address.phone || 'N/A'}</p>
                        <p>📧 <strong>Email:</strong> ${customerEmail || 'N/A'}</p>
                    </div>
                    <div class="section">
                        <h3>🚚 Shipping Address</h3>
                        <p><strong>${customerName || 'N/A'}</strong></p>
                        <p>${address.street || ''}</p>
                        <p>${address.city || ''}, ${address.state || ''}</p>
                        <p>${address.zipCode || ''}, ${address.country || 'India'}</p>
                        <p>📱 <strong>Phone:</strong> ${customerPhone || address.phone || 'N/A'}</p>
                        <p>📧 <strong>Email:</strong> ${customerEmail || 'N/A'}</p>
                    </div>
                </div>

                <h3 style="color: #1f2937; margin-bottom: 15px; font-size: 18px;">Order Items</h3>
                <table class="items-table">
                    <thead>
                        <tr>
                            <th>Product Name</th>
                            <th style="text-align: center;">Quantity</th>
                            <th style="text-align: right;">Unit Price</th>
                            <th style="text-align: right;">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHTML}
                    </tbody>
                </table>

                <div class="summary">
                    ${subtotal ? `
                    <div class="summary-row">
                        <span class="summary-label">Subtotal:</span>
                        <span class="summary-value">${currency}${subtotal.toFixed(2)}</span>
                    </div>
                    ` : ''}
                    
                    ${discount && discount > 0 ? `
                    <div class="summary-row">
                        <span class="summary-label">Coupon Discount:</span>
                        <span class="summary-value" style="color: #22c55e;">-${currency}${discount.toFixed(2)}</span>
                    </div>
                    ` : ''}
                    
                    ${tax && tax > 0 ? `
                    <div class="summary-row">
                        <span class="summary-label">Tax (GST):</span>
                        <span class="summary-value">${currency}${tax.toFixed(2)}</span>
                    </div>
                    ` : ''}
                    
                    ${crashCashApplied && crashCashApplied > 0 ? `
                    <div class="summary-row">
                        <span class="summary-label">🎁 CrashCash Applied:</span>
                        <span class="summary-value" style="color: #fbbf24;">-${currency}${crashCashApplied.toFixed(2)}</span>
                    </div>
                    ` : ''}
                    
                    <div class="summary-row">
                        <span class="summary-label">Shipping:</span>
                        <span class="summary-value" style="color: #22c55e;">Free</span>
                    </div>
                    
                    <div class="summary-row total">
                        <span>TOTAL AMOUNT</span>
                        <span>${currency}${total.toFixed(2)}</span>
                    </div>
                </div>

                <div class="payment-section" style="background: ${paymentStatusColor}15; border-color: ${paymentStatusColor};">
                    <p style="margin: 8px 0;"><strong>Payment Method:</strong> ${paymentMethod === 'COD' ? 'Cash on Delivery' : paymentMethod}</p>
                    <p style="margin: 8px 0; color: ${paymentStatusColor}; font-weight: 600; font-size: 16px;"><strong>Payment Status:</strong> ${paymentStatus}</p>
                </div>

                <div class="footer">
                    <p style="font-size: 14px; color: #1f2937; font-weight: 600; margin-bottom: 10px;">
                        🙏 Thank you for shopping with CrashKart!
                    </p>
                    <p>For any queries, please contact our customer support at crashkart.help@gmail.com or call 1-800-CRASHKART</p>
                    <p>This is a computer-generated invoice and does not require a signature.</p>
                    <p style="margin-top: 15px; font-size: 11px; color: #9ca3af;">
                        Generated on: ${new Date().toLocaleString('en-IN', { dateStyle: 'full', timeStyle: 'short' })}
                    </p>
                </div>

                <div style="text-align: center;">
                    <button class="print-button" onclick="window.print()">🖨️ Print PDF</button>
                </div>
            </div>
        </body>
        </html>
    `;
}
