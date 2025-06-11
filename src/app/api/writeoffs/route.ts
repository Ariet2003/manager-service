import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
import { AuthToken } from '@/lib/types';

// GET /api/writeoffs - получение списка списаний
export async function GET() {
  try {
    const writeOffs = await prisma.writeOff.findMany({
      include: {
        ingredient: true,
        createdBy: {
          select: {
            fullName: true
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    });

    return NextResponse.json({ writeOffs });
  } catch (error) {
    console.error('[WRITEOFFS_GET]', error);
    return new NextResponse(
      JSON.stringify({ error: 'Internal Server Error' }),
      { status: 500 }
    );
  }
}

// POST /api/writeoffs - создание нового списания
export async function POST(req: Request) {
  try {
    // Проверяем аутентификацию
    const authToken = cookies().get('auth-token');
    if (!authToken) {
      return NextResponse.json(
        { error: 'Необходима авторизация' },
        { status: 401 }
      );
    }

    // Декодируем токен
    let tokenData: AuthToken;
    try {
      tokenData = JSON.parse(Buffer.from(authToken.value, 'base64').toString());
    } catch (e) {
      return NextResponse.json(
        { error: 'Недействительный токен' },
        { status: 401 }
      );
    }

    // Проверяем срок действия токена
    if (tokenData.exp < Date.now()) {
      return NextResponse.json(
        { error: 'Срок действия токена истек' },
        { status: 401 }
      );
    }

    const json = await req.json();
    const { ingredientId, quantity, type, comment } = json;

    // Проверка наличия обязательных полей
    if (!ingredientId || !quantity || !type) {
      return new NextResponse(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400 }
      );
    }

    // Получаем текущую смену
    const activeShift = await prisma.shift.findFirst({
      where: {
        isActive: true
      }
    });

    if (!activeShift) {
      return new NextResponse(
        JSON.stringify({ error: 'No active shift found' }),
        { status: 400 }
      );
    }

    // Проверяем наличие достаточного количества ингредиента
    const ingredient = await prisma.ingredient.findUnique({
      where: {
        id: ingredientId
      }
    });

    if (!ingredient) {
      return new NextResponse(
        JSON.stringify({ error: 'Ingredient not found' }),
        { status: 404 }
      );
    }

    if (ingredient.inStock < quantity) {
      return new NextResponse(
        JSON.stringify({ error: 'Insufficient ingredient quantity' }),
        { status: 400 }
      );
    }

    // Создаем списание и обновляем количество ингредиента в транзакции
    const writeOff = await prisma.$transaction(async (tx) => {
      // Создаем списание
      const writeOff = await tx.writeOff.create({
        data: {
          ingredientId,
          quantity,
          type,
          comment,
          createdById: tokenData.userId, // Используем ID пользователя из токена
          shiftId: activeShift.id
        },
        include: {
          ingredient: true,
          createdBy: {
            select: {
              fullName: true
            }
          }
        }
      });

      // Обновляем количество ингредиента
      await tx.ingredient.update({
        where: {
          id: ingredientId
        },
        data: {
          inStock: {
            decrement: quantity
          }
        }
      });

      return writeOff;
    });

    return NextResponse.json(writeOff);
  } catch (error) {
    console.error('[WRITEOFFS_POST]', error);
    return new NextResponse(
      JSON.stringify({ error: 'Internal Server Error' }),
      { status: 500 }
    );
  }
} 