import { NextRequest, NextResponse } from 'next/server';

const rawBackendUrl = process.env.BACKEND_URL || 'http://localhost:4000';
const BACKEND_URL = rawBackendUrl.replace(/\/+$/, '');

const HOP_BY_HOP_HEADERS = new Set([
  'content-encoding',
  'content-length',
  'transfer-encoding',
  'connection',
  'keep-alive',
]);

async function handleProxy(request: NextRequest, params: { proxy: string[] }) {
  const path = params.proxy ? params.proxy.join('/') : '';
  const searchParams = request.nextUrl.search;
  const targetUrl = `${BACKEND_URL}/${path}${searchParams}`;

  const headers = new Headers(request.headers);
  headers.delete('host');
  headers.delete('connection');
  headers.set('ngrok-skip-browser-warning', 'true');

  let body: BodyInit | undefined = undefined;
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('multipart/form-data') || contentType.includes('application/octet-stream')) {
      body = await request.arrayBuffer();
    } else {
      body = await request.text();
    }
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
      if (!HOP_BY_HOP_HEADERS.has(key.toLowerCase())) {
        response.headers.set(key, value);
      }
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
