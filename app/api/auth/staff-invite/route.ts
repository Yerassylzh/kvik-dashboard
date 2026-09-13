import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000';

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get('token') || '';
    const backendRes = await fetch(`${BACKEND_URL}/auth/staff-invite?token=${encodeURIComponent(token)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
      },
    });

    const data = await backendRes.json();
    return NextResponse.json(data, { status: backendRes.status });
  } catch (error) {
    console.error('Staff invite validation proxy error:', error);
    return NextResponse.json(
      { message: 'Unable to connect to authentication server' },
      { status: 502 }
    );
  }
}
