import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { ingredientId } = body;

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

    // Проверяем, не находится ли ингредиент уже в стоп-листе
    const existingStopListItem = await prisma.ingredientStopList.findFirst({
      where: {
        ingredientId,
        shiftId: activeShift.id,
      },
    });

    if (existingStopListItem) {
      return NextResponse.json(
        { error: 'Ингредиент уже в стоп-листе' },
        { status: 400 }
      );
    }

    // Добавляем ингредиент в стоп-лист
    const stopListItem = await prisma.ingredientStopList.create({
      data: {
        ingredientId,
        shiftId: activeShift.id,
      },
      include: {
        ingredient: true,
      },
    });

    return NextResponse.json(stopListItem);
  } catch (error) {
    console.error('Error adding ingredient to stop list:', error);
    return NextResponse.json(
      { error: 'Ошибка при добавлении в стоп-лист' },
      { status: 500 }
    );
  }
}

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

    // Получаем все ингредиенты в стоп-листе для текущей смены
    const stopListItems = await prisma.ingredientStopList.findMany({
      where: {
        shiftId: activeShift.id,
      },
      include: {
        ingredient: true,
      },
    });

    return NextResponse.json(stopListItems);
  } catch (error) {
    console.error('Error fetching ingredients stop list:', error);
    return NextResponse.json(
      { error: 'Ошибка при получении стоп-листа ингредиентов' },
      { status: 500 }
    );
  }
} 