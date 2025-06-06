import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Получаем всех активных сотрудников с ролями WAITER и CASHIER
    const employees = await prisma.user.findMany({
      where: {
        isActive: true,
        role: {
          in: ['WAITER', 'CASHIER'],
        },
      },
      select: {
        id: true,
        fullName: true,
        username: true,
        role: true,
      },
      orderBy: {
        role: 'asc',
      },
    });

    // Группируем сотрудников по ролям
    const waiters = employees.filter(emp => emp.role === 'WAITER');
    const cashiers = employees.filter(emp => emp.role === 'CASHIER');

    return NextResponse.json({
      waiters,
      cashiers,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Ошибка при получении списка сотрудников' },
      { status: 500 }
    );
  }
} 