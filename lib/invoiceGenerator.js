import PDFDocument from 'pdfkit';

/**
 * Generate an invoice PDF for an order
 * Returns a PDF buffer that can be sent via email or downloaded
 */
export async function generateInvoicePDF(orderData) {
    return new Promise((resolve, reject) => {
        try {
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

            // Create PDF document
            const doc = new PDFDocument({
                bufferPages: true,
                size: 'A4',
                margin: 50
            });

            // Create a buffer to store PDF data
            const chunks = [];
            doc.on('data', chunk => chunks.push(chunk));
            doc.on('end', () => {
                const pdfBuffer = Buffer.concat(chunks);
                resolve(pdfBuffer);
            });

            // Helper functions for styling
            const addHeader = () => {
                // Logo and company name
                doc.fontSize(24)
                    .font('Helvetica-Bold')
                    .text('CRASHKART', 50, 40);
                
                doc.fontSize(10)
                    .font('Helvetica')
                    .text('Your Shopping Destination', 50, 70);

                // Invoice title and date
                doc.fontSize(14)
                    .font('Helvetica-Bold')
                    .text('INVOICE', 450, 50);

                doc.fontSize(9)
                    .font('Helvetica')
                    .text(`Invoice #: ${orderId}`, 450, 75)
                    .text(`Date: ${new Date(orderDate).toLocaleDateString()}`, 450, 90);

                // Divider line
                doc.moveTo(50, 110)
                    .lineTo(550, 110)
                    .stroke('#cccccc');
            };

            const addCustomerInfo = () => {
                const startY = 130;
                
                doc.fontSize(11)
                    .font('Helvetica-Bold')
                    .text('BILL TO:', 50, startY);

                doc.fontSize(10)
                    .font('Helvetica')
                    .text(customerName || 'N/A', 50, startY + 20)
                    .text(address.street || '', 50, startY + 35)
                    .text(`${address.city || ''}, ${address.state || ''} ${address.zipCode || ''}`, 50, startY + 50)
                    .text(address.country || 'India', 50, startY + 65)
                    .text(`Phone: ${customerPhone || address.phone || 'N/A'}`, 50, startY + 85)
                    .text(`Email: ${customerEmail || 'N/A'}`, 50, startY + 100);
            };

            const addItemsTable = () => {
                const startY = 260;
                const tableTop = startY;
                const rowHeight = 25;
                const colWidth = (500 - 50) / 4; // 450 total width divided by 4 columns

                // Table header
                doc.fontSize(10)
                    .font('Helvetica-Bold')
                    .fillColor('#1f2937')
                    .rect(50, tableTop, 450, 25)
                    .fill()
                    .fillColor('#ffffff')
                    .text('Description', 60, tableTop + 7)
                    .text('Qty', 50 + colWidth * 2.2, tableTop + 7)
                    .text('Unit Price', 50 + colWidth * 2.8, tableTop + 7)
                    .text('Amount', 50 + colWidth * 3.5, tableTop + 7);

                // Items
                let currentY = tableTop + 25;
                doc.fillColor('#000000');
                
                items.forEach((item, index) => {
                    const itemTotal = (item.price * item.quantity).toFixed(2);
                    
                    doc.fontSize(9)
                        .font('Helvetica')
                        .text(item.name.substring(0, 30), 60, currentY)
                        .text(item.quantity.toString(), 50 + colWidth * 2.2, currentY)
                        .text(`${currency}${item.price.toFixed(2)}`, 50 + colWidth * 2.8, currentY)
                        .text(`${currency}${itemTotal}`, 50 + colWidth * 3.5, currentY);

                    currentY += rowHeight;
                });

                // Totals section
                const totalsY = currentY + 15;
                const totalsX = 50 + colWidth * 2.2;

                doc.fontSize(10)
                    .font('Helvetica');

                if (subtotal) {
                    doc.text('Subtotal:', totalsX, totalsY, { width: 150, align: 'right' })
                        .text(`${currency}${subtotal.toFixed(2)}`, totalsX + 150, totalsY);
                }

                let nextY = totalsY + 20;

                if (discount && discount > 0) {
                    doc.fillColor('#22c55e')
                        .text('Discount:', totalsX, nextY, { width: 150, align: 'right' })
                        .text(`-${currency}${discount.toFixed(2)}`, totalsX + 150, nextY)
                        .fillColor('#000000');
                    nextY += 20;
                }

                if (tax && tax > 0) {
                    doc.text('Tax:', totalsX, nextY, { width: 150, align: 'right' })
                        .text(`${currency}${tax.toFixed(2)}`, totalsX + 150, nextY);
                    nextY += 20;
                }

                if (crashCashApplied && crashCashApplied > 0) {
                    doc.fillColor('#fbbf24')
                        .font('Helvetica-Bold')
                        .text('CrashCash Applied:', totalsX, nextY, { width: 150, align: 'right' })
                        .text(`-${currency}${crashCashApplied.toFixed(2)}`, totalsX + 150, nextY)
                        .fillColor('#000000');
                    nextY += 20;
                }

                // Final total - highlighted
                doc.fontSize(12)
                    .font('Helvetica-Bold')
                    .rect(totalsX - 150, nextY - 5, 310, 25)
                    .stroke('#ef4444');
                
                doc.fillColor('#ef4444')
                    .text('TOTAL AMOUNT:', totalsX, nextY + 5, { width: 150, align: 'right' })
                    .text(`${currency}${total.toFixed(2)}`, totalsX + 150, nextY + 5);

                return nextY + 30;
            };

            const addPaymentInfo = (startY) => {
                doc.fontSize(10)
                    .font('Helvetica-Bold')
                    .fillColor('#1f2937')
                    .text('PAYMENT DETAILS', 50, startY);

                doc.fontSize(9)
                    .font('Helvetica')
                    .fillColor('#000000')
                    .text(`Payment Method: ${paymentMethod}`, 50, startY + 25)
                    .text(`Payment Status: ${paymentMethod === 'COD' ? 'Pending on Delivery' : 'Paid'}`, 50, startY + 40);
            };

            const addFooter = () => {
                const footerY = 750;
                
                doc.moveTo(50, footerY)
                    .lineTo(550, footerY)
                    .stroke('#cccccc');

                doc.fontSize(8)
                    .font('Helvetica')
                    .fillColor('#6b7280')
                    .text('Thank you for your purchase!', 50, footerY + 15)
                    .text('For inquiries, contact: support@crashkart.com', 50, footerY + 30)
                    .text(`Generated on: ${new Date().toLocaleString()}`, 50, footerY + 45);

                // Page number
                doc.fontSize(7)
                    .text(`Page 1`, 500, footerY + 45);
            };

            // Build the invoice
            addHeader();
            addCustomerInfo();
            const nextY = addItemsTable();
            addPaymentInfo(nextY);
            addFooter();

            // Finalize PDF
            doc.end();

        } catch (error) {
            reject(new Error(`Failed to generate invoice: ${error.message}`));
        }
    });
}

/**
 * Generate invoice and return as attachment object for email
 */
export async function getInvoiceAttachment(orderData) {
    try {
        const pdfBuffer = await generateInvoicePDF(orderData);
        
        return {
            filename: `Invoice-${orderData.orderId}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf'
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
