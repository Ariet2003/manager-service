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

    // Получаем все блюда в стоп-листе для текущей смены
    const stopListItems = await prisma.menuStopList.findMany({
      where: {
        shiftId: activeShift.id,
      },
      include: {
        menuItem: true,
      },
    });

    return NextResponse.json(stopListItems);
  } catch (error) {
    console.error('Error fetching stop list:', error);
    return NextResponse.json(
      { error: 'Ошибка при получении стоп-листа' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { menuItemId } = body;

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

    // Проверяем, не находится ли блюдо уже в стоп-листе
    const existingStopListItem = await prisma.menuStopList.findFirst({
      where: {
        menuItemId,
        shiftId: activeShift.id,
      },
    });

    if (existingStopListItem) {
      return NextResponse.json(
        { error: 'Блюдо уже в стоп-листе' },
        { status: 400 }
      );
    }

    // Добавляем блюдо в стоп-лист
    const stopListItem = await prisma.menuStopList.create({
      data: {
        menuItemId,
        shiftId: activeShift.id,
      },
      include: {
        menuItem: true,
      },
    });

    return NextResponse.json(stopListItem);
  } catch (error) {
    console.error('Error adding menu item to stop list:', error);
    return NextResponse.json(
      { error: 'Ошибка при добавлении в стоп-лист' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const menuItemId = searchParams.get('menuItemId');

    if (!menuItemId) {
      return NextResponse.json(
        { error: 'Не указан ID блюда' },
        { status: 400 }
      );
    }

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

    // Удаляем блюдо из стоп-листа
    await prisma.menuStopList.deleteMany({
      where: {
        menuItemId: parseInt(menuItemId),
        shiftId: activeShift.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing menu item from stop list:', error);
    return NextResponse.json(
      { error: 'Ошибка при удалении из стоп-листа' },
      { status: 500 }
    );
  }
} 