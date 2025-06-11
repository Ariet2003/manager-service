import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Маршруты, которые не требуют аутентификации
const publicRoutes = ['/'];

// Маршруты API, которые не требуют аутентификации
const publicApiRoutes = ['/api/auth/login'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isApiRoute = pathname.startsWith('/api');
  const isPublicRoute = publicRoutes.includes(pathname);
  const isPublicApiRoute = publicApiRoutes.includes(pathname);
  
  // Получаем токен из куки
  const authToken = request.cookies.get('auth-token');

  // Для API маршрутов
  if (isApiRoute) {
    if (!isPublicApiRoute && !authToken) {
      return NextResponse.json(
        { error: 'Не авторизован' },
        { status: 401 }
      );
    }
    return NextResponse.next();
  }

  // Для обычных маршрутов
  if (authToken) {
    // Если пользователь авторизован и пытается зайти на страницу входа,
    // перенаправляем на дашборд
    if (isPublicRoute) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  } else {
    // Если пользователь не авторизован и пытается зайти на защищенный маршрут,
    // перенаправляем на страницу входа
    if (!isPublicRoute) {
      const loginUrl = new URL('/', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}; 