import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';

/**
 * Generate a vibrant, colorful invoice PDF with QR code
 * Supports both single and multiple products in one order
 */
export async function generateVibrantInvoicePDF(orderData) {
    return new Promise(async (resolve, reject) => {
        try {
            const {
                orderId,
                customerName,
                customerEmail,
                customerPhone,
                items = [], // Array of {name, quantity, price, shipmentId, image}
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

            // Generate QR code for order tracking
            const qrCodeDataUrl = await QRCode.toDataURL(
                `${process.env.NEXT_PUBLIC_APP_URL || 'https://crashkart.com'}/track/${orderId}`,
                { width: 200, margin: 1, color: { dark: '#ef4444', light: '#fff' } }
            );

            const doc = new PDFDocument({
                bufferPages: true,
                size: 'A4',
                margin: 40
            });

            const chunks = [];
            doc.on('data', chunk => chunks.push(chunk));
            doc.on('end', () => {
                const pdfBuffer = Buffer.concat(chunks);
                resolve(pdfBuffer);
            });

            // Color scheme - Vibrant
            const colors = {
                primary: '#ef4444',      // Red
                secondary: '#3b82f6',    // Blue
                accent: '#fbbf24',       // Amber
                success: '#22c55e',      // Green
                dark: '#1f2937',         // Dark gray
                light: '#f9fafb'         // Light gray
            };

            // Header with gradient effect
            const addVibrantHeader = () => {
                // Background color
                doc.rect(0, 0, doc.page.width, 120)
                    .fill(colors.primary);

                // Company name and logo area
                doc.fontSize(32)
                    .font('Helvetica-Bold')
                    .fillColor('#ffffff')
                    .text('CRASHKART', 50, 30);

                doc.fontSize(11)
                    .font('Helvetica')
                    .fillColor('#ffffff')
                    .text('Your Shopping Destination', 50, 68);

                // QR Code on right side
                const qrX = 450;
                const qrY = 20;
                const qrSize = 100;

                // Draw QR code image
                doc.image(Buffer.from(qrCodeDataUrl.split(',')[1], 'base64'), qrX, qrY, {
                    width: qrSize,
                    height: qrSize
                });

                doc.fontSize(8)
                    .font('Helvetica')
                    .fillColor('#ffffff')
                    .text('Scan to track', qrX - 10, qrY + qrSize + 5, { width: 120, align: 'center' });

                // Invoice details box
                doc.rect(50, 130, 510, 50)
                    .stroke(colors.primary);

                doc.fontSize(16)
                    .font('Helvetica-Bold')
                    .fillColor(colors.primary)
                    .text('INVOICE', 60, 140);

                doc.fontSize(10)
                    .font('Helvetica')
                    .fillColor(colors.dark);

                const invoiceDetails = [
                    { label: 'Invoice #:', value: orderId },
                    { label: 'Date:', value: new Date(orderDate).toLocaleDateString() },
                    { label: 'Items:', value: items.length.toString() }
                ];

                let detailX = 250;
                invoiceDetails.forEach((detail, idx) => {
                    doc.fontSize(9)
                        .font('Helvetica-Bold')
                        .text(detail.label, detailX, 140 + (idx * 15))
                        .font('Helvetica')
                        .text(detail.value, detailX + 70, 140 + (idx * 15));
                });
            };

            const addCustomerInfo = () => {
                const startY = 200;

                // Bill to section
                doc.rect(50, startY, 230, 130)
                    .stroke(colors.secondary);

                doc.fontSize(11)
                    .font('Helvetica-Bold')
                    .fillColor(colors.secondary)
                    .text('BILL TO', 60, startY + 10);

                doc.fontSize(10)
                    .font('Helvetica')
                    .fillColor(colors.dark)
                    .text(customerName || 'N/A', 60, startY + 30)
                    .fontSize(9)
                    .text(address.street || '', 60, startY + 50)
                    .text(`${address.city || ''}, ${address.state || ''}`, 60, startY + 65)
                    .text(address.zipCode || '', 60, startY + 80)
                    .text(address.country || 'India', 60, startY + 95)
                    .text(`📞 ${customerPhone || 'N/A'}`, 60, startY + 115)
                    .text(`✉️ ${customerEmail || 'N/A'}`, 60, startY + 130);

                // Shipping address (same as billing for now)
                doc.rect(310, startY, 250, 130)
                    .stroke(colors.success);

                doc.fontSize(11)
                    .font('Helvetica-Bold')
                    .fillColor(colors.success)
                    .text('SHIPPING TO', 320, startY + 10);

                doc.fontSize(10)
                    .font('Helvetica')
                    .fillColor(colors.dark)
                    .text(customerName || 'N/A', 320, startY + 30)
                    .fontSize(9)
                    .text(address.street || '', 320, startY + 50)
                    .text(`${address.city || ''}, ${address.state || ''}`, 320, startY + 65)
                    .text(address.zipCode || '', 320, startY + 80)
                    .text(address.country || 'India', 320, startY + 95)
                    .text(`📞 ${customerPhone || 'N/A'}`, 320, startY + 115)
                    .text(`🚚 Est. Delivery: 3-5 days`, 320, startY + 130);
            };

            const addItemsTable = () => {
                const startY = 360;
                const rowHeight = 40;

                // Table header
                doc.rect(50, startY, 510, 30)
                    .fill(colors.primary);

                doc.fontSize(10)
                    .font('Helvetica-Bold')
                    .fillColor('#ffffff')
                    .text('ITEM DETAILS', 60, startY + 7)
                    .text('QTY', 280, startY + 7)
                    .text('UNIT PRICE', 330, startY + 7)
                    .text('SHIPMENT ID', 420, startY + 7)
                    .text('AMOUNT', 520, startY + 7, { align: 'right' });

                let currentY = startY + 30;
                const itemColors = [colors.secondary, colors.accent, colors.success];

                items.forEach((item, index) => {
                    const itemTotal = (item.price * item.quantity).toFixed(2);
                    const bgColor = itemColors[index % itemColors.length];

                    // Alternating background
                    if (index % 2 === 0) {
                        doc.rect(50, currentY, 510, rowHeight)
                            .fill(colors.light);
                    }

                    // Item details
                    doc.fontSize(9)
                        .font('Helvetica')
                        .fillColor(colors.dark)
                        .text(item.name.substring(0, 35), 60, currentY + 8, { width: 200 })
                        .text(item.quantity.toString(), 280, currentY + 8)
                        .text(`${currency}${item.price.toFixed(2)}`, 330, currentY + 8)
                        .font('Helvetica-Bold')
                        .fillColor(bgColor)
                        .text(item.shipmentId || `SHP-${index + 1}`, 420, currentY + 8, { width: 80 });

                    doc.font('Helvetica-Bold')
                        .fillColor(colors.primary)
                        .text(`${currency}${itemTotal}`, 520, currentY + 8, { align: 'right' });

                    currentY += rowHeight;
                });

                return currentY + 10;
            };

            const addTotalsSection = (startY) => {
                const columnWidth = 150;
                const totalsX = 350;

                doc.fontSize(10)
                    .font('Helvetica')
                    .fillColor(colors.dark);

                let currentY = startY;

                // Subtotal
                doc.text('Subtotal:', totalsX, currentY, { width: columnWidth, align: 'right' })
                    .fontSize(10)
                    .font('Helvetica-Bold')
                    .fillColor(colors.dark)
                    .text(`${currency}${subtotal.toFixed(2)}`, totalsX + columnWidth + 10, currentY);

                currentY += 25;

                // Discount
                if (discount && discount > 0) {
                    doc.fontSize(10)
                        .font('Helvetica')
                        .fillColor(colors.success)
                        .text('Discount:', totalsX, currentY, { width: columnWidth, align: 'right' })
                        .font('Helvetica-Bold')
                        .text(`-${currency}${discount.toFixed(2)}`, totalsX + columnWidth + 10, currentY);
                    currentY += 25;
                }

                // Tax
                if (tax && tax > 0) {
                    doc.fontSize(10)
                        .font('Helvetica')
                        .fillColor(colors.dark)
                        .text('Tax (GST):', totalsX, currentY, { width: columnWidth, align: 'right' })
                        .font('Helvetica-Bold')
                        .text(`${currency}${tax.toFixed(2)}`, totalsX + columnWidth + 10, currentY);
                    currentY += 25;
                }

                // CrashCash
                if (crashCashApplied && crashCashApplied > 0) {
                    doc.fontSize(10)
                        .font('Helvetica')
                        .fillColor(colors.accent)
                        .text('CrashCash:', totalsX, currentY, { width: columnWidth, align: 'right' })
                        .font('Helvetica-Bold')
                        .text(`-${currency}${crashCashApplied.toFixed(2)}`, totalsX + columnWidth + 10, currentY);
                    currentY += 25;
                }

                // Final Total - Highlighted box
                doc.rect(totalsX - 10, currentY - 5, columnWidth + 120, 30)
                    .fill(colors.primary);

                doc.fontSize(14)
                    .font('Helvetica-Bold')
                    .fillColor('#ffffff')
                    .text('TOTAL:', totalsX, currentY + 5, { width: columnWidth, align: 'right' })
                    .text(`${currency}${total.toFixed(2)}`, totalsX + columnWidth + 10, currentY + 5);

                return currentY + 40;
            };

            const addPaymentInfo = (startY) => {
                doc.rect(50, startY, 510, 60)
                    .stroke(colors.accent);

                doc.fontSize(11)
                    .font('Helvetica-Bold')
                    .fillColor(colors.accent)
                    .text('PAYMENT INFORMATION', 60, startY + 10);

                doc.fontSize(10)
                    .font('Helvetica')
                    .fillColor(colors.dark)
                    .text(`Payment Method: ${paymentMethod}`, 60, startY + 30)
                    .text(`Payment Status: ${paymentMethod === 'COD' ? 'Pending on Delivery' : 'Completed'}`, 60, startY + 45);
            };

            const addFooter = () => {
                const footerY = doc.page.height - 80;

                doc.moveTo(50, footerY)
                    .lineTo(550, footerY)
                    .stroke(colors.light);

                doc.fontSize(9)
                    .font('Helvetica')
                    .fillColor(colors.dark)
                    .text('Thank you for shopping with CrashKart! ❤️', 50, footerY + 15, { align: 'center' })
                    .text('For support: crashkart.help@gmail.com | Phone: +91-XXXX-XXXX', 50, footerY + 30, { align: 'center' })
                    .fontSize(8)
                    .fillColor('#6b7280')
                    .text(`Generated: ${new Date().toLocaleString()}`, 50, footerY + 45, { align: 'center' });
            };

            // Build invoice
            addVibrantHeader();
            addCustomerInfo();
            const nextY = addItemsTable();
            const totalsY = addTotalsSection(nextY);
            addPaymentInfo(totalsY);
            addFooter();

            doc.end();

        } catch (error) {
            reject(new Error(`Failed to generate invoice: ${error.message}`));
        }
    });
}

/**
 * Get vibrant invoice as email attachment
 */
export async function getVibrantInvoiceAttachment(orderData) {
    try {
        const pdfBuffer = await generateVibrantInvoicePDF(orderData);

        return {
            filename: `Invoice-${orderData.orderId}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf'
        };
    } catch (error) {
        console.error('Failed to generate vibrant invoice attachment:', error);
        return null;
    }
}
