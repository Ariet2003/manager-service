import { prisma, testDatabaseConnection } from '@/lib/db';
import { compare } from 'bcrypt';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // Проверяем подключение к базе данных
    await testDatabaseConnection();

    const body = await request.json();
    console.log('Login attempt for username:', body.username);

    if (!body.username || !body.password) {
      return NextResponse.json(
        { error: 'Необходимо указать имя пользователя и пароль' },
        { status: 400 }
      );
    }

    // Ищем пользователя
    const user = await prisma.user.findFirst({
      where: {
        username: body.username,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Неверное имя пользователя или пароль' },
        { status: 401 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        { error: 'Учетная запись отключена' },
        { status: 401 }
      );
    }

    // Проверяем пароль
    const isPasswordValid = await compare(body.password, user.passwordHash);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Неверное имя пользователя или пароль' },
        { status: 401 }
      );
    }

    // Создаем токен
    const authToken = Buffer.from(JSON.stringify({
      userId: user.id,
      role: user.role,
      exp: Date.now() + 24 * 60 * 60 * 1000, // 24 часа
    })).toString('base64');

    // Устанавливаем куки
    cookies().set('auth-token', authToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24 часа
      path: '/',
    });

    // Возвращаем данные пользователя без пароля
    const { passwordHash, ...userWithoutPassword } = user;
    
    return NextResponse.json({
      success: true,
      user: userWithoutPassword,
    });

  } catch (error) {
    console.error('Login error details:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 