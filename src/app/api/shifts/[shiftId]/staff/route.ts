import { prisma } from '@/lib/db';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

interface AuthToken {
  userId: string;
  role: string;
  exp: number;
}

export async function PUT(
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
      },
    });

    if (!shift) {
      return NextResponse.json(
        { error: 'Смена не найдена или не активна' },
        { status: 404 }
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

    // Обновляем состав сотрудников
    await prisma.$transaction(async (tx) => {
      // Удаляем текущих сотрудников
      await tx.shiftStaff.deleteMany({
        where: {
          shiftId: shiftId
        }
      });

      // Добавляем новых сотрудников
      await tx.shiftStaff.createMany({
        data: [
          { shiftId, userId: cashierId },
          ...waiterIds.map(id => ({ shiftId, userId: id }))
        ]
      });
    });

    // Получаем обновленную смену
    const updatedShift = await prisma.shift.findUnique({
      where: {
        id: shiftId
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

    return NextResponse.json({ shift: updatedShift });
  } catch (error) {
    console.error('Error updating shift staff:', error);
    return NextResponse.json(
      { error: 'Ошибка при обновлении состава сотрудников' },
      { status: 500 }
    );
  }
} 