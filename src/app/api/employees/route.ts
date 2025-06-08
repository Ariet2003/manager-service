import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const employees = await prisma.user.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        fullName: true,
        username: true,
        role: true,
        createdAt: true,
      },
      orderBy: {
        role: 'asc',
      },
    });

    return NextResponse.json({ employees });
  } catch (error) {
    return NextResponse.json(
      { error: 'Ошибка при получении списка сотрудников' },
      { status: 500 }
    );
  }
} 