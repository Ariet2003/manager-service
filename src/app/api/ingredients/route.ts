import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const ingredients = await prisma.ingredient.findMany({
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json({ ingredients });
  } catch (error) {
    return NextResponse.json(
      { error: 'Ошибка при получении списка ингредиентов' },
      { status: 500 }
    );
  }
} 