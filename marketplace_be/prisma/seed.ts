// prisma/seed.ts
import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@marketplace.com' },
    update: {},
    create: {
      email: 'admin@marketplace.com',
      password: adminPassword,
      name: 'Admin User',
      role: Role.ADMIN,
    },
  });

  // Create test users
  const userPassword = await bcrypt.hash('password123', 10);
  const user1 = await prisma.user.upsert({
    where: { email: 'seller@example.com' },
    update: {},
    create: {
      email: 'seller@example.com',
      password: userPassword,
      name: 'Test Seller',
      role: Role.USER,
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'buyer@example.com' },
    update: {},
    create: {
      email: 'buyer@example.com',
      password: userPassword,
      name: 'Test Buyer',
      role: Role.USER,
    },
  });

  // Create categories
  const electronics = await prisma.category.upsert({
    where: { name: 'Electronics' },
    update: {},
    create: {
      name: 'Electronics',
      description: 'Electronic devices and accessories',
    },
  });

  const clothing = await prisma.category.upsert({
    where: { name: 'Clothing' },
    update: {},
    create: {
      name: 'Clothing',
      description: 'Fashion and apparel',
    },
  });

  const books = await prisma.category.upsert({
    where: { name: 'Books' },
    update: {},
    create: {
      name: 'Books',
      description: 'Books and literature',
    },
  });

  // Create sample products
  const products = await Promise.all([
    prisma.product.create({
      data: {
        name: 'iPhone 14 Pro',
        description: 'Latest Apple smartphone with advanced features',
        price: 999.99,
        stock: 10,
        images: ['/images/iphone14.jpg'],
        categoryId: electronics.id,
        sellerId: user1.id,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Samsung Galaxy S23',
        description: 'Premium Android smartphone',
        price: 899.99,
        stock: 15,
        images: ['/images/samsung-s23.jpg'],
        categoryId: electronics.id,
        sellerId: user1.id,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Cotton T-Shirt',
        description: 'Comfortable cotton t-shirt',
        price: 29.99,
        stock: 50,
        images: ['/images/tshirt.jpg'],
        categoryId: clothing.id,
        sellerId: user1.id,
      },
    }),
  ]);

  console.log('Seed data created successfully');
  console.log({ admin, user1, user2, categories: [electronics, clothing, books], products });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });