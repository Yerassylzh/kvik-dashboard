import { cookies } from 'next/headers';

export interface ServerUser {
  id: string;
  email: string;
  workspace?: {
    id: string;
    name: string;
    nicheProfile?: string;
    plan?: string;
    isActive?: boolean;
    step?: string;
  };
}

/**
 * Server-side authentication validator for Next.js Server Components / Layouts.
 * Validates the refresh token directly against the backend and fetches the current user.
 * Returns null if the token is missing, expired, or invalid.
 */
export async function getServerUser(): Promise<ServerUser | null> {
  const cookieStore = await cookies();
  const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000';

  const refreshCookie = cookieStore.get('refresh_token');
  if (!refreshCookie?.value) return null;

  try {
    // Attempt token refresh on the server side
    const refreshRes = await fetch(`${BACKEND_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `refresh_token=${refreshCookie.value}`,
      },
      cache: 'no-store',
    });

    if (!refreshRes.ok) return null;

    const { access_token } = await refreshRes.json();
    if (!access_token) return null;

    const meRes = await fetch(`${BACKEND_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
      cache: 'no-store',
    });

    if (!meRes.ok) return null;

    return await meRes.json();
  } catch (error) {
    console.error('getServerUser error:', error);
    return null;
  }
}
