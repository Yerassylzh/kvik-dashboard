'use client';

import { useAuthStore } from '@/store/auth.store';
import type { TokenPayload } from '@/types/auth';

/**
 * Decodes the JWT access token payload without verification (client-side only).
 * Returns null if no token or decode fails.
 */
function decodeJwtPayload(token: string): TokenPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    // Base64url → base64 → JSON
    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = payload + '='.repeat((4 - (payload.length % 4)) % 4);
    return JSON.parse(atob(padded)) as TokenPayload;
  } catch {
    return null;
  }
}

/**
 * Returns the actorId that mirrors the backend's resolution:
 *   const actorId = user.staffMemberId ?? user.sub;
 *
 * For staff members (SPECIALIST / ADMIN_MANAGER with a staff record in JWT):
 *   actorId = JWT.staffMemberId
 *
 * For owners (or any role without staffMemberId in the JWT):
 *   actorId = JWT.sub  (userId)
 *
 * This MUST be used everywhere the frontend compares against
 * conversation.takenOverByActorId, because that field is set by the backend
 * using the identical expression.
 */
export function useActorId(): string | null {
  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);

  if (accessToken) {
    const payload = decodeJwtPayload(accessToken);
    if (payload) {
      // Mirror backend: staffMemberId ?? sub
      return payload.staffMemberId ?? payload.sub ?? null;
    }
  }

  // Fallback (no token in memory yet — e.g. SSR or initial hydration):
  // staffProfile.id is set for staff members and equals staffMemberId in JWT.
  // For owners without a staffProfile, fall back to user.id.
  // NOTE: This fallback may mismatch for owners who have a staffProfile but whose
  // JWT doesn't include staffMemberId — always prefer the JWT path above.
  return user?.staffProfile?.id ?? user?.id ?? null;
}
