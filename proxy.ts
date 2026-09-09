import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_PATHS = ['/login', '/register'];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Pass through Next.js internals, API routes, and static assets
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // 2. Canonical redirect: /dashboard -> / (or /dashboard/* -> /*)
  if (pathname === '/dashboard' || pathname.startsWith('/dashboard/')) {
    const newPath = pathname.replace(/^\/dashboard/, '') || '/';
    return NextResponse.redirect(new URL(newPath, request.url));
  }

  // 3. Public OAuth Callbacks (always allow through so popup can postMessage code to opener)
  const isCallbackPage =
    pathname === '/onboarding/whatsapp-callback' ||
    pathname === '/onboarding/instagram-callback' ||
    pathname.startsWith('/onboarding/whatsapp-callback/') ||
    pathname.startsWith('/onboarding/instagram-callback/');

  if (isCallbackPage) {
    return NextResponse.next();
  }

  // 4. Public Auth Pages: /login and /register
  const isPublicAuthPage = PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
  const hasRefreshCookie = request.cookies.has('refresh_token');

  if (isPublicAuthPage) {
    // If the user is already authenticated, redirect away from /login or /register
    if (hasRefreshCookie) {
      const from = request.nextUrl.searchParams.get('from');
      return NextResponse.redirect(new URL(from || '/onboarding', request.url));
    }
    return NextResponse.next();
  }

  // 4. ALL OTHER PAGES ARE PROTECTED
  // Unauthorized users trying to access "/", "/onboarding", or any other route get redirected to /login
  if (!hasRefreshCookie) {
    const loginUrl = new URL('/login', request.url);
    if (pathname !== '/') {
      loginUrl.searchParams.set('from', pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - static public files with extensions
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
