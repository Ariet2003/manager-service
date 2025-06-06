import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export async function testDatabaseConnection() {
  try {
    await prisma.$connect();
    console.log('Database connection successful');
    
    // Проверяем наличие пользователей
    const usersCount = await prisma.user.count();
    console.log(`Found ${usersCount} users in database`);
    
    // Получаем список всех пользователей для отладки
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        isActive: true,
        role: true,
      },
    });
    console.log('Users in database:', users);
    
    return true;
  } catch (error) {
    console.error('Database connection error:', error);
    return false;
  }
} 