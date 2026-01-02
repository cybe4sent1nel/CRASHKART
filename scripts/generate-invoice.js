#!/usr/bin/env node
// CLI script to generate a PDF invoice using pdfkit and write base64 to stdout.
// Usage: node scripts/generate-invoice.js  (reads JSON from stdin)

async function main() {
    try {
        const fs = require('fs');
        const {Readable} = require('stream');
        const getStdin = async () => {
            const chunks = [];
            for await (const chunk of process.stdin) chunks.push(chunk);
            return Buffer.concat(chunks).toString('utf8');
        };

        const input = await getStdin();
        if (!input) {
            console.error('No input provided');
            process.exit(2);
        }

        const orderData = JSON.parse(input);

        // lazy require heavy libs
        const PDFDocument = require('pdfkit');

        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        const chunks = [];
        doc.on('data', (c) => chunks.push(c));
        doc.on('end', () => {
            const pdfBuffer = Buffer.concat(chunks);
            // write base64 to stdout
            process.stdout.write(pdfBuffer.toString('base64'));
        });

        // Simple invoice content (keeps consistent with generateInvoiceHTML)
        doc.fontSize(20).text('INVOICE', { align: 'right' });
        doc.moveDown();

        const {
            orderId = 'N/A',
            customerName = 'Customer',
            items = [],
            subtotal = 0,
            discount = 0,
            tax = 0,
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

        doc.fontSize(12).fillColor('#111').text('Billing & Shipping', { underline: true });
        doc.moveDown(0.5);
        const left = 50;
        const startY = doc.y;
        doc.fontSize(10).text(customerName || 'N/A', left, startY);
        doc.text(address.street || '', left);
        doc.text(`${address.city || ''} ${address.state || ''} ${address.zipCode || ''}`.trim(), left);
        doc.text(address.country || 'India', left);
        doc.text(`Payment Method: ${paymentMethod}`, left);

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

        doc.moveDown(1);
        doc.fontSize(10).text(`Subtotal: ${currency}${(subtotal || 0).toFixed(2)}`, { align: 'right' });
        if (discount && discount > 0) doc.text(`Discount: -${currency}${discount.toFixed(2)}`, { align: 'right' });
        if (tax && tax > 0) doc.text(`Tax: ${currency}${tax.toFixed(2)}`, { align: 'right' });
        doc.moveDown(0.5);
        doc.fontSize(12).font('Helvetica-Bold').text(`TOTAL: ${currency}${(total || 0).toFixed(2)}`, { align: 'right' });
        doc.font('Helvetica');

        doc.end();

    } catch (err) {
        console.error('Invoice generator CLI error:', err?.message || err);
        process.exit(1);
    }
}

main();
