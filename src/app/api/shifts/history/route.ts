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

    // Получаем историю смен, сортируем по дате начала (сначала новые)
    const shifts = await prisma.shift.findMany({
      orderBy: {
        startedAt: 'desc',
      },
      include: {
        manager: {
          select: {
            id: true,
            fullName: true,
            username: true,
            role: true,
          },
        },
        staff: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                username: true,
                role: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ shifts });
  } catch (error) {
    console.error('Error fetching shifts history:', error);
    return NextResponse.json(
      { error: 'Ошибка при получении истории смен' },
      { status: 500 }
    );
  }
} 