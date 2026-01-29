import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyJWT } from '@/lib/auth/jwt';

// Paths that require authentication
const PROTECTED_PATHS = ['/(protected)'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the path matches any protected patterns
  // Note: Simple check for now, can be expanded with regex if needed
  // For this project scope, we assume route groups or specific prefixes
  // e.g., if you place dashboard under /dashboard, add it here or use Matcher config

  // Actually, the common pattern is to use the config matcher to filter routes 
  // and then check auth here.

  const token = request.cookies.get('token')?.value;

  // Logic: 
  // 1. If user has no token and tries to access protected route -> Redirect to login
  // 2. If user has token -> Verify it. If invalid -> Redirect to login.

  // For 'teamboard', let's assume anything NOT public requires auth?
  // Or explicitly protect specific routes. The prompt asked to protect `/(protected)`.
  // Since we can't easily adhere to route groups in URL matching without knowing the final URL structure (route groups valid in FS, not URL),
  // we will assume we protect common paths or check if the matcher captures it.

  // Let's verify token if it exists.
  let isAuthenticated = false;
  if (token) {
    const payload = await verifyJWT(token);
    if (payload) {
      isAuthenticated = true;
    }
  }

  // If request is for a protected route (which we will define via config matcher usually)
  // But inside middleware logic we can also check.
  // The User Request said: "Protect all routes under: /(protected)"
  // However, route groups like (protected) do not appear in the URL.
  // So we assume the user puts protected pages inside app/(protected)/... 
  // which means the URL will be /dashboard, /settings etc.
  // We need a way to know WHICH URLs are protected.
  // For now, I will assume a convention or just enforce auth on everything except /login and public assets.

  // STRATEGY: Allow list approach is safer.
  // Allow public paths
  const publicPaths = ['/login', '/api/auth/login', '/_next', '/favicon.ico'];
  const isPublic = publicPaths.some(path => pathname.startsWith(path));

  if (isPublic) {
    return NextResponse.next();
  }

  if (!isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // RBAC for protected routes
  // We need to decode the token payload to check role
  // verifyJWT returns the payload if valid
  const payload = await verifyJWT(token!); // validated above in verifyJWT

  if (payload && typeof payload === 'object' && 'role' in payload) {
    const role = payload.role as string;

    // Protect /lead routes
    if (pathname.startsWith('/lead') && role !== 'lead' && role !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url)); // Access Denied -> Home
    }

    // Protect /tester routes
    if (pathname.startsWith('/tester') && role !== 'tester' && role !== 'admin' && role !== 'lead') {
      // Lead might view tester pages? Maybe. But strictly:
      // Prompt says "Tester Role... Activities... Profile".
      // Let's allow Admin always. Lead? Maybe not needed if they have their own dashboard.
      // Let's restrict to Tester + Admin for now to be safe.
      // Actually, for easy debugging/demos, Admin often needs all.
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all request paths except for the ones starting with:
    // - api (API routes) -> Actually we WANT to protect API routes too usually, except auth
    // - _next/static (static files)
    // - _next/image (image optimization files)
    // - favicon.ico (favicon file)
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
