const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const dummyUsers = [
  {
    name: 'John Smith',
    email: 'john@example.com',
    phone: '9876543210',
    image: 'https://avatar.iran.liara.run/public/boy?username=john',
    googleId: 'google-john-001',
    isProfileSetup: true,
    isEmailVerified: true,
    isPhoneVerified: true,
  },
  {
    name: 'Sarah Johnson',
    email: 'sarah@example.com',
    phone: '9876543211',
    image: 'https://avatar.iran.liara.run/public/girl?username=sarah',
    googleId: 'google-sarah-001',
    isProfileSetup: true,
    isEmailVerified: true,
    isPhoneVerified: true,
  },
  {
    name: 'Mike Davis',
    email: 'mike@example.com',
    phone: '9876543212',
    image: 'https://avatar.iran.liara.run/public/boy?username=mike',
    googleId: 'google-mike-001',
    isProfileSetup: true,
    isEmailVerified: true,
    isPhoneVerified: true,
  },
];

const dummyStores = [
  {
    name: 'TechHub',
    description: 'Leading electronics and gadgets store',
    username: 'techhub-store',
    address: '123 Tech Street, Silicon Valley, CA',
    logo: 'https://via.placeholder.com/100?text=TechHub',
    email: 'store1@example.com',
    contact: '9876543210',
    status: 'active',
    isActive: true,
  },
  {
    name: 'Fashion Plus',
    description: 'Latest fashion and apparel collection',
    username: 'fashion-plus-store',
    address: '456 Fashion Lane, New York, NY',
    logo: 'https://via.placeholder.com/100?text=FashionPlus',
    email: 'store2@example.com',
    contact: '9876543211',
    status: 'active',
    isActive: true,
  },
  {
    name: 'Home Essentials',
    description: 'Quality home and lifestyle products',
    username: 'home-essentials-store',
    address: '789 Home Ave, Austin, TX',
    logo: 'https://via.placeholder.com/100?text=HomeEss',
    email: 'store3@example.com',
    contact: '9876543212',
    status: 'active',
    isActive: true,
  },
];

