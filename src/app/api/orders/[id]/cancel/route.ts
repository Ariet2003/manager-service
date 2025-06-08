import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = parseInt(params.id);

    if (isNaN(orderId)) {
      return NextResponse.json(
        { error: 'Неверный ID заказа' },
        { status: 400 }
      );
    }

    // Проверяем существование заказа
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Заказ не найден' },
        { status: 404 }
      );
    }

    if (order.status !== 'OPEN') {
      return NextResponse.json(
        { error: 'Можно отменить только открытый заказ' },
        { status: 400 }
      );
    }

    // Обновляем статус заказа
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status: 'CANCELLED' },
    });

    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error('Error canceling order:', error);
    return NextResponse.json(
      { error: 'Ошибка при отмене заказа' },
      { status: 500 }
    );
  }
} 