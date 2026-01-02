/**
 * Production invoice generator that uses PDFKit.
 * Kept separate so dev builds don't statically include pdfkit/fontkit.
 */
export async function getInvoiceAttachment(orderData) {
    try {
        const { default: PDFDocument } = await import('pdfkit');

        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        const chunks = [];
        doc.on('data', (chunk) => chunks.push(chunk));

        const endPromise = new Promise((resolve) => doc.on('end', resolve));

        // Header logo
        const logoUrl = 'https://disabled-blue-pxxlqc3pk9-hwn0d1df7j.edgeone.app/LOGO.png';
        try {
            const resp = await fetch(logoUrl);
            if (resp.ok) {
                const arrayBuffer = await resp.arrayBuffer();
                const logoBuf = Buffer.from(arrayBuffer);
                try { doc.image(logoBuf, 50, 45, { width: 120 }); } catch (e) {}
            }
        } catch (e) {}

        doc.fontSize(20).text('INVOICE', { align: 'right' });
        doc.moveDown();

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

        doc.fontSize(10).fillColor('#444').text(`Order ID: ${orderId}`, { align: 'right' });
        doc.text(`Invoice Date: ${new Date(orderDate).toLocaleString('en-IN')}`, { align: 'right' });
        doc.moveDown(1);

        // Billing & Shipping
        doc.fontSize(12).fillColor('#111').text('Billing & Shipping', { underline: true });
        doc.moveDown(0.5);
        const left = 50;
        const startY = doc.y;
        doc.fontSize(10).text(customerName || 'N/A', left, startY);
        doc.text(address.street || '', left);
        doc.text(`${address.city || ''} ${address.state || ''} ${address.zipCode || ''}`.trim(), left);
        doc.text(address.country || 'India', left);
        doc.text(`Phone: ${customerPhone || address.phone || 'N/A'}`, left);
        doc.text(`Email: ${customerEmail || 'N/A'}`, left);

        // Items table header
        doc.moveDown(1.5);
        const tableTop = doc.y;
        doc.fontSize(10).fillColor('#fff').rect(left, tableTop - 5, 500, 20).fill('#ef4444').fillColor('#fff');
        doc.text('Product', left + 5, tableTop);
        doc.text('Qty', left + 300, tableTop);
        doc.text('Unit', left + 350, tableTop);
        doc.text('Total', left + 420, tableTop);
        doc.fillColor('#000');
        doc.moveDown(1);

        for (const item of items) {
            const name = item.name || item.product?.name || 'Product';
            const qty = item.quantity || 1;
            const unit = (typeof item.price === 'number') ? `${currency}${item.price.toFixed(2)}` : `${currency}0.00`;
            const lineTotal = (item.price || 0) * qty;

            doc.fontSize(10).text(name, left + 5, doc.y, { width: 260 });
            doc.text(String(qty), left + 300, doc.y);
            doc.text(unit, left + 350, doc.y);
            doc.text(`${currency}${lineTotal.toFixed(2)}`, left + 420, doc.y);
            doc.moveDown(0.8);
        }

        // Summary
        doc.moveDown(1);
        doc.fontSize(10).text(`Subtotal: ${currency}${(subtotal || 0).toFixed(2)}`, { align: 'right' });
        if (discount && discount > 0) doc.text(`Discount: -${currency}${discount.toFixed(2)}`, { align: 'right' });
        if (tax && tax > 0) doc.text(`Tax: ${currency}${tax.toFixed(2)}`, { align: 'right' });
        if (crashCashApplied && crashCashApplied > 0) doc.text(`CrashCash Applied: -${currency}${crashCashApplied.toFixed(2)}`, { align: 'right' });
        doc.moveDown(0.5);
        doc.fontSize(12).font('Helvetica-Bold').text(`TOTAL: ${currency}${(total || 0).toFixed(2)}`, { align: 'right' });
        doc.font('Helvetica');

        doc.moveDown(1);
        doc.fontSize(10).text(`Payment Method: ${paymentMethod}`, left);
        doc.text(`Payment Status: ${isPaid ? 'Paid' : 'Pending'}`, left);

        doc.moveDown(2);
        doc.fontSize(10).fillColor('#6b7280').text('This is a computer generated invoice and does not require a signature.', { align: 'center' });

        doc.end();

        await endPromise;
        const pdfBuffer = Buffer.concat(chunks);

        return {
            filename: `Invoice-${orderId}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf'
        };
    } catch (error) {
        console.error('Failed to generate PDF invoice in prod:', error?.message || error);
        // Fallback to HTML
        try {
            const { generateInvoiceHTML } = await import('./invoiceGenerator.js');
            const htmlContent = generateInvoiceHTML(orderData);
            return {
                filename: `Invoice-${orderData.orderId}.html`,
                content: htmlContent,
                contentType: 'text/html; charset=utf-8'
            };
        } catch (err) {
            console.error('Failed to generate fallback HTML invoice in prod:', err?.message || err);
            return null;
        }
    }
}
