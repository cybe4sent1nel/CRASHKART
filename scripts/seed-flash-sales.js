const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedFlashSales() {
  try {
    console.log('🔄 Fetching products...');
    
    // Get all products
    const allProducts = await prisma.product.findMany({
      select: { id: true },
      take: 26
    });

    if (allProducts.length < 5) {
      console.log('❌ Not enough products to create flash sales');
      return;
    }

    console.log(`✓ Found ${allProducts.length} products`);

    // Create Flash Sale 1: Electronics
    const sale1Products = allProducts.slice(0, 5).map(p => p.id);
    
    const flashSale1 = await prisma.flashSale.create({
      data: {
        title: 'Electronics Mega Sale',
        description: 'Get up to 30% off on all electronics. Limited time offer!',
        products: sale1Products,
        discount: 30,
        maxQuantity: 50,
        startTime: new Date(),
        endTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
        bannerImage: null,
        isActive: true
      }
    });

    console.log('✓ Created Flash Sale 1:', flashSale1.title);

    // Create Flash Sale 2: Fashion
    const sale2Products = allProducts.slice(5, 10).map(p => p.id);
    
    const flashSale2 = await prisma.flashSale.create({
      data: {
        title: 'Fashion Fiesta',
        description: 'Upto 25% off on trending fashion items',
        products: sale2Products,
        discount: 25,
        maxQuantity: 75,
        startTime: new Date(),
        endTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
        bannerImage: null,
        isActive: true
      }
    });

    console.log('✓ Created Flash Sale 2:', flashSale2.title);

    // Create Flash Sale 3: Home & Kitchen
    const sale3Products = allProducts.slice(10, 15).map(p => p.id);
    
    const flashSale3 = await prisma.flashSale.create({
      data: {
        title: 'Home Essentials Flash Sale',
        description: 'Transform your home with our exclusive 35% discount',
        products: sale3Products,
        discount: 35,
        maxQuantity: 100,
        startTime: new Date(),
        endTime: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // 4 days from now
        bannerImage: null,
        isActive: true
      }
    });

    console.log('✓ Created Flash Sale 3:', flashSale3.title);

    // Create Flash Sale 4: Books & More
    const sale4Products = allProducts.slice(15, 20).map(p => p.id);
    
    const flashSale4 = await prisma.flashSale.create({
      data: {
        title: 'Books & Media Bonanza',
        description: 'Knowledge at great prices - 20% off',
        products: sale4Products,
        discount: 20,
        maxQuantity: 200,
        startTime: new Date(),
        endTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
        bannerImage: null,
        isActive: true
      }
    });

    console.log('✓ Created Flash Sale 4:', flashSale4.title);

    console.log('\n✅ Flash sales seeded successfully!');
    console.log(`\nCreated ${4} flash sales with ${sale1Products.length + sale2Products.length + sale3Products.length + sale4Products.length} products total`);

  } catch (error) {
    console.error('❌ Error seeding flash sales:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedFlashSales();
