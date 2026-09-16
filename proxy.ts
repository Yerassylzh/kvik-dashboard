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

  // 3. Backward-compatibility canonical redirects
  if (pathname === '/bookings' || pathname.startsWith('/bookings/')) {
    const newPath = pathname.replace(/^\/bookings/, '/calendar') || '/calendar';
    return NextResponse.redirect(new URL(newPath, request.url));
  }

  if (pathname === '/knowledge-base' || pathname.startsWith('/knowledge-base/')) {
    const newPath = pathname.replace(/^\/knowledge-base/, '/ai-studio') || '/ai-studio';
    return NextResponse.redirect(new URL(newPath, request.url));
  }

  if (pathname === '/leads' || pathname.startsWith('/leads/')) {
    const newPath = pathname.replace(/^\/leads/, '/clients') || '/clients';
    return NextResponse.redirect(new URL(newPath, request.url));
  }

  // 4. Public OAuth Callbacks (always allow through so popup can postMessage code to opener)
  const isCallbackPage =
    pathname === '/onboarding/whatsapp-callback' ||
    pathname === '/onboarding/instagram-callback' ||
    pathname.startsWith('/onboarding/whatsapp-callback/') ||
    pathname.startsWith('/onboarding/instagram-callback/');

  if (isCallbackPage) {
    return NextResponse.next();
  }

  // 5. Public Auth Pages: /login and /register
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

  // 6. ALL OTHER PAGES ARE PROTECTED (Auth Guard)
  if (!hasRefreshCookie) {
    const loginUrl = new URL('/login', request.url);
    if (pathname !== '/') {
      loginUrl.searchParams.set('from', pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  // 7. Role-Based Route Guards (Proxy Level)
  const roleCookie = request.cookies.get('kvik_role')?.value;
  if (roleCookie === 'SPECIALIST') {
    const isRestrictedForSpecialist =
      pathname === '/ai-studio' ||
      pathname.startsWith('/ai-studio/') ||
      pathname === '/automations' ||
      pathname.startsWith('/automations/') ||
      pathname === '/insights' ||
      pathname.startsWith('/insights/') ||
      pathname === '/schedule' ||
      pathname.startsWith('/schedule/') ||
      pathname === '/integrations' ||
      pathname.startsWith('/integrations/') ||
      pathname === '/settings/workspace' ||
      pathname === '/settings/staff' ||
      pathname === '/settings/channels' ||
      pathname === '/settings/advanced';

    if (isRestrictedForSpecialist) {
      return NextResponse.redirect(new URL('/calendar', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
