export function renderInvoiceHtml(data = {}) {
  const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '₹'
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || ''
  const logoUrl = process.env.NEXT_PUBLIC_EMAIL_LOGO_URL || 'https://disabled-blue-pxxlqc3pk9-hwn0d1df7j.edgeone.app/LOGO.png'
  const invoiceDate = new Date(data.orderDate || Date.now()).toLocaleDateString('en-IN')
  const invoiceNo = data.orderId ? `INV-${String(data.orderId).substring(0, 8).toUpperCase()}-${String(new Date(data.orderDate || Date.now()).getTime()).slice(-6)}` : `INV-UNKNOWN`
  const qrData = encodeURIComponent(`${appUrl}/order-details/${data.orderId || ''}`)
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${qrData}`

  // Use provided subtotal if available, otherwise compute from items
  const subtotal = Number(data.subtotal ?? (data.items || []).reduce((s, it) => s + ((it.price || 0) * (it.quantity || 1)), 0))
  const convenienceFee = Number(data.convenienceFee ?? 0)
  const platformFee = Number(data.platformFee ?? 0)
  const couponDiscount = Number(data.couponDiscount ?? data.discount ?? 0)
  const crashCashDiscount = Number(data.crashCashDiscount ?? 0)
  const discount = couponDiscount + crashCashDiscount

  // Raw shipping candidate from provided fields
  let shipping = Number(data.deliveryCharge ?? data.shippingCharge ?? data.shippingFee ?? 0)

  // If the stored deliveryCharge looks like it contains the full total (common bug),
  // try to derive the actual shipping charge from the stored `total` and other components:
  if (data.total && (shipping > subtotal || shipping > Number(data.total))) {
    const derived = Number(data.total) - subtotal - convenienceFee - platformFee + discount
    shipping = Math.max(0, Number.isFinite(derived) ? derived : 0)
  }

  const total = Number(data.total ?? ((subtotal + shipping + convenienceFee + platformFee) - discount))

  const itemsHTML = (data.items || []).map((item, idx) => `
    <tr>
      <td style="padding:10px;border-bottom:1px solid rgba(15,23,42,0.06)">${idx + 1}</td>
      <td style="padding:10px;border-bottom:1px solid rgba(15,23,42,0.06)">${item.name}</td>
      <td style="padding:10px;border-bottom:1px solid rgba(15,23,42,0.06);text-align:center">${item.quantity}</td>
      <td style="padding:10px;border-bottom:1px solid rgba(15,23,42,0.06);text-align:right">${currency}${(item.price || 0).toFixed(2)}</td>
      <td style="padding:10px;border-bottom:1px solid rgba(15,23,42,0.06);text-align:right">${currency}${((item.price || 0) * (item.quantity || 1)).toFixed(2)}</td>
    </tr>
  `).join('')

  const freeDelivery = String(data.couponType || data.coupon?.couponType || data.couponType || '').toLowerCase().includes('free')

  return `<!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width,initial-scale=1" />
      <title>Invoice ${invoiceNo}</title>
      <style>
        :root{--accent:#ef4444;--accent-2:#ff8a4c;--muted:#475569;--bg:linear-gradient(180deg,#fffaf0,#fffdf7)}
        body{font-family: Inter, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; background:var(--bg); margin:0}
        .page{max-width:920px;margin:18px auto;padding:22px}
        .card{background:linear-gradient(180deg,#ffffff,#fff8f6);border-radius:16px;padding:0;overflow:hidden;box-shadow:0 24px 60px rgba(0,0,0,0.06)}
        .header{display:flex;align-items:center;justify-content:space-between;gap:18px;padding:22px 26px;background:linear-gradient(90deg,var(--accent),var(--accent-2));color:#fff}
        .brand{display:flex;align-items:center;gap:14px}
        .logo{width:86px;height:86px;border-radius:12px;object-fit:contain;background:#fff;padding:8px}
        .title{font-size:24px;font-weight:800;color:#fff}
        .meta{color:rgba(255,255,255,0.9);font-size:13px}
        .status-badge{background:rgba(255,255,255,0.12);padding:6px 10px;border-radius:999px;font-weight:700;font-size:12px}
        .qr-wrap{position:relative;padding:8px;border-radius:16px;background:linear-gradient(135deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02));display:flex;align-items:center;justify-content:center}
        .qr{width:120px;height:120px;border-radius:12px;box-shadow:0 20px 60px rgba(14,20,24,0.18);display:block;border:6px solid rgba(255,255,255,0.12);background:linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0.00))}
        .qr-label{position:absolute;bottom:-18px;right:0;background:rgba(255,255,255,0.95);color:var(--accent);font-weight:700;padding:6px 8px;border-radius:8px;font-size:12px;box-shadow:0 6px 18px rgba(0,0,0,0.08)}
        .print-inline{display:flex;align-items:center;justify-content:center}
        .print-btn{background:linear-gradient(90deg,var(--accent),var(--accent-2));color:#fff;border:none;padding:10px 16px;border-radius:999px;cursor:pointer;font-weight:800;box-shadow:0 18px 50px rgba(0,0,0,0.12)}
        @media print{.print-btn,.qr-label{display:none}}
        .section{display:flex;gap:22px;margin-top:18px;padding:22px}
        .boxed{flex:1}
        h4{margin:6px 0 8px 0;color:#0b1220}
        table{width:100%;border-collapse:collapse;margin-top:12px;background:#fff}
        thead th{background:linear-gradient(90deg,rgba(239,68,68,0.08),rgba(255,138,76,0.06));color:var(--accent);font-weight:700;padding:12px;border-bottom:2px solid rgba(0,0,0,0.04)}
        th{text-align:left;color:#0f172a;font-weight:700;padding:10px 8px}
        td{padding:12px 8px;border-bottom:1px solid rgba(15,23,42,0.04)}
        tbody tr:nth-child(odd){background:linear-gradient(90deg,rgba(255,255,255,0.0),rgba(255,248,246,0.02))}
        .summary{width:380px;background:linear-gradient(180deg,#fff,#fff7f6);padding:18px;border-radius:12px;border:1px solid rgba(0,0,0,0.04);box-shadow:inset 0 1px 0 rgba(255,255,255,0.6)}
        .summary .row{display:flex;justify-content:space-between;margin-top:10px;color:#0f172a;align-items:center;padding:6px 8px;border-radius:8px}
        .summary .muted{color:var(--muted);font-size:13px}
        .total{font-weight:900;font-size:20px;margin-top:12px;color:var(--accent)}
        .fee-shipping{background:linear-gradient(90deg,rgba(255,138,76,0.06),rgba(255,138,76,0.02))}
        .fee-convenience{background:linear-gradient(90deg,rgba(99,102,241,0.06),rgba(99,102,241,0.02))}
        .fee-platform{background:linear-gradient(90deg,rgba(34,197,94,0.06),rgba(34,197,94,0.02))}
        .fee-discount{background:linear-gradient(90deg,rgba(15,23,42,0.02),rgba(15,23,42,0.01));color:#bf1d1d}
        .note{font-size:13px;color:var(--muted);margin-top:14px}
      </style>
    </head>
    <body>
      <div class="page">
        <div class="card">
          <div class="header">
            <div class="brand">
              <img src="${logoUrl}" alt="CrashKart" class="logo"/>
              <div>
                <div class="title">CrashKart</div>
                <div class="meta">Invoice: <strong>${invoiceNo}</strong> • ${invoiceDate}</div>
              </div>
            </div>
            <div class="qr-wrap">
              <img src="${qrCodeUrl}" alt="QR" class="qr"/>
              <div class="qr-label">Scan to view</div>
            </div>
          </div>

          <div class="section">
            <div class="boxed">
              <h4>Bill To</h4>
              <div>${data.customerName || ''}<br/>${data.customerEmail || ''}<br/>${data.address?.phone || ''}</div>
            </div>

            <div class="print-inline" style="flex:0 0 160px; display:flex; align-items:center; justify-content:center;">
              <button id="printBtn" class="print-btn">Print</button>
            </div>

            <div class="boxed">
              <h4>Shipping Address</h4>
              <div>${data.address?.addressLine || ''}<br/>${data.address?.city || ''} ${data.address?.state || ''} ${data.address?.pin || ''}</div>
            </div>
          </div>

          <h4 style="margin-top:18px">Items</h4>
          <table>
            <thead>
              <tr><th style="width:6%">#</th><th>Product</th><th style="width:12%;text-align:center">Qty</th><th style="width:16%;text-align:right">Price</th><th style="width:16%;text-align:right">Total</th></tr>
            </thead>
            <tbody>${itemsHTML}</tbody>
          </table>

          <div style="display:flex;justify-content:flex-end;margin-top:14px">
              <div class="summary">
                <div class="row"><div class="muted">Subtotal</div><div>${currency}${subtotal.toFixed(2)}</div></div>
                <div class="row fee-shipping"><div class="muted">Shipping</div><div>${shipping === 0 && freeDelivery ? 'Free' : `${currency}${shipping.toFixed(2)}`}</div></div>
                <div class="row fee-convenience"><div class="muted">Convenience Fee</div><div>${currency}${Number(data.convenienceFee || 0).toFixed(2)}</div></div>
                <div class="row fee-platform"><div class="muted">Platform Fee</div><div>${currency}${Number(data.platformFee || 0).toFixed(2)}</div></div>
                <div class="row fee-discount"><div class="muted">Coupon / Discounts</div><div>- ${currency}${couponDiscount.toFixed(2)}</div></div>
                <div class="row fee-discount"><div class="muted">CrashCash</div><div>- ${currency}${crashCashDiscount.toFixed(2)}</div></div>
                <hr style="border:none;border-top:1px solid rgba(15,23,42,0.04);margin:10px 0" />
                <div class="row total"><div>Total</div><div>${currency}${total.toFixed(2)}</div></div>
                ${freeDelivery ? `<div class="note">Free delivery coupon applied — shipping set to ₹0.</div>` : ''}
              </div>
          </div>

          <div class="note">Order ID: ${data.orderId || ''} • This invoice includes shipping and applied discounts.</div>
        </div>
      </div>
      <script>
        document.querySelectorAll('.print-btn').forEach(b=>b.addEventListener('click', ()=>window.print()))
      </script>
    </body>
  </html>`
}
