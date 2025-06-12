import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/settings
export async function GET() {
  try {
    const settings = await prisma.settings.findMany();
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { error: 'Ошибка при получении настроек' },
      { status: 500 }
    );
  }
}

// POST /api/settings
export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { key, value } = data;

    const setting = await prisma.settings.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });

    return NextResponse.json(setting);
  } catch (error) {
    console.error('Error saving setting:', error);
    return NextResponse.json(
      { error: 'Ошибка при сохранении настройки' },
      { status: 500 }
    );
  }
} 