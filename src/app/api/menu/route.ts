import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const menuItems = await prisma.menuItem.findMany({
      where: {
        isActive: true,
      },
      include: {
        ingredients: {
          include: {
            ingredient: true,
          },
        },
        createdBy: {
          select: {
            fullName: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json({ menuItems });
  } catch (error) {
    return NextResponse.json(
      { error: 'Ошибка при получении списка блюд' },
      { status: 500 }
    );
  }
} 