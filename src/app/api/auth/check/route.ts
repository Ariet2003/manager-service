import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  const authToken = cookies().get('auth-token');
 
  return NextResponse.json({
    authenticated: !!authToken,
  });
} 