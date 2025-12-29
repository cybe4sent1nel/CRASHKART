import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { sendEmail } from '@/lib/email'

export async function POST(request) {
  try {
    const body = await request.json()
    const {
      name,
      email,
      phone,
      companyName,
      businessType,
      category,
      experience,
      description,
      documents
    } = body

    // Validate required fields
    if (!name || !email || !phone || !businessType || !category || !experience || !description) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Check if email already exists
    const existingQuery = await prisma.sellerQuery.findUnique({
      where: { email }
    })

    if (existingQuery) {
      return NextResponse.json(
        { error: 'You have already submitted an application. Please wait for approval.' },
        { status: 409 }
      )
    }

    // Create seller query in database
    const sellerQuery = await prisma.sellerQuery.create({
      data: {
        name,
        email,
        phone,
        companyName: companyName || null,
        businessType,
        category,
        experience,
        description,
        documents: documents || []
      }
    })

    // Send confirmation email to applicant
    try {
      await sendEmail({
        to: email,
        subject: 'CrashKart Seller Application Received',
        html: `
          <h2>Thank you for applying to become a CrashKart Seller!</h2>
          <p>Hi ${name},</p>
          <p>We have received your seller application. Our team will review it and contact you within 5-7 business days.</p>
          <h3>Application Details:</h3>
          <ul>
            <li><strong>Name:</strong> ${name}</li>
            <li><strong>Category:</strong> ${category}</li>
            <li><strong>Experience Level:</strong> ${experience}</li>
            <li><strong>Submitted Date:</strong> ${new Date().toLocaleDateString()}</li>
          </ul>
          <p>If you have any questions, feel free to reach out to us at <a href="mailto:crashkart.help@gmail.com">crashkart.help@gmail.com</a></p>
          <p>Best regards,<br>CrashKart Team</p>
        `
      })
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError)
    }

    // Send notification email to admin
    try {
      await sendEmail({
        to: process.env.ADMIN_EMAIL || 'crashkart.help@gmail.com',
        subject: `New Seller Application: ${name}`,
        html: `
          <h2>New Seller Application Received</h2>
          <h3>Applicant Details:</h3>
          <ul>
            <li><strong>Name:</strong> ${name}</li>
            <li><strong>Email:</strong> ${email}</li>
            <li><strong>Phone:</strong> ${phone}</li>
            <li><strong>Company Name:</strong> ${companyName || 'N/A'}</li>
            <li><strong>Business Type:</strong> ${businessType}</li>
            <li><strong>Category:</strong> ${category}</li>
            <li><strong>Experience Level:</strong> ${experience}</li>
            <li><strong>Submitted Date:</strong> ${new Date().toLocaleDateString()}</li>
          </ul>
          <h3>Business Description:</h3>
          <p>${description}</p>
          ${documents && documents.length > 0 ? `
            <h3>Uploaded Documents (${documents.length}):</h3>
            <ul>
              ${documents.map(doc => `<li><a href="${doc}" target="_blank">${doc.split('/').pop()}</a></li>`).join('')}
            </ul>
          ` : '<p><strong>No documents uploaded</strong></p>'}
          <p><a href="${process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')}/admin/sellers">View in Admin Dashboard</a></p>
        `
      })
    } catch (emailError) {
      console.error('Failed to send admin notification:', emailError)
    }

    console.log(`✓ New seller query created: ${name} (${email})`)

    return NextResponse.json(
      {
        success: true,
        message: 'Application submitted successfully',
        data: {
          id: sellerQuery.id,
          email: sellerQuery.email,
          status: sellerQuery.status
        }
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating seller query:', error)
    return NextResponse.json(
      { error: 'Failed to submit application' },
      { status: 500 }
    )
  }
}
