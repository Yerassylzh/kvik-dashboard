"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/auth.store";

interface MediaSrcState {
  /** URL safe to pass to <img>/<audio>/<video> (blob object URL or the original). */
  src: string | null;
  /** True while the credentialed fetch is in flight. */
  loading: boolean;
  /** True only when the media could not be loaded at all. */
  failed: boolean;
}

/**
 * Loads inbox media through a credentialed fetch (session cookie +
 * bearer token) and exposes it as a blob object URL.
 *
 * Media endpoints require authentication, and plain tag navigation
 * (<img src> / <audio> / <video>) sends no auth — tags would 401 while
 * fetch succeeds. Routing through fetch + object URL makes display and
 * playback work in the same auth context as document downloads.
 *
 * On fetch failure (e.g. already-public CDN files behind redirects) the
 * original URL is returned so native tag loading can still try.
 */
export function useMediaObjectSrc(url: string | undefined | null): MediaSrcState {
  const [state, setState] = useState<MediaSrcState>({
    src: null,
    loading: Boolean(url),
    failed: false,
  });

  useEffect(() => {
    if (!url) {
      queueMicrotask(() => {
        setState({ src: null, loading: false, failed: false });
      });
      return;
    }

    let created: string | null = null;
    let cancelled = false;

    queueMicrotask(() => {
      setState({ src: null, loading: true, failed: false });
    });

    (async () => {
      try {
        const token = useAuthStore.getState().accessToken;
        const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
        const response = await fetch(url, { credentials: "include", headers });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const blob = await response.blob();
        if (cancelled) return;
        created = URL.createObjectURL(blob);
        setState({ src: created, loading: false, failed: false });
      } catch {
        if (!cancelled) {
          // Fallback: hand the native URL to the tag; onError in the
          // component will surface the unavailable state if this fails.
          setState({ src: url, loading: false, failed: false });
        }
      }
    })();

    return () => {
      cancelled = true;
      if (created) URL.revokeObjectURL(created);
    };
  }, [url]);

  return state;
}
