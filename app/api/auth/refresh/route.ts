import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000';

export async function POST(request: NextRequest) {
  try {
    const cookie = request.headers.get('cookie') || '';

    const backendRes = await fetch(`${BACKEND_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
        Cookie: cookie,
      },
    });

    const data = await backendRes.json().catch(() => ({}));
    const response = NextResponse.json(data, { status: backendRes.status });

    const setCookies = backendRes.headers.getSetCookie?.() || [];
    if (setCookies.length > 0) {
      setCookies.forEach((cookieStr) => {
        response.headers.append('set-cookie', cookieStr);
      });
    } else {
      const singleCookie = backendRes.headers.get('set-cookie');
      if (singleCookie) {
        response.headers.set('set-cookie', singleCookie);
      }
    }

    if (!backendRes.ok && backendRes.status === 401) {
      response.cookies.delete('refresh_token');
    }

    return response;
  } catch (error) {
    console.error('Refresh proxy error:', error);
    return NextResponse.json(
      { message: 'Session refresh failed' },
      { status: 401 }
    );
  }
}
