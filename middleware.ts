import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyJWT } from '@/lib/auth/jwt';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Define Public Paths (No Auth Required)
  const isPublicPath =
    pathname === '/login' ||
    pathname === '/register' ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/_next') ||
    pathname === '/favicon.ico' ||
    pathname === '/'; // Landing page is public? (Assuming yes based on previous context)

  // 2. Try to get token
  const token = request.cookies.get('token')?.value;

  // 3. Verify Token
  let isAuthenticated = false;
  let userRole = '';

  if (token) {
    const payload = await verifyJWT<{ role: string }>(token);
    if (payload) {
      isAuthenticated = true;
      userRole = payload.role;
    }
  }

  // 4. Handle Routing Logic

  // Case A: User is NOT authenticated and tries to access PRIVATE path
  if (!isPublicPath && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    // Add ?from=... to redirect back after login
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Case B: User IS authenticated but tries to access PUBLIC path (like /login)
  // We usually redirect them to dashboard, unless they want to browse landing page?
  // Let's redirect /login to /dashboard if already logged in
  if (isPublicPath && isAuthenticated && pathname === '/login') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Case C: RBAC - Role Based Access Control
  if (isAuthenticated) {
    if (pathname.startsWith('/lead') && userRole !== 'lead' && userRole !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    if (pathname.startsWith('/tester') && userRole !== 'tester' && userRole !== 'admin' && userRole !== 'lead') {
      // Lead can probably view tester stuff? Safe to deny for now unless specified.
      // Previously logic was deny.
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    if (pathname.startsWith('/admin') && userRole !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Verify we match everything except static assets
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
