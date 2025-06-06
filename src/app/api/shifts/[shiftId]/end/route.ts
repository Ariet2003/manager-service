import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { AuthToken } from '@/lib/types';

// Функция для получения даты с учетом +6 часов
function getDateWithOffset(): Date {
  const now = new Date();
  now.setHours(now.getHours() + 6);
  return now;
}

export async function POST(
  request: Request,
  { params }: { params: { shiftId: string } }
) {
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

    // Проверяем роль пользователя
    if (tokenData.role !== 'MANAGER') {
      return NextResponse.json(
        { error: 'Недостаточно прав' },
        { status: 403 }
      );
    }

    const shiftId = parseInt(params.shiftId);
    if (isNaN(shiftId)) {
      return NextResponse.json(
        { error: 'Некорректный ID смены' },
        { status: 400 }
      );
    }

    // Проверяем существование смены
    const shift = await prisma.shift.findFirst({
      where: {
        id: shiftId,
        isActive: true,
        endedAt: null,
      },
    });

    if (!shift) {
      return NextResponse.json(
        { error: 'Смена не найдена или уже завершена' },
        { status: 404 }
      );
    }

    // Завершаем смену с учетом временной зоны UTC+6
    const now = new Date();
    const localTime = new Date(now.getTime() + (6 * 60 * 60 * 1000));

    const endedShift = await prisma.shift.update({
      where: {
        id: shiftId,
      },
      data: {
        endedAt: localTime,
        isActive: false,
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

    return NextResponse.json({ shift: endedShift });
  } catch (error) {
    console.error('Error ending shift:', error);
    return NextResponse.json(
      { error: 'Ошибка при завершении смены' },
      { status: 500 }
    );
  }
} 