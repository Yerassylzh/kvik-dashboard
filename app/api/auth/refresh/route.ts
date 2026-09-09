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

    const data = await backendRes.json();
    const response = NextResponse.json(data, { status: backendRes.status });

    const setCookie = backendRes.headers.get('set-cookie');
    if (setCookie) {
      response.headers.set('set-cookie', setCookie);
    } else if (!backendRes.ok) {
      response.cookies.delete('refresh_token');
    }

    return response;
  } catch (error) {
    console.error('Refresh proxy error:', error);
    const response = NextResponse.json(
      { message: 'Session refresh failed' },
      { status: 401 }
    );
    response.cookies.delete('refresh_token');
    return response;
  }
}
