import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization') || '';
    const cookie = request.headers.get('cookie') || '';

    const backendRes = await fetch(`${BACKEND_URL}/auth/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
        Cookie: cookie,
      },
    });

    const data = await backendRes.json();
    return NextResponse.json(data, { status: backendRes.status });
  } catch (error) {
    console.error('GetMe proxy error:', error);
    return NextResponse.json(
      { message: 'Failed to fetch user session' },
      { status: 401 }
    );
  }
}
