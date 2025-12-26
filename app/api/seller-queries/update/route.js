import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { sendEmail } from '@/lib/email'

export async function PATCH(request) {
  try {
    const body = await request.json()
    const { id, status, notes, rejectionReason } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Query ID is required' },
        { status: 400 }
      )
    }

    // Find existing query
    const existingQuery = await prisma.sellerQuery.findUnique({
      where: { id }
    })

    if (!existingQuery) {
      return NextResponse.json(
        { error: 'Seller query not found' },
        { status: 404 }
      )
    }

    // Update status
    const updateData = {
      updatedAt: new Date()
    }

    if (status) {
      updateData.status = status
    }

    if (notes) {
      updateData.notes = notes
    }

    if (status === 'rejected' && rejectionReason) {
      updateData.rejectionReason = rejectionReason
    }

    if (status === 'approved') {
      updateData.approvedAt = new Date()
    }

    const updatedQuery = await prisma.sellerQuery.update({
      where: { id },
      data: updateData
    })

    // Send status update email to applicant
    let emailSubject = ''
    let emailContent = ''

    if (status === 'approved') {
      emailSubject = '🎉 Congratulations! Your CrashKart Seller Application is Approved'
      emailContent = `
        <h2>Great News!</h2>
        <p>Hi ${existingQuery.name},</p>
        <p>We're thrilled to inform you that your application to become a CrashKart Seller has been <strong>APPROVED</strong>!</p>
        <h3>Next Steps:</h3>
        <ol>
          <li>Log in to your seller account</li>
          <li>Complete your store profile and branding</li>
          <li>Add your products</li>
          <li>Start receiving orders</li>
        </ol>
        <p>Our seller support team is ready to help you get started. You'll receive access details and seller guidelines shortly.</p>
        <p>For any questions, contact us at <a href="mailto:crashkart.help@gmail.com">crashkart.help@gmail.com</a></p>
        <p>Welcome to the CrashKart family!<br>CrashKart Team</p>
      `
    } else if (status === 'reviewing') {
      emailSubject = 'Your CrashKart Seller Application is Under Review'
      emailContent = `
        <h2>Application Under Review</h2>
        <p>Hi ${existingQuery.name},</p>
        <p>Thank you for your patience! We're currently reviewing your seller application.</p>
        <p>Our team is evaluating your information and will contact you with a decision within 2-3 business days.</p>
        <p>If you have any questions in the meantime, feel free to reach out to us at <a href="mailto:crashkart.help@gmail.com">crashkart.help@gmail.com</a></p>
        <p>Best regards,<br>CrashKart Team</p>
      `
    } else if (status === 'rejected') {
      emailSubject = 'Your CrashKart Seller Application'
      emailContent = `
        <h2>Application Status Update</h2>
        <p>Hi ${existingQuery.name},</p>
        <p>Thank you for your interest in becoming a CrashKart Seller.</p>
        <p>Unfortunately, your application was not approved at this time.</p>
        ${rejectionReason ? `<h3>Reason:</h3><p>${rejectionReason}</p>` : ''}
        <p>We encourage you to reapply in the future. If you'd like feedback on your application, please contact us at <a href="mailto:crashkart.help@gmail.com">crashkart.help@gmail.com</a></p>
        <p>Best regards,<br>CrashKart Team</p>
      `
    }

    if (emailSubject) {
      try {
        await sendEmail({
          to: existingQuery.email,
          subject: emailSubject,
          html: emailContent
        })
      } catch (emailError) {
        console.error('Failed to send status update email:', emailError)
      }
    }

    console.log(`✓ Updated seller query ${id}: status changed to ${status}`)

    return NextResponse.json({
      success: true,
      message: 'Seller query updated successfully',
      data: updatedQuery
    })
  } catch (error) {
    console.error('Error updating seller query:', error)
    return NextResponse.json(
      { error: 'Failed to update seller query' },
      { status: 500 }
    )
  }
}
