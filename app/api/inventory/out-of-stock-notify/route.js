import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { sendEmail } from '@/lib/email'

/**
 * Monitor and notify admin about out-of-stock products
 * GET - Fetch all out-of-stock products
 * POST - Manually trigger out-of-stock notification
 */

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const storeId = searchParams.get('storeId')

    const where = { inStock: false }

    if (category) {
      where.category = category
    }

    if (storeId) {
      where.storeId = storeId
    }

    // Get all out-of-stock products
    const outOfStockProducts = await prisma.product.findMany({
      where,
      select: {
        id: true,
        name: true,
        category: true,
        price: true,
        inStock: true,
        createdAt: true,
        updatedAt: true,
        store: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    })

    // Get count of out-of-stock products by category
    const categoryStats = await prisma.product.groupBy({
      by: ['category'],
      where: { inStock: false },
      _count: {
        id: true
      }
    })

    return NextResponse.json({
      success: true,
      data: outOfStockProducts,
      stats: {
        total: outOfStockProducts.length,
        byCategory: categoryStats.map(stat => ({
          category: stat.category,
          count: stat._count.id
        }))
      }
    })
  } catch (error) {
    console.error('Error fetching out-of-stock products:', error)
    return NextResponse.json(
      { error: 'Failed to fetch out-of-stock products' },
      { status: 500 }
    )
  }
}

export async function POST(request) {
  try {
    const body = await request.json()
    const { productId, notify = true } = body

    // Get product details
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        store: true
      }
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    if (product.inStock === true) {
      return NextResponse.json(
        { error: 'Product is in stock' },
        { status: 400 }
      )
    }

    if (notify) {
      // Send notification to seller
      try {
        await sendEmail({
          to: product.store.email,
          subject: `⚠️ Product Out of Stock Alert: ${product.name}`,
          html: `
            <h2>Out of Stock Alert</h2>
            <p>Hi ${product.store.name},</p>
            <p>Your product <strong>${product.name}</strong> is currently out of stock.</p>
            <h3>Product Details:</h3>
            <ul>
              <li><strong>Product Name:</strong> ${product.name}</li>
              <li><strong>Category:</strong> ${product.category}</li>
              <li><strong>Price:</strong> ₹${product.price}</li>
              <li><strong>Status:</strong> Out of Stock</li>
            </ul>
            <p>Please update your inventory as soon as possible to resume sales.</p>
            <p><a href="${process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')}/seller/inventory" style="color: #dc2626; text-decoration: none;">Update Inventory</a></p>
            <p>Best regards,<br>CrashKart Admin Team</p>
          `
        })
      } catch (emailError) {
        console.error('Failed to send seller notification:', emailError)
      }

      // Send notification to admin
      try {
        await sendEmail({
          to: process.env.ADMIN_EMAIL || 'crashkart.help@gmail.com',
          subject: `⚠️ Product Out of Stock: ${product.name}`,
          html: `
            <h2>Out of Stock Product Alert</h2>
            <p>The following product has gone out of stock:</p>
            <h3>Product Details:</h3>
            <ul>
              <li><strong>Product Name:</strong> ${product.name}</li>
              <li><strong>Category:</strong> ${product.category}</li>
              <li><strong>Price:</strong> ₹${product.price}</li>
              <li><strong>Store:</strong> ${product.store.name}</li>
              <li><strong>Last Updated:</strong> ${new Date(product.updatedAt).toLocaleString()}</li>
            </ul>
            <p><a href="${process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')}/admin/inventory" style="color: #dc2626; text-decoration: none;">View in Admin Inventory</a></p>
          `
        })
      } catch (emailError) {
        console.error('Failed to send admin notification:', emailError)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Out-of-stock notification sent',
      product: {
        id: product.id,
        name: product.name,
        inStock: product.inStock,
        store: product.store.name
      }
    })
  } catch (error) {
    console.error('Error processing out-of-stock notification:', error)
    return NextResponse.json(
      { error: 'Failed to process notification' },
      { status: 500 }
    )
  }
}
