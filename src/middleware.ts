import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;

  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/signup', '/forgot-password'];
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));
  const isShareRoute = pathname.startsWith('/share');
  const isApiAuth = pathname.startsWith('/api/auth');
  const isApiPublic = pathname.startsWith('/api/public');
  const isStaticAsset = pathname.startsWith('/_next') || pathname.startsWith('/favicon');
  const isRootPage = pathname === '/';

  if (isStaticAsset || isApiAuth || isShareRoute || isApiPublic || isRootPage) {
    return NextResponse.next();
  }

  // Redirect logged-in users away from auth pages
  if (isPublicRoute && isLoggedIn) {
    return NextResponse.redirect(new URL('/dashboard', req.nextUrl));
  }

  // Redirect non-logged-in users to login
  if (!isPublicRoute && !isLoggedIn && !pathname.startsWith('/api')) {
    return NextResponse.redirect(new URL('/login', req.nextUrl));
  }

  // Protect admin routes
  if (pathname.startsWith('/admin') && req.auth?.user) {
    if ((req.auth.user as any).role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', req.nextUrl));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
