import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { AuthToken } from '@/lib/types';

export async function GET() {
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

    const deliveries = await prisma.delivery.findMany({
      include: {
        ingredient: true,
        supplier: true,
      },
      orderBy: {
        deliveryDate: 'desc',
      },
    });

    return NextResponse.json({ deliveries });
  } catch (error) {
    console.error('Error fetching deliveries:', error);
    return NextResponse.json(
      { error: 'Ошибка при получении списка поставок' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
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

    const body = await request.json();
    const { ingredientId, supplierId, quantity, pricePerUnit } = body;

    // Проверяем обязательные поля
    if (!ingredientId || !supplierId || !quantity || !pricePerUnit) {
      return NextResponse.json(
        { error: 'Не все обязательные поля заполнены' },
        { status: 400 }
      );
    }

    // Создаем транзакцию для атомарного обновления
    const result = await prisma.$transaction(
      async (tx) => {
        // Получаем текущую дату в UTC+6 только для создания записей
        const now = new Date();
        now.setHours(now.getHours() + 6);

        // Создаем новую поставку
        const delivery = await tx.delivery.create({
          data: {
            ingredientId,
            supplierId,
            quantity,
            pricePerUnit,
            deliveryDate: now, // Используем UTC+6 для создания
            createdById: tokenData.userId,
          },
          include: {
            ingredient: true,
            supplier: true,
          },
        });

        // Обновляем количество, цену и дату обновления ингредиента
        await tx.ingredient.update({
          where: { id: ingredientId },
          data: {
            inStock: {
              increment: quantity,
            },
            currentPrice: pricePerUnit,
            createdAt: now, // Используем UTC+6 для создания
          },
        });

        return delivery;
      },
      {
        maxWait: 10000, // максимальное время ожидания начала транзакции - 10 секунд
        timeout: 5000, // максимальное время выполнения транзакции - 5 секунд
      }
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error creating delivery:', error);
    return NextResponse.json(
      { error: 'Ошибка при создании поставки' },
      { status: 500 }
    );
  }
} 