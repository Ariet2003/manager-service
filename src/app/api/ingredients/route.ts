import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/ingredients - получение списка ингредиентов
export async function GET() {
  try {
    const ingredients = await prisma.ingredient.findMany({
      orderBy: {
        name: 'asc'
      }
    });

    return NextResponse.json({ ingredients });
  } catch (error) {
    console.error('[INGREDIENTS_GET]', error);
    return new NextResponse(
      JSON.stringify({ error: 'Internal Server Error' }),
      { status: 500 }
    );
  }
} 