const dummyProducts = [
  {
    name: 'Wireless Bluetooth Headphones',
    description: 'High-quality noise-cancelling wireless headphones with 30-hour battery life and premium sound quality.',
    mrp: 5999,
    price: 3499,
    images: [
      'https://via.placeholder.com/400x400?text=Headphones+1',
      'https://via.placeholder.com/400x400?text=Headphones+2',
      'https://via.placeholder.com/400x400?text=Headphones+3',
    ],
    category: 'Electronics',
    inStock: true,
    quantity: 45,
    crashCashValue: 175,
  },
  {
    name: 'Smartphone Stand',
    description: 'Adjustable phone stand for desk with sturdy grip and 360-degree rotation.',
    mrp: 1499,
    price: 799,
    images: [
      'https://via.placeholder.com/400x400?text=Phone+Stand+1',
      'https://via.placeholder.com/400x400?text=Phone+Stand+2',
    ],
    category: 'Accessories',
    inStock: true,
    quantity: 120,
    crashCashValue: 40,
  },
  {
    name: 'USB-C Power Bank 20000mAh',
    description: 'Fast charging power bank with USB-C and dual USB ports. Perfect for travel and daily use.',
    mrp: 3499,
    price: 1999,
    images: [
      'https://via.placeholder.com/400x400?text=PowerBank+1',
      'https://via.placeholder.com/400x400?text=PowerBank+2',
    ],
    category: 'Electronics',
    inStock: true,
    quantity: 78,
    crashCashValue: 100,
  },
  {
    name: 'Premium Cotton T-Shirt',
    description: 'Comfortable 100% organic cotton t-shirt with modern designs. Available in multiple sizes.',
    mrp: 999,
    price: 499,
    images: [
      'https://via.placeholder.com/400x400?text=TShirt+1',
      'https://via.placeholder.com/400x400?text=TShirt+2',
      'https://via.placeholder.com/400x400?text=TShirt+3',
    ],
    category: 'Clothing',
    inStock: true,
    quantity: 200,
    crashCashValue: 25,
  },
  {
    name: 'Stainless Steel Water Bottle',
    description: 'Double-wall insulated water bottle keeps drinks hot/cold for 24 hours. Eco-friendly choice.',
    mrp: 1299,
    price: 699,
    images: [
      'https://via.placeholder.com/400x400?text=WaterBottle+1',
      'https://via.placeholder.com/400x400?text=WaterBottle+2',
    ],
    category: 'Home',
    inStock: true,
    quantity: 95,
    crashCashValue: 35,
  },
  {
    name: '4K USB Webcam',
    description: 'Professional 4K webcam with auto-focus and built-in microphone. Perfect for streaming and meetings.',
    mrp: 8999,
    price: 4999,
    images: [
      'https://via.placeholder.com/400x400?text=Webcam+1',
      'https://via.placeholder.com/400x400?text=Webcam+2',
    ],
    category: 'Electronics',
    inStock: true,
    quantity: 35,
    crashCashValue: 250,
  },
  {
    name: 'Mechanical Keyboard RGB',
    description: 'Customizable RGB mechanical keyboard with hot-swappable switches. Great for gaming and typing.',
    mrp: 5499,
    price: 3299,
    images: [
      'https://via.placeholder.com/400x400?text=Keyboard+1',
      'https://via.placeholder.com/400x400?text=Keyboard+2',
      'https://via.placeholder.com/400x400?text=Keyboard+3',
    ],
    category: 'Electronics',
    inStock: true,
    quantity: 60,
    crashCashValue: 165,
  },
  {
    name: 'Portable Speaker',
    description: 'Compact waterproof Bluetooth speaker with 12-hour battery. Perfect for outdoor adventures.',
    mrp: 2999,
    price: 1499,
    images: [
      'https://via.placeholder.com/400x400?text=Speaker+1',
      'https://via.placeholder.com/400x400?text=Speaker+2',
    ],
    category: 'Electronics',
    inStock: true,
    quantity: 85,
    crashCashValue: 75,
  },
  {
    name: 'Smart LED Bulb',
    description: 'WiFi-enabled RGB smart bulb with app control. Compatible with Alexa and Google Home.',
    mrp: 1799,
    price: 899,
    images: [
      'https://via.placeholder.com/400x400?text=SmartBulb+1',
      'https://via.placeholder.com/400x400?text=SmartBulb+2',
    ],
    category: 'Home',
    inStock: true,
    quantity: 150,
    crashCashValue: 45,
  },
  {
    name: 'Desk Lamp with USB',
    description: 'Adjustable LED desk lamp with USB charging port and touch control.',
    mrp: 1299,
    price: 649,
    images: [
      'https://via.placeholder.com/400x400?text=Lamp+1',
      'https://via.placeholder.com/400x400?text=Lamp+2',
    ],
    category: 'Home',
    inStock: true,
    quantity: 110,
    crashCashValue: 35,
  },
];

const dummyReviews = [
  {
    rating: 5,
    review: 'Amazing quality! The headphones are comfortable and the sound is crystal clear. Highly recommend!',
    userName: 'John Smith',
    userImage: 'https://avatar.iran.liara.run/public/boy?username=john',
  },
  {
    rating: 4,
    review: 'Great product. Battery life is excellent. Only issue is the price is a bit high.',
    userName: 'Sarah Johnson',
    userImage: 'https://avatar.iran.liara.run/public/girl?username=sarah',
  },
  {
    rating: 5,
    review: 'Perfect! Worth every penny. Great build quality and amazing sound.',
    userName: 'Mike Davis',
    userImage: 'https://avatar.iran.liara.run/public/boy?username=mike',
  },
  {
    rating: 3,
    review: 'Good but could be better. Some connectivity issues initially but resolved after update.',
    userName: 'Alice Cooper',
    userImage: 'https://avatar.iran.liara.run/public/girl?username=alice',
  },
  {
    rating: 5,
    review: 'Excellent customer service and fast delivery. Product exceeded expectations!',
    userName: 'Bob Wilson',
    userImage: 'https://avatar.iran.liara.run/public/boy?username=bob',
  },
];

