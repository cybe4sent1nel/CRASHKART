import { prisma } from '@/lib/prisma'
import { getCurrentSession } from '@/lib/session'
// Prevent Next.js from attempting to pre-render this route
export const dynamic = 'force-dynamic'

/**
 * GET /api/orders/[orderId]/invoice
 * - Requires session user (owner) or admin
 * - Tries to generate PDF via runtime Puppeteer helper
 * - Falls back to an inline HTML invoice
 */
export async function GET(req, { params }) {
  try {
    const { authOptions } = await import('@/lib/auth');
    const session = await getCurrentSession();
    if (!session?.user?.email) return Response.json({ message: 'Unauthorized' }, { status: 401 })

    const resolvedParams = params || {}
    const orderId = resolvedParams?.orderId
    if (!orderId) return Response.json({ message: 'Missing orderId' }, { status: 400 })

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: { select: { id: true, name: true, email: true } },
        address: true,
        orderItems: { include: { product: { select: { id: true, name: true, price: true } } } }
      }
    })

    if (!order) return Response.json({ message: 'Order not found' }, { status: 404 })

    const userEmail = session.user.email
    // Check if user is admin from database (dynamic import)
    const { isAdmin } = await import('@/lib/adminAuth')
    const userIsAdmin = await isAdmin(userEmail)
    const isOwner = order.user?.email === userEmail
    if (!isOwner && !userIsAdmin) return Response.json({ message: 'Forbidden' }, { status: 403 })

    // Parse notes (created at order creation) for stored subtotal/deliveryCharge/originalTotal
    let notes = {};
    try {
      notes = typeof order.notes === 'string' ? JSON.parse(order.notes) : (order.notes || {});
    } catch (e) {
      notes = order.notes || {}
    }

    const subtotalFromNotes = Number(notes.subtotal ?? 0)
    const deliveryChargeFromNotes = Number(notes.deliveryCharge ?? 0)
    const shippingFeeFromNotes = Number(notes.shippingFee ?? 0)
    const convenienceFeeFromNotes = Number(notes.convenienceFee ?? 0)
    const platformFeeFromNotes = Number(notes.platformFee ?? 0)

    // Attempt to parse coupon JSON saved on the order (created as JSON string)
    let savedCoupon = null;
    try {
      savedCoupon = typeof order.coupon === 'string' ? JSON.parse(order.coupon) : order.coupon;
    } catch (e) {
      savedCoupon = order.coupon || null
    }

    // If deliveryCharge is absent, try to derive it from order.total
    let derivedDelivery = deliveryChargeFromNotes
    const couponAmount = Number(savedCoupon?.discount || 0)
    const crashAmount = Number(notes.crashCashDiscount || 0)
    if ((!derivedDelivery || derivedDelivery === 0) && order.total) {
      // delivery = order.total - (subtotal - coupon - crash)
      derivedDelivery = Number(order.total) - (subtotalFromNotes - couponAmount - crashAmount)
      if (isNaN(derivedDelivery) || !isFinite(derivedDelivery)) derivedDelivery = 0
    }

    const invoiceData = {
      orderId: order.id,
      customerName: order.user?.name || order.user?.email?.split('@')[0] || 'Customer',
      customerEmail: order.user?.email,
      items: order.orderItems.map(i => ({ name: i.product?.name || 'Product', quantity: i.quantity, price: i.price })),
      subtotal: subtotalFromNotes || order.orderItems.reduce((s, it) => s + ((it.price || 0) * (it.quantity || 1)), 0),
      deliveryCharge: derivedDelivery,
      shippingFee: shippingFeeFromNotes,
      convenienceFee: convenienceFeeFromNotes,
      platformFee: platformFeeFromNotes,
      couponDiscount: couponAmount || 0,
      couponType: savedCoupon?.couponType || savedCoupon?.type || (savedCoupon?.source === 'scratch' ? savedCoupon?.couponType : null),
      crashCashDiscount: Number(notes.crashCashDiscount || 0),
      total: order.total,
      paymentMethod: order.paymentMethod,
      address: order.address,
      orderDate: order.createdAt
    }

    // If the client requested a PDF download (?download=1), attempt PDF generation.
    const reqUrl = new URL(req.url, process.env.NEXT_PUBLIC_APP_URL || 'http://localhost')
    const wantPdf = reqUrl.searchParams.get('download') === '1'
    if (wantPdf) {
      try {
        const mod = await import('@/lib/invoicePuppeteer');
        const generateInvoicePdf = mod?.generateInvoicePdf || mod?.default?.generateInvoicePdf || mod?.default
        if (typeof generateInvoicePdf === 'function') {
          const pdfBuffer = await generateInvoicePdf(invoiceData, { type: 'order' })
          return new Response(pdfBuffer, {
            status: 200,
            headers: {
              'Content-Type': 'application/pdf',
              'Content-Disposition': `attachment; filename=Invoice-${order.id}.pdf`
            }
          })
        }
      } catch (err) {
        console.warn('PDF generation unavailable, falling back to HTML invoice:', err?.message || err)
      }
    }

    // Fallback: inline HTML invoice (use shared renderer)
    let invoiceHTML = '';
    try {
      const rmod = await import('@/lib/invoiceHtml');
      if (rmod && typeof rmod.renderInvoiceHtml === 'function') {
        invoiceHTML = rmod.renderInvoiceHtml(invoiceData)
      } else {
        invoiceHTML = generateInvoiceHTML(order)
      }
    } catch (e) {
      invoiceHTML = generateInvoiceHTML(order)
    }
    return new Response(invoiceHTML, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `inline; filename="invoice-${order.id}.html"`
      }
    })

  } catch (error) {
    console.error('Invoice route error:', error)
    return Response.json({ message: error.message || 'Failed' }, { status: 500 })
  }
}

