import { prisma } from '@/lib/prisma'
import { sendPaymentReceivedEmail } from '@/lib/email'
import { verifyUserToken } from '@/lib/authTokens'

// Prevent Next.js from attempting to pre-render this route
export const dynamic = 'force-dynamic'

export async function PUT(req, { params }) {
    try {
        const resolvedParams = await params;
        const orderId = resolvedParams.orderId;

        const authHeader = req.headers.get('authorization')
        let userId = null
        if (authHeader?.startsWith('Bearer ')) {
            const token = authHeader.slice(7)
            try {
                const verified = await verifyUserToken(token)
                userId = verified.user.id
            } catch (err) {
                console.warn('payment-received: token verification failed, continuing as guest flow')
            }
        }

        const body = await req.json()
        const { isPaid, status } = body

        console.log(`🔔 Payment received endpoint for order ${orderId}`, { isPaid, status })

        const user = userId ? await prisma.user.findUnique({ where: { id: userId } }) : null

        const order = await prisma.order.findUnique({ where: { id: orderId }, include: { user: true, address: true, orderItems: { include: { product: true } } } })
        if (!order) return Response.json({ message: 'Order not found' }, { status: 404 })
        const targetUser = user || order.user
        if (!targetUser) return Response.json({ message: 'User not found' }, { status: 404 })

        // Update order as paid but DO NOT trigger full order-confirm email here.
        const validStatuses = new Set([
            'ORDER_PLACED',
            'PROCESSING',
            'SHIPPED',
            'DELIVERED',
            'PAYMENT_PENDING',
            'PAYMENT_RECEIVED',
            'CANCELLED',
            'RETURN_ACCEPTED',
            'RETURN_PICKED_UP',
            'REFUND_COMPLETED'
        ])

        const updateData = {
            isPaid: isPaid === true,
            notes: JSON.stringify({
                ...JSON.parse(order.notes || '{}'),
                paymentReceivedAt: new Date().toISOString(),
                paymentReceivedBy: 'payment-received-page'
            })
        }

        if (status && validStatuses.has(status)) {
            updateData.status = status
        }

        const prevStatus = order.status

        const updated = await prisma.order.update({
            where: { id: orderId },
            data: updateData
        })

        // If status moved into cancellation/return states, restore stock
        try {
            const restoreStatuses = ['CANCELLED', 'RETURN_ACCEPTED', 'RETURN_PICKED_UP', 'REFUND_COMPLETED'];
            if (status && !restoreStatuses.includes(String(prevStatus)) && restoreStatuses.includes(String(status))) {
                const itemsToRestore = await prisma.orderItem.findMany({ where: { orderId }, include: { product: true } })
                for (const it of itemsToRestore || []) {
                    const pid = it.productId
                    const qty = Number(it.quantity || 0)
                    try {
                        await prisma.product.update({ where: { id: pid }, data: { quantity: { increment: qty }, inStock: true } })
                    } catch (pErr) {
                        console.error(`Failed to restore product ${pid} on status ${status}:`, pErr.message)
                    }

                    try {
                        const sales = await prisma.flashSale.findMany({ where: { products: { has: pid } } })
                        for (const sale of sales || []) {
                            const pq = sale.productQuantities || {}
                            const current = (pq && pq[pid]) ? Number(pq[pid]) : Number(sale.maxQuantity || 0)
                            const newPQ = Number(current) + qty
                            const newPQObj = { ...(pq || {}), [pid]: newPQ }
                            const soldAfter = Math.max(0, Number(sale.sold || 0) - qty)
                            await prisma.flashSale.update({ where: { id: sale.id }, data: { productQuantities: newPQObj, sold: soldAfter } })
                        }
                    } catch (fsErr) {
                        console.error(`Failed to restore flash sale stock for ${pid}:`, fsErr.message)
                    }
                }
            }
        } catch (restoreErr) {
            console.error('Error restoring stock after payment-received status update:', restoreErr.message)
        }

        // Send a lightweight "payment received" email to inform the customer payment was received, with invoice attached when possible.
        try {
            // Get customer name from user, address, or email
            const customerName = targetUser.name || order.address?.name || targetUser.email.split('@')[0]
            
            const emailData = {
                orderId: updated.id,
                items: (order.orderItems || []).map(i => ({ name: i.product?.name || 'Product', quantity: i.quantity, price: i.price, image: i.product?.images?.[0] || null })),
                total: updated.total,
                paymentMethod: updated.paymentMethod,
                address: order.address,
                customerName: customerName
            }

            let invoiceAttachment = null

            // Try Puppeteer-based invoice first
            try {
                const { generateInvoicePdf } = await import('@/lib/invoicePuppeteer')
                invoiceAttachment = await generateInvoicePdf(emailData, { type: 'payment' })
            } catch (pdfErr) {
                console.warn('Puppeteer invoice generation (payment) failed:', pdfErr?.message || pdfErr)
            }

            // Fallback to legacy generator if needed
            if (!invoiceAttachment) {
                try {
                    const { getInvoiceAttachment } = await import('@/lib/invoiceGenerator')
                    invoiceAttachment = await getInvoiceAttachment(emailData)
                } catch (genErr) {
                    console.warn('Fallback invoice generator (payment) failed:', genErr?.message || genErr)
                }
            }

            await sendPaymentReceivedEmail(targetUser.email, emailData, invoiceAttachment || null, customerName)
            console.log('📧 Payment received email sent to', targetUser.email, 'attachment:', Boolean(invoiceAttachment))
        } catch (emailErr) {
            console.warn('Failed to send payment received email:', emailErr?.message || emailErr)
        }

        return Response.json({ success: true, order: { id: updated.id, isPaid: updated.isPaid, status: updated.status } }, { status: 200 })

    } catch (error) {
        console.error('Payment-received route error:', error)
        return Response.json({ message: error.message || 'Failed' }, { status: 500 })
    }
}
