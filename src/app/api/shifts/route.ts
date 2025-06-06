import { prisma } from '@/lib/db';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { AuthToken } from '@/lib/types';

// Функция для получения даты с учетом +6 часов
function getDateWithOffset(): Date {
  const now = new Date();
  now.setHours(now.getHours() + 6);
  return now;
}

// Функция для получения начала текущего дня (00:00:00)
function getStartOfDay(date: Date): Date {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  return startOfDay;
}

// Функция для получения конца дня (23:59:59)
function getEndOfDay(date: Date): Date {
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  return endOfDay;
}

// Функция для получения рабочего дня с учетом +6 часов
function getWorkingDay(date: Date): Date {
  const workingDay = new Date(date);
  if (workingDay.getHours() < 6) {
    // Если время меньше 6 утра, это считается предыдущим рабочим днем
    workingDay.setDate(workingDay.getDate() - 1);
  }
  workingDay.setHours(6, 0, 0, 0);
  return workingDay;
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

    // Проверяем роль пользователя
    if (tokenData.role !== 'MANAGER') {
      return NextResponse.json(
        { error: 'Недостаточно прав' },
        { status: 403 }
      );
    }

    // Проверяем существование менеджера
    const manager = await prisma.user.findFirst({
      where: {
        id: tokenData.userId,
        role: 'MANAGER',
        isActive: true
      }
    });

    if (!manager) {
      return NextResponse.json(
        { error: 'Доступ запрещен' },
        { status: 403 }
      );
    }

    // Проверяем, нет ли активной смены
    const existingActiveShift = await prisma.shift.findFirst({
      where: {
        isActive: true,
        endedAt: null,
      },
    });

    if (existingActiveShift) {
      return NextResponse.json(
        { error: 'Уже есть активная смена. Закройте текущую смену перед открытием новой.' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { cashierId, waiterIds } = body;

    if (!cashierId || !waiterIds || waiterIds.length === 0) {
      return NextResponse.json(
        { error: 'Необходимо выбрать кассира и хотя бы одного официанта' },
        { status: 400 }
      );
    }

    // Проверяем существование выбранных сотрудников
    const [cashier, ...waiters] = await Promise.all([
      prisma.user.findFirst({
        where: {
          id: cashierId,
          role: 'CASHIER',
          isActive: true
        }
      }),
      ...waiterIds.map((id: string) => 
        prisma.user.findFirst({
          where: {
            id: id,
            role: 'WAITER',
            isActive: true
          }
        })
      )
    ]);

    if (!cashier || waiters.some(w => !w)) {
      return NextResponse.json(
        { error: 'Один или несколько выбранных сотрудников не найдены' },
        { status: 400 }
      );
    }

    // Создаем новую смену с правильным временным поясом (UTC+6)
    const now = new Date();
    // Добавляем 6 часов к UTC времени
    const localTime = new Date(now.getTime() + (6 * 60 * 60 * 1000));

    const newShift = await prisma.shift.create({
      data: {
        startedAt: localTime,
        isActive: true,
        managerId: manager.id,
        staff: {
          create: [
            { userId: cashierId },
            ...waiterIds.map((id: string) => ({ userId: id })),
          ],
        },
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

    return NextResponse.json({ shift: newShift });
  } catch (error) {
    console.error('Error opening shift:', error);
    return NextResponse.json(
      { error: 'Ошибка при открытии смены' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const shifts = await prisma.shift.findMany({
      include: {
        manager: {
          select: {
            fullName: true,
          },
        },
        staff: {
          include: {
            user: {
              select: {
                fullName: true,
                role: true,
              },
            },
          },
        },
        orders: {
          include: {
            payments: {
              select: {
                amount: true,
                paymentType: true,
              },
            },
          },
        },
        menuStopList: {
          include: {
            menuItem: true,
          },
        },
        ingredientStopList: {
          include: {
            ingredient: true,
          },
        },
      },
      orderBy: {
        startedAt: 'desc',
      },
    });

    return NextResponse.json(shifts);
  } catch (error) {
    console.error('Error fetching shifts:', error);
    return NextResponse.json(
      { error: 'Ошибка при получении данных' },
      { status: 500 }
    );
  }
} 