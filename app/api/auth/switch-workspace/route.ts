import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': 'true',
    };

    const authHeader = request.headers.get('authorization');
    if (authHeader) {
      headers['authorization'] = authHeader;
    }

    const cookieHeader = request.headers.get('cookie');
    if (cookieHeader) {
      headers['cookie'] = cookieHeader;
    }

    const backendRes = await fetch(`${BACKEND_URL}/auth/switch-workspace`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    const data = await backendRes.json();
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

    return response;
  } catch (error) {
    console.error('Switch workspace proxy error:', error);
    return NextResponse.json(
      { message: 'Unable to connect to authentication server' },
      { status: 502 }
    );
  }
}
