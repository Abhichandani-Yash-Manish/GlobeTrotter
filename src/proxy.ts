import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

export const proxy = auth((request) => {
  const { pathname } = request.nextUrl;
  const isLoggedIn = Boolean(request.auth);
  const publicRoutes = ['/login', '/signup', '/forgot-password', '/reset-password'];
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));

  if (
    pathname === '/' ||
    pathname.startsWith('/share') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/public')
  ) {
    return NextResponse.next();
  }

  if (isPublicRoute && isLoggedIn) {
    return NextResponse.redirect(new URL('/dashboard', request.nextUrl));
  }

  if (!isPublicRoute && !isLoggedIn && !pathname.startsWith('/api')) {
    const loginUrl = new URL('/login', request.nextUrl);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
