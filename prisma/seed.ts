import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Create default admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  
  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      fullName: 'System Administrator',
      passwordHash: adminPassword,
      role: 'ADMIN',
      isActive: true,
    },
  });

  // Create some example suppliers
  const suppliers = [
    { id: 1, name: 'Main Food Supplier', phone: '+1234567890' },
    { id: 2, name: 'Beverage Supplier', phone: '+0987654321' },
  ];

  for (const supplier of suppliers) {
    await prisma.supplier.upsert({
      where: { id: supplier.id },
      update: supplier,
      create: supplier,
    });
  }

  // Create some example ingredients
  const ingredients = [
    { id: 1, name: 'Tomatoes', unit: 'kg', currentPrice: 2.5, inStock: 100 },
    { id: 2, name: 'Chicken', unit: 'kg', currentPrice: 5.0, inStock: 50 },
    { id: 3, name: 'Rice', unit: 'kg', currentPrice: 1.5, inStock: 200 },
  ];

  for (const ingredient of ingredients) {
    await prisma.ingredient.upsert({
      where: { id: ingredient.id },
      update: ingredient,
      create: ingredient,
    });
  }

  console.log('Database has been seeded. 🌱');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 