import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Ищем только активную смену
    const activeShift = await prisma.shift.findFirst({
      where: {
        isActive: true,
        endedAt: null,
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

    console.log('Active shift found:', activeShift);

    return NextResponse.json({ 
      shift: activeShift,
      todayClosedShift: null
    });
  } catch (error) {
    console.error('Error in /api/shifts/active:', error);
    return NextResponse.json(
      { error: 'Ошибка при получении данных смены' },
      { status: 500 }
    );
  }
} 