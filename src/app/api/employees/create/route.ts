import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';
import { hash } from 'bcrypt';
import { cookies } from 'next/headers';
import { AuthToken } from '@/lib/types';

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
    if (!['ADMIN', 'MANAGER'].includes(tokenData.role)) {
      return NextResponse.json(
        { error: 'Недостаточно прав для создания сотрудников' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { fullName, username, password, role } = body;

    // Валидация
    if (!fullName || !username || !password || !role) {
      return NextResponse.json(
        { error: 'Все поля обязательны для заполнения' },
        { status: 400 }
      );
    }

    if (!['MANAGER', 'ADMIN', 'CASHIER', 'WAITER'].includes(role)) {
      return NextResponse.json(
        { error: 'Некорректная роль' },
        { status: 400 }
      );
    }

    // Проверяем, не занят ли username
    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Пользователь с таким логином уже существует' },
        { status: 400 }
      );
    }

    // Хешируем пароль
    const passwordHash = await hash(password, 10);

    // Создаем пользователя
    const newUser = await prisma.user.create({
      data: {
        fullName,
        username,
        passwordHash,
        role,
        isActive: true,
      },
      select: {
        id: true,
        fullName: true,
        username: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json(newUser);
  } catch (error) {
    console.error('Error creating employee:', error);
    return NextResponse.json(
      { error: 'Ошибка при создании сотрудника' },
      { status: 500 }
    );
  }
} 