function generateInvoiceHTML(order) {
  const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '₹'
  const invoiceDate = new Date(order.createdAt).toLocaleDateString('en-IN')
  const invoiceNo = `INV-${order.id.substring(0, 8).toUpperCase()}-${new Date(order.createdAt).getTime().toString().slice(-6)}`
  const orderId = order.id
  const orderDetailsUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://crashkart.vercel.app'}/order-details/${orderId}`
  const qrData = encodeURIComponent(orderDetailsUrl)
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${qrData}`

  const itemsHTML = order.orderItems.map((item, index) => `
    <tr>
      <td style="padding:10px;border-bottom:1px solid #ddd">${index + 1}</td>
      <td style="padding:10px;border-bottom:1px solid #ddd">${item.product?.name || 'Product'}</td>
      <td style="padding:10px;border-bottom:1px solid #ddd;text-align:center">${item.quantity}</td>
      <td style="padding:10px;border-bottom:1px solid #ddd;text-align:right">${currency}${item.price}</td>
      <td style="padding:10px;border-bottom:1px solid #ddd;text-align:right">${currency}${(item.price * item.quantity).toFixed(2)}</td>
    </tr>
  `).join('')

  const subtotal = order.orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const discount = subtotal - order.total

  return `<!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width,initial-scale=1" />
      <title>Invoice ${invoiceNo}</title>
      <style>
        body { font-family: Arial, Helvetica, sans-serif; color: #333; }
        .container { max-width: 900px; margin: 24px auto; background: #fff; padding: 24px; border-radius: 6px }
        table { width: 100%; border-collapse: collapse }
        th, td { padding: 8px; border-bottom: 1px solid #eee; text-align: left }
        .action-buttons { text-align: center; margin-bottom: 12px }
        .print-btn { background: #ff0000; color: #fff; border: none; padding: 8px 12px; border-radius: 6px; cursor: pointer }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="action-buttons"><button class="print-btn" id="printBtn">🖨️ Print Invoice</button></div>
        <h2>CrashKart Invoice</h2>
        <p><strong>Invoice:</strong> ${invoiceNo} &nbsp; <strong>Date:</strong> ${invoiceDate}</p>
        <h3>Customer</h3>
        <p>${order.user?.name || order.user?.email}<br/>${order.user?.email}</p>
        <h3>Shipping</h3>
        <p>${order.address?.addressLine || ''} ${order.address?.city || ''} ${order.address?.state || ''} ${order.address?.pin || ''}</p>
        <h3>Items</h3>
        <table>
          <thead>
            <tr><th>#</th><th>Product</th><th>Qty</th><th>Price</th><th>Total</th></tr>
          </thead>
          <tbody>${itemsHTML}</tbody>
        </table>
        <div style="text-align:right;margin-top:12px">
          <p>Subtotal: ${currency}${subtotal.toFixed(2)}</p>
          <p>Discount: ${currency}${(discount).toFixed(2)}</p>
          <h3>Total: ${currency}${order.total.toFixed(2)}</h3>
        </div>
        <p>Order ID: ${order.id}</p>
        <p><img src="${qrCodeUrl}" alt="QR"/></p>
      </div>
      <script>
        window.addEventListener('load', function () {
          const b = document.getElementById('printBtn')
          if (b) b.addEventListener('click', () => window.print())
        })
      </script>
    </body>
  </html>`
}

