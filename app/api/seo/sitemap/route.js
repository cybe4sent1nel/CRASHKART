import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET - Generate sitemap.xml
export async function GET(request) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://crashkart.com';

    // Get all products
    const products = await prisma.product.findMany({
      select: {
        id: true,
        updatedAt: true
      }
    });

    // Get all categories
    const categories = await prisma.product.groupBy({
      by: ['category'],
      _count: { id: true }
    });

    // Get all active stores
    const stores = await prisma.store.findMany({
      where: { isActive: true },
      select: {
        username: true,
        updatedAt: true
      }
    });

    // Build sitemap
    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:mobile="http://www.google.com/schemas/sitemap-mobile/1.0">`;

    // Add homepage
    sitemap += `
  <url>
    <loc>${baseUrl}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>`;

    // Add product pages
    for (const product of products) {
      sitemap += `
  <url>
    <loc>${baseUrl}/product/${product.id}</loc>
    <lastmod>${product.updatedAt.toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
    }

    // Add category pages
    for (const cat of categories) {
      sitemap += `
  <url>
    <loc>${baseUrl}/shop?category=${encodeURIComponent(cat.category)}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
    }

    // Add store pages
    for (const store of stores) {
      sitemap += `
  <url>
    <loc>${baseUrl}/shop/${store.username}</loc>
    <lastmod>${store.updatedAt.toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`;
    }

    // Add static pages
    const staticPages = [
      { url: '/about', priority: 0.5 },
      { url: '/pricing', priority: 0.5 },
      { url: '/contact', priority: 0.5 },
      { url: '/privacy', priority: 0.3 },
      { url: '/terms', priority: 0.3 }
    ];

    for (const page of staticPages) {
      sitemap += `
  <url>
    <loc>${baseUrl}${page.url}</loc>
    <changefreq>monthly</changefreq>
    <priority>${page.priority}</priority>
  </url>`;
    }

    sitemap += `
</urlset>`;

    return new NextResponse(sitemap, {
      headers: {
        'Content-Type': 'application/xml'
      }
    });

  } catch (error) {
    console.error('Sitemap generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate sitemap' },
      { status: 500 }
    );
  }
}
