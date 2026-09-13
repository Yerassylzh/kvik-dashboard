import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const authHeader = request.headers.get('authorization') || '';
    const cookie = request.headers.get('cookie') || '';

    const backendRes = await fetch(`${BACKEND_URL}/auth/resend-verification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
        Authorization: authHeader,
        Cookie: cookie,
      },
      body: JSON.stringify(body),
    });

    const data = await backendRes.json();
    return NextResponse.json(data, { status: backendRes.status });
  } catch (error) {
    console.error('Resend verification proxy error:', error);
    return NextResponse.json(
      { message: 'Unable to connect to authentication server' },
      { status: 502 }
    );
  }
}
