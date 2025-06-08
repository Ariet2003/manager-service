import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Получаем активную смену
    const activeShift = await prisma.shift.findFirst({
      where: {
        isActive: true,
      },
    });

    if (!activeShift) {
      return NextResponse.json(
        { error: 'Нет активной смены' },
        { status: 400 }
      );
    }

    // Получаем заказы текущей смены
    const orders = await prisma.order.findMany({
      where: {
        shiftId: activeShift.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        waiter: {
          select: {
            id: true,
            fullName: true,
          },
        },
        cashier: {
          select: {
            id: true,
            fullName: true,
          },
        },
        items: {
          include: {
            menuItem: {
              select: {
                name: true,
              },
            },
          },
        },
        payments: true,
      },
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Ошибка при получении списка заказов' },
      { status: 500 }
    );
  }
} 