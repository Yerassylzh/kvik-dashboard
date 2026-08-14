import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000';

async function handleProxy(request: NextRequest, params: { proxy: string[] }) {
  const path = params.proxy ? params.proxy.join('/') : '';
  const searchParams = request.nextUrl.search;
  const targetUrl = `${BACKEND_URL}/${path}${searchParams}`;

  const headers = new Headers(request.headers);
  headers.delete('host');

  let body: BodyInit | undefined = undefined;
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    body = await request.text();
  }

  try {
    const backendRes = await fetch(targetUrl, {
      method: request.method,
      headers,
      body,
    });

    const resData = await backendRes.arrayBuffer();
    const response = new NextResponse(resData, {
      status: backendRes.status,
      statusText: backendRes.statusText,
    });

    backendRes.headers.forEach((value, key) => {
      response.headers.set(key, value);
    });

    return response;
  } catch (error) {
    console.error(`Proxy error for ${targetUrl}:`, error);
    return NextResponse.json(
      { message: 'Proxy request to backend failed' },
      { status: 502 }
    );
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ proxy: string[] }> }) {
  return handleProxy(request, await params);
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ proxy: string[] }> }) {
  return handleProxy(request, await params);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ proxy: string[] }> }) {
  return handleProxy(request, await params);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ proxy: string[] }> }) {
  return handleProxy(request, await params);
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ proxy: string[] }> }) {
  return handleProxy(request, await params);
}