async function main() {
  try {
    console.log('🗑️  Clearing all data...');

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

    console.log('👥 Creating users...');
    const createdUsers = await Promise.all(
      dummyUsers.map(user => prisma.user.create({ data: user }))
    );
    console.log(`✅ Created ${createdUsers.length} users`);

    console.log('🏪 Creating stores...');
    const createdStores = await Promise.all(
      dummyStores.map((store, index) =>
        prisma.store.create({
          data: {
            ...store,
            userId: createdUsers[index].id,
          },
        })
      )
    );
    console.log(`✅ Created ${createdStores.length} stores`);

    console.log('📦 Creating products...');
    const createdProducts = [];
    let productIndex = 0;
    for (const product of dummyProducts) {
      const storeIndex = productIndex % createdStores.length;
      const createdProduct = await prisma.product.create({
        data: {
          ...product,
          storeId: createdStores[storeIndex].id,
        },
      });
      createdProducts.push(createdProduct);
      productIndex++;
    }
    console.log(`✅ Created ${createdProducts.length} products`);

    // Create addresses first
    console.log('📍 Creating addresses...');
    const createdAddresses = await Promise.all(
      createdUsers.map(user =>
        prisma.address.create({
          data: {
            userId: user.id,
            name: user.name,
            email: user.email,
            street: '123 Main Street',
            city: 'New York',
            state: 'NY',
            zip: '10001',
            country: 'USA',
            phone: user.phone,
          },
        })
      )
    );
    console.log(`✅ Created ${createdAddresses.length} addresses`);

    // Create dummy orders
    console.log('📋 Creating dummy orders...');
    const createdOrders = [];
    for (let i = 0; i < 5; i++) {
      const user = createdUsers[i % createdUsers.length];
      const store = createdStores[i % createdStores.length];
      const address = createdAddresses[i % createdAddresses.length];
      const product = createdProducts[i % createdProducts.length];

      const order = await prisma.order.create({
        data: {
          total: product.price,
          status: 'DELIVERED',
          userId: user.id,
          storeId: store.id,
          addressId: address.id,
          isPaid: true,
          paymentMethod: 'CASHFREE',
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

      createdOrders.push(order);
    }
    console.log(`✅ Created ${createdOrders.length} orders with items`);

    console.log('⭐ Adding reviews...');
    let reviewsCreated = 0;
    for (let orderIdx = 0; orderIdx < createdOrders.length; orderIdx++) {
      const order = createdOrders[orderIdx];
      const productId = createdProducts[orderIdx % createdProducts.length].id;
      const userId = createdUsers[orderIdx % createdUsers.length].id;

      for (let i = 0; i < Math.min(3, dummyReviews.length); i++) {
        const review = dummyReviews[i];

        try {
          await prisma.rating.create({
            data: {
              rating: review.rating,
              review: review.review,
              userId: userId,
              productId: productId,
              orderId: order.id,
            },
          });
          reviewsCreated++;
        } catch (e) {
          // Unique constraint - skip if duplicate
        }
      }
    }
    console.log(`✅ Created ${reviewsCreated} reviews`);

    console.log('\n✨ Dummy data seeding completed successfully!');
    console.log(`\n📊 Summary:`);
    console.log(`  • Users: ${createdUsers.length}`);
    console.log(`  • Stores: ${createdStores.length}`);
    console.log(`  • Products: ${createdProducts.length}`);
    console.log(`  • Reviews: ${reviewsCreated}`);
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
