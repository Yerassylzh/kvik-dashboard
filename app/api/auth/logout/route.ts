import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000';

export async function POST(request: NextRequest) {
  try {
    const cookie = request.headers.get('cookie') || '';
    const authHeader = request.headers.get('authorization') || '';

    const backendRes = await fetch(`${BACKEND_URL}/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookie,
        Authorization: authHeader,
      },
    });

    const data = await backendRes.json().catch(() => ({ message: 'Logged out' }));
    const response = NextResponse.json(data, { status: backendRes.status });

    const setCookie = backendRes.headers.get('set-cookie');
    if (setCookie) {
      response.headers.set('set-cookie', setCookie);
    }

    return response;
  } catch (error) {
    console.error('Logout proxy error:', error);
    return NextResponse.json({ message: 'Logged out locally' }, { status: 200 });
  }
}
