/**
 * Generate a PDF buffer from HTML using Puppeteer.
 * Dynamically imports puppeteer at runtime to avoid bundler issues.
 * @param {Object} invoiceData - Data used to populate the invoice template
 * @param {Object} options - { type: 'order'|'payment' }
 * @returns {Buffer} PDF buffer
 */
export async function generateInvoicePdf(invoiceData = {}, options = { type: 'order' }) {
  try {
    const puppeteer = await import('puppeteer')
    const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] })
    const page = await browser.newPage()

    // Prefer a dedicated invoice HTML renderer so invoices remain consistent
    let invoiceHtml = ''
    try {
      const renderer = await import('@/lib/invoiceHtml')
      if (renderer && typeof renderer.renderInvoiceHtml === 'function') {
        invoiceHtml = renderer.renderInvoiceHtml(invoiceData)
      }
    } catch (e) {
      // fallback to email templates if invoice renderer isn't available
      try {
        const emailTemplates = await import('@/lib/emailTemplates')
        if (options.type === 'payment' && emailTemplates.paymentReceivedEmail) {
          invoiceHtml = emailTemplates.paymentReceivedEmail(invoiceData.customerName || invoiceData.name || 'Customer', invoiceData).html
        } else if (emailTemplates.orderConfirmationEmail) {
          const trackingLink = invoiceData.trackingLink || ''
          invoiceHtml = emailTemplates.orderConfirmationEmail(invoiceData, trackingLink).html
        }
      } catch (tErr) {
        console.warn('Could not build invoice HTML from templates, falling back to simple HTML', tErr?.message || tErr)
        invoiceHtml = `<html><body><h1>Invoice ${invoiceData.orderId || ''}</h1><p>Total: ${invoiceData.total || ''}</p></body></html>`
      }
    }

    await page.setContent(invoiceHtml, { waitUntil: 'networkidle0' })
    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true, margin: { top: '20px', bottom: '20px', left: '20px', right: '20px' } })
    await browser.close()
    return pdfBuffer
  } catch (error) {
    console.error('Invoice Puppeteer generation failed:', error?.message || error)
    throw error
  }
}

export default { generateInvoicePdf }
