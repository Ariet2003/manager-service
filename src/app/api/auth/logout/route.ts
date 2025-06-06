import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST() {
  // Удаляем куки аутентификации
  cookies().delete('auth-token');
  
  return NextResponse.json({ success: true });
} 