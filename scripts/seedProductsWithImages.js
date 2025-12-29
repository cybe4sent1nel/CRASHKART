const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// Product data for 26 products
const productsData = [
  {
    name: 'Premium Wireless Headphones',
    description: 'High-quality noise-cancelling wireless headphones with 30-hour battery life and premium sound quality.',
    mrp: 5999,
    price: 3499,
    category: 'Electronics',
    quantity: 45,
    imageNum: 1,
  },
  {
    name: 'Smartphone Stand',
    description: 'Adjustable phone stand for desk with sturdy grip and 360-degree rotation.',
    mrp: 1499,
    price: 799,
    category: 'Accessories',
    quantity: 120,
    imageNum: 2,
  },
  {
    name: 'USB-C Power Bank 20000mAh',
    description: 'Fast charging power bank with USB-C and dual USB ports. Perfect for travel and daily use.',
    mrp: 3499,
    price: 1999,
    category: 'Electronics',
    quantity: 78,
    imageNum: 3,
  },
  {
    name: 'Premium Cotton T-Shirt',
    description: 'Comfortable 100% organic cotton t-shirt with modern designs. Available in multiple sizes.',
    mrp: 999,
    price: 499,
    category: 'Clothing',
    quantity: 200,
    imageNum: 4,
  },
  {
    name: 'Stainless Steel Water Bottle',
    description: 'Double-wall insulated water bottle keeps drinks hot/cold for 24 hours. Eco-friendly choice.',
    mrp: 1299,
    price: 699,
    category: 'Home',
    quantity: 95,
    imageNum: 5,
  },
  {
    name: '4K USB Webcam',
    description: 'Professional 4K webcam with auto-focus and built-in microphone. Perfect for streaming and meetings.',
    mrp: 8999,
    price: 4999,
    category: 'Electronics',
    quantity: 35,
    imageNum: 6,
  },
  {
    name: 'Mechanical Keyboard RGB',
    description: 'Customizable RGB mechanical keyboard with hot-swappable switches. Great for gaming and typing.',
    mrp: 5499,
    price: 3299,
    category: 'Electronics',
    quantity: 60,
    imageNum: 7,
  },
  {
    name: 'Portable Bluetooth Speaker',
    description: 'Compact waterproof Bluetooth speaker with 12-hour battery. Perfect for outdoor adventures.',
    mrp: 2999,
    price: 1499,
    category: 'Electronics',
    quantity: 85,
    imageNum: 8,
  },
  {
    name: 'Smart LED Bulb',
    description: 'WiFi-enabled RGB smart bulb with app control. Compatible with Alexa and Google Home.',
    mrp: 1799,
    price: 899,
    category: 'Home',
    quantity: 150,
    imageNum: 9,
  },
  {
    name: 'Desk Lamp with USB',
    description: 'Adjustable LED desk lamp with USB charging port and touch control.',
    mrp: 1299,
    price: 649,
    category: 'Home',
    quantity: 110,
    imageNum: 10,
  },
  {
    name: 'Wireless Mouse Ergonomic',
    description: 'Ergonomic wireless mouse with silent clicking. Long battery life of up to 18 months.',
    mrp: 1599,
    price: 799,
    category: 'Accessories',
    quantity: 140,
    imageNum: 11,
  },
  {
    name: 'Phone Protective Case',
    description: 'Durable protective case with shock absorption and raised edges for screen protection.',
    mrp: 899,
    price: 399,
    category: 'Accessories',
    quantity: 250,
    imageNum: 12,
  },
  {
    name: 'Tempered Glass Screen Protector',
    description: 'Ultra-thin tempered glass protector with oleophobic coating. Easy installation.',
    mrp: 599,
    price: 299,
    category: 'Accessories',
    quantity: 300,
    imageNum: 13,
  },
  {
    name: 'Wireless Charging Pad',
    description: 'Fast wireless charging pad with LED indicator. Compatible with all Qi-enabled devices.',
    mrp: 1999,
    price: 999,
    category: 'Accessories',
    quantity: 80,
    imageNum: 14,
  },
  {
    name: 'Portable Phone Cooler',
    description: 'Semiconductor phone cooler for gaming and video recording. Keeps phone cool automatically.',
    mrp: 2499,
    price: 1299,
    category: 'Accessories',
    quantity: 50,
    imageNum: 15,
  },
  {
    name: 'Laptop Stand Adjustable',
    description: 'Aluminum adjustable laptop stand for better ergonomics. Supports up to 17 inches.',
    mrp: 2299,
    price: 1199,
    category: 'Accessories',
    quantity: 75,
    imageNum: 16,
  },
  {
    name: 'USB Hub 7-Port',
    description: 'High-speed USB 3.0 hub with individual switches. Supports fast charging.',
    mrp: 1599,
    price: 799,
    category: 'Accessories',
    quantity: 95,
    imageNum: 17,
  },
  {
    name: 'Cable Organizer Set',
    description: 'Silicone cable organizer clips to manage all your cables. Set of 5 pieces.',
    mrp: 599,
    price: 249,
    category: 'Accessories',
    quantity: 180,
    imageNum: 18,
  },
  {
    name: 'Screen Cleaning Spray',
    description: 'Safe and effective screen cleaning spray for all devices. Includes microfiber cloth.',
    mrp: 399,
    price: 199,
    category: 'Accessories',
    quantity: 160,
    imageNum: 19,
  },
  {
    name: 'Laptop Cooling Pad',
    description: 'Laptop cooling pad with 4 USB fans. Reduces temperature by up to 10 degrees.',
    mrp: 2499,
    price: 1399,
    category: 'Accessories',
    quantity: 60,
    imageNum: 20,
  },
  {
    name: 'Backpack Travel Pro',
    description: 'Water-resistant travel backpack with laptop compartment and USB charging port.',
    mrp: 3499,
    price: 1899,
    category: 'Clothing',
    quantity: 70,
    imageNum: 21,
  },
  {
    name: 'Casual Jeans',
    description: 'Comfortable casual jeans in classic blue denim. Perfect fit for all occasions.',
    mrp: 1899,
    price: 999,
    category: 'Clothing',
    quantity: 150,
    imageNum: 22,
  },
  {
    name: 'Hoodie Sweatshirt',
    description: 'Cozy hoodie sweatshirt in premium cotton blend. Available in multiple colors.',
    mrp: 1599,
    price: 899,
    category: 'Clothing',
    quantity: 120,
    imageNum: 23,
  },
  {
    name: 'Running Shoes',
    description: 'Lightweight running shoes with comfortable cushioning and breathable mesh.',
    mrp: 4999,
    price: 2499,
    category: 'Clothing',
    quantity: 80,
    imageNum: 24,
  },
  {
    name: 'Sports Cap',
    description: 'Adjustable sports cap with breathable material. UV protection for outdoor activities.',
    mrp: 799,
    price: 399,
    category: 'Clothing',
    quantity: 200,
    imageNum: 25,
  },
  {
    name: 'Sunglasses UV Protection',
    description: 'Stylish sunglasses with 100% UV protection. Polarized lenses reduce glare.',
    mrp: 1999,
    price: 999,
    category: 'Accessories',
    quantity: 110,
    imageNum: 26,
  },
];

