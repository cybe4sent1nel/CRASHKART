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
        orderDate = new Date(),
        currency = '₹'
    } = orderData;

    const itemsHTML = items.map((item, idx) => `
        <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 12px; text-align: left;">${item.name}</td>
            <td style="padding: 12px; text-align: center;">${item.quantity}</td>
            <td style="padding: 12px; text-align: right;">${currency}${item.price.toFixed(2)}</td>
            <td style="padding: 12px; text-align: right;">${currency}${(item.price * item.quantity).toFixed(2)}</td>
        </tr>
    `).join('');

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f9fafb; margin: 0; padding: 20px; }
                .invoice-container { max-width: 800px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
                .invoice-header { display: flex; justify-content: space-between; margin-bottom: 40px; border-bottom: 2px solid #ef4444; padding-bottom: 20px; }
                .company-info h1 { color: #ef4444; margin: 0; font-size: 28px; }
                .company-info p { color: #6b7280; margin: 5px 0 0 0; }
                .invoice-meta { text-align: right; }
                .invoice-meta h2 { margin: 0; font-size: 24px; color: #1f2937; }
                .invoice-meta p { margin: 5px 0; color: #6b7280; }
                .sections { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin: 30px 0; }
                .section h3 { font-size: 12px; font-weight: bold; color: #6b7280; margin: 0 0 15px 0; text-transform: uppercase; letter-spacing: 0.5px; }
                .section p { margin: 5px 0; color: #1f2937; }
                .items-table { width: 100%; border-collapse: collapse; margin: 30px 0; }
                .items-table th { background: #f3f4f6; padding: 12px; text-align: left; font-weight: 600; color: #1f2937; border-bottom: 2px solid #e5e7eb; }
                .items-table td { padding: 12px; border-bottom: 1px solid #e5e7eb; }
                .summary { margin: 30px 0; }
                .summary-row { display: flex; justify-content: space-between; padding: 10px 0; }
                .summary-row.total { background: #f3f4f6; padding: 15px; border-radius: 6px; font-size: 16px; font-weight: bold; color: #ef4444; }
                .summary-label { color: #6b7280; }
                .summary-value { font-weight: 600; color: #1f2937; }
                .payment-section { background: #f0fdf4; border-left: 4px solid #22c55e; padding: 15px; border-radius: 4px; margin: 30px 0; }
                .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
                .print-button { display: inline-block; background: #ef4444; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: 600; margin: 20px 0; border: none; cursor: pointer; }
                @media print {
                    body { background: white; }
                    .print-button { display: none; }
                    .invoice-container { box-shadow: none; }
                }
            </style>
        </head>
        <body>
            <div class="invoice-container">
                <div class="invoice-header">
                    <div class="company-info">
                        <h1>CRASHKART</h1>
                        <p>Your Shopping Destination</p>
                    </div>
                    <div class="invoice-meta">
                        <h2>INVOICE</h2>
                        <p><strong>Invoice #:</strong> ${orderId}</p>
                        <p><strong>Date:</strong> ${new Date(orderDate).toLocaleDateString()}</p>
                    </div>
                </div>

                <div class="sections">
                    <div class="section">
                        <h3>Bill To</h3>
                        <p><strong>${customerName || 'N/A'}</strong></p>
                        <p>${address.street || ''}</p>
                        <p>${address.city || ''}, ${address.state || ''} ${address.zipCode || ''}</p>
                        <p>${address.country || 'India'}</p>
                        <p>📱 ${customerPhone || address.phone || 'N/A'}</p>
                        <p>📧 ${customerEmail || 'N/A'}</p>
                    </div>
                </div>

                <table class="items-table">
                    <thead>
                        <tr>
                            <th>Description</th>
                            <th style="text-align: center;">Qty</th>
                            <th style="text-align: right;">Unit Price</th>
                            <th style="text-align: right;">Amount</th>
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
                        <span class="summary-label">Discount:</span>
                        <span class="summary-value" style="color: #22c55e;">-${currency}${discount.toFixed(2)}</span>
                    </div>
                    ` : ''}
                    
                    ${tax && tax > 0 ? `
                    <div class="summary-row">
                        <span class="summary-label">Tax:</span>
                        <span class="summary-value">${currency}${tax.toFixed(2)}</span>
                    </div>
                    ` : ''}
                    
                    ${crashCashApplied && crashCashApplied > 0 ? `
                    <div class="summary-row">
                        <span class="summary-label">CrashCash Applied:</span>
                        <span class="summary-value" style="color: #fbbf24;">-${currency}${crashCashApplied.toFixed(2)}</span>
                    </div>
                    ` : ''}
                    
                    <div class="summary-row total">
                        <span>TOTAL AMOUNT:</span>
                        <span>${currency}${total.toFixed(2)}</span>
                    </div>
                </div>

                <div class="payment-section">
                    <strong>Payment Method:</strong> ${paymentMethod}<br>
                    <strong>Payment Status:</strong> ${paymentMethod === 'COD' ? 'Pending on Delivery' : 'Paid'}
                </div>

                <div class="footer">
                    <p>Thank you for your purchase! For inquiries, contact: support@crashkart.com</p>
                    <p>Generated on: ${new Date().toLocaleString()}</p>
                </div>

                <div style="text-align: center;">
                    <button class="print-button" onclick="window.print()">🖨️ Print Invoice</button>
                </div>
            </div>
        </body>
        </html>
    `;
}
