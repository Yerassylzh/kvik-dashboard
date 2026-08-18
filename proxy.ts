import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_PATHS = ['/login', '/register'];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get('host') || '';
  const isApp = hostname.startsWith('app.');

  // Ignore Next.js internal files, static assets, and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Rewrite app.domain.com/ to app.domain.com/dashboard
  if (isApp && pathname === '/') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Allow public auth pages
  if (PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
    // If user already has refresh cookie and hits /login or /register, let app handle it or proceed
    return NextResponse.next();
  }

  // Protected app routes
  const isProtected = pathname.startsWith('/dashboard') || pathname.startsWith('/onboarding');

  if (isProtected) {
    const hasRefreshCookie = request.cookies.has('refresh_token');

    if (!hasRefreshCookie) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