// Review templates
const reviewTemplates = [
  'Excellent product! Highly recommended.',
  'Amazing quality, exceeded my expectations!',
  'Very satisfied with this purchase.',
  'Great value for money.',
  'Perfect! Arrived quickly and in excellent condition.',
  'Love it! Best purchase ever.',
  'Exceptional quality and durability.',
  'Fantastic product, very happy with my buy.',
  'Superb! Will definitely buy again.',
  'Outstanding quality and service.',
];

async function copyProductImages() {
  const assetsDir = path.join(__dirname, '..', 'assets');
  const publicDir = path.join(__dirname, '..', 'public', 'products');

  // Create products directory if it doesn't exist
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
    console.log('✅ Created /public/products directory');
  }

  // Copy images
  for (let i = 1; i <= 26; i++) {
    const sourceFile = path.join(assetsDir, `product_img${i}.png`);
    const destFile = path.join(publicDir, `product_${i}.png`);

    if (fs.existsSync(sourceFile)) {
      fs.copyFileSync(sourceFile, destFile);
      console.log(`✅ Copied product_img${i}.png -> /public/products/product_${i}.png`);
    } else {
      console.warn(`⚠️  File not found: ${sourceFile}`);
    }
  }
}

async function main() {
  try {
    console.log('🗑️  Clearing existing products and data...');

    // Delete in order of dependencies
    await prisma.outOfStockNotification.deleteMany({});
    await prisma.rating.deleteMany({});
    await prisma.orderItem.deleteMany({});
    await prisma.order.deleteMany({});
    await prisma.product.deleteMany({});
    await prisma.address.deleteMany({});
    await prisma.store.deleteMany({});
    await prisma.user.deleteMany({});

    console.log('✅ All data cleared!');

    // Copy images to public folder
    console.log('\n📸 Copying product images...');
    copyProductImages();

    // Create users
    console.log('\n👥 Creating users...');
    const users = await Promise.all([
      prisma.user.create({
        data: {
          name: 'John Smith',
          email: 'john@example.com',
          phone: '9876543210',
          image: 'https://avatar.iran.liara.run/public/boy?username=john',
          googleId: 'google-john-001',
          isProfileSetup: true,
          isEmailVerified: true,
          isPhoneVerified: true,
        },
      }),
      prisma.user.create({
        data: {
          name: 'Sarah Johnson',
          email: 'sarah@example.com',
          phone: '9876543211',
          image: 'https://avatar.iran.liara.run/public/girl?username=sarah',
          googleId: 'google-sarah-001',
          isProfileSetup: true,
          isEmailVerified: true,
          isPhoneVerified: true,
        },
      }),
      prisma.user.create({
        data: {
          name: 'Mike Davis',
          email: 'mike@example.com',
          phone: '9876543212',
          image: 'https://avatar.iran.liara.run/public/boy?username=mike',
          googleId: 'google-mike-001',
          isProfileSetup: true,
          isEmailVerified: true,
          isPhoneVerified: true,
        },
      }),
    ]);
    console.log(`✅ Created ${users.length} users`);

    // Create stores
    console.log('\n🏪 Creating stores...');
    const stores = await Promise.all([
      prisma.store.create({
        data: {
          name: 'TechHub',
          description: 'Leading electronics and gadgets store',
          username: 'techhub-store',
          address: '123 Tech Street, Silicon Valley, CA',
          logo: 'https://via.placeholder.com/100?text=TechHub',
          email: 'store1@example.com',
          contact: '9876543210',
          status: 'active',
          isActive: true,
          userId: users[0].id,
        },
      }),
      prisma.store.create({
        data: {
          name: 'Fashion Plus',
          description: 'Latest fashion and apparel collection',
          username: 'fashion-plus-store',
          address: '456 Fashion Lane, New York, NY',
          logo: 'https://via.placeholder.com/100?text=FashionPlus',
          email: 'store2@example.com',
          contact: '9876543211',
          status: 'active',
          isActive: true,
          userId: users[1].id,
        },
      }),
      prisma.store.create({
        data: {
          name: 'Home Essentials',
          description: 'Quality home and lifestyle products',
          username: 'home-essentials-store',
          address: '789 Home Ave, Austin, TX',
          logo: 'https://via.placeholder.com/100?text=HomeEss',
          email: 'store3@example.com',
          contact: '9876543212',
          status: 'active',
          isActive: true,
          userId: users[2].id,
        },
      }),
    ]);
    console.log(`✅ Created ${stores.length} stores`);

    // Create 26 products with images
    console.log('\n📦 Creating 26 products with images...');
    const products = [];
    for (let i = 0; i < productsData.length; i++) {
      const productData = productsData[i];
      const storeIndex = i % stores.length;
      const imageNum = productData.imageNum;

      const product = await prisma.product.create({
        data: {
          name: productData.name,
          description: productData.description,
          mrp: productData.mrp,
          price: productData.price,
          images: [
            `/products/product_${imageNum}.png`,
            `/products/product_${imageNum}.png`,
            `/products/product_${imageNum}.png`,
          ],
          category: productData.category,
          inStock: productData.quantity > 0,
          quantity: productData.quantity,
          storeId: stores[storeIndex].id,
          crashCashValue: Math.floor((productData.price * 0.1) / 5) * 5, // 10% rounded to nearest 5
          createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Random date in last 30 days
        },
      });
      products.push(product);
      console.log(`  ✅ Created: ${product.name}`);
    }
    console.log(`\n✅ Created ${products.length} products`);

    // Create addresses
    console.log('\n📍 Creating addresses...');
    const addresses = await Promise.all(
      users.map((user, index) =>
        prisma.address.create({
          data: {
            userId: user.id,
            name: user.name,
            email: user.email,
            street: `${100 + index} Main Street`,
            city: 'New York',
            state: 'NY',
            zip: `1000${index}`,
            country: 'USA',
            phone: user.phone,
          },
        })
      )
    );
    console.log(`✅ Created ${addresses.length} addresses`);

    // Create orders
    console.log('\n📋 Creating orders with reviews...');
    let reviewsCreated = 0;
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      const userIndex = i % users.length;
      const user = users[userIndex];
      const storeIndex = i % stores.length;
      const store = stores[storeIndex];
      const address = addresses[userIndex];

      const order = await prisma.order.create({
        data: {
          total: product.price,
          status: 'DELIVERED',
          userId: user.id,
          storeId: store.id,
          addressId: address.id,
          isPaid: true,
          paymentMethod: 'CASHFREE',
          createdAt: new Date(Date.now() - Math.random() * 20 * 24 * 60 * 60 * 1000),
        },
      });

      await prisma.orderItem.create({
        data: {
          orderId: order.id,
          productId: product.id,
          quantity: 1,
          price: product.price,
        },
      });

      // Create 2-3 random reviews per product
      const reviewCount = 2 + Math.floor(Math.random() * 2);
      for (let j = 0; j < reviewCount; j++) {
        const reviewer = users[j % users.length];
        const rating = 3 + Math.floor(Math.random() * 3); // 3-5 stars
        const reviewText = reviewTemplates[Math.floor(Math.random() * reviewTemplates.length)];

        try {
          await prisma.rating.create({
            data: {
              rating,
              review: reviewText,
              userId: reviewer.id,
              productId: product.id,
              orderId: order.id,
              createdAt: new Date(Date.now() - Math.random() * 15 * 24 * 60 * 60 * 1000),
            },
          });
          reviewsCreated++;
        } catch (e) {
          // Duplicate constraint - skip
        }
      }
    }
    console.log(`✅ Created ${reviewsCreated} reviews`);

    console.log('\n✨ Seeding completed successfully!');
    console.log(`\n📊 Summary:`);
    console.log(`  • Users: ${users.length}`);
    console.log(`  • Stores: ${stores.length}`);
    console.log(`  • Products: ${products.length} (with real images)`);
    console.log(`  • Orders: ${products.length}`);
    console.log(`  • Reviews: ${reviewsCreated}`);
    console.log(`  • Images copied to: /public/products/`);
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
