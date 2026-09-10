"use client";

import { useCallback } from "react";
import { useAuthStore } from "@/store/auth.store";
import { useOnboardingStore } from "@/store/onboarding.store";
import {
  loginApi,
  registerApi,
  logoutApi,
  getMeApi,
} from "@/lib/api/auth";
import { getOrRefreshToken } from "@/lib/api/client";
import { LoginDto, RegisterDto } from "@/types/auth";

/**
 * App-level singleton refresh promise.
 * Prevents concurrent refresh/checkAuth calls from racing each other.
 * Lives at module scope so it persists across component re-renders.
 */
let checkAuthPromise: Promise<void> | null = null;

export function useAuth() {
  const {
    user,
    accessToken,
    isAuthenticated,
    isLoading,
    setAuth,
    setAccessToken,
    setUser,
    clearAuth,
    setLoading,
  } = useAuthStore();

  const login = useCallback(
    async (dto: LoginDto) => {
      setLoading(true);
      try {
        const res = await loginApi(dto);
        useOnboardingStore.getState().resetOnboarding();
        setAuth(res.user, res.access_token);
        return res;
      } catch (error) {
        clearAuth();
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [setAuth, clearAuth, setLoading],
  );

  const register = useCallback(
    async (dto: RegisterDto) => {
      setLoading(true);
      try {
        const res = await registerApi(dto);
        useOnboardingStore.getState().resetOnboarding();
        setAuth(res.user, res.access_token);
        return res;
      } catch (error) {
        clearAuth();
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [setAuth, clearAuth, setLoading],
  );

  const logout = useCallback(async () => {
    setLoading(true);
    try {
      await logoutApi();
    } catch {
      // Ignore logout errors
    } finally {
      useOnboardingStore.getState().resetOnboarding();
      clearAuth();
    }
  }, [clearAuth, setLoading]);

  const checkAuth = useCallback(async () => {
    // Exempt OAuth popup callbacks — they don't need an auth check
    if (
      typeof window !== "undefined" &&
      window.location.pathname.includes("callback")
    ) {
      setLoading(false);
      return;
    }

    // Read current auth state DIRECTLY from store (not closure) to avoid stale values
    const state = useAuthStore.getState();
    if (state.accessToken && state.user) {
      // Already authenticated in store — just ensure loading is cleared
      setLoading(false);
      return;
    }

    // If another concurrent checkAuth is already in flight, piggyback on it
    if (checkAuthPromise) {
      return checkAuthPromise;
    }

    checkAuthPromise = (async () => {
      setLoading(true);
      try {
        const token = await getOrRefreshToken();
        useAuthStore.getState().setAccessToken(token);
        const userData = await getMeApi();
        useAuthStore.getState().setUser(userData);
      } catch {
        useOnboardingStore.getState().resetOnboarding();
        useAuthStore.getState().clearAuth();

        if (typeof window !== "undefined") {
          const pathname = window.location.pathname;
          const isPublicPath =
            pathname.startsWith("/login") ||
            pathname.startsWith("/register") ||
            pathname.includes("callback");

          if (!isPublicPath) {
            const from = encodeURIComponent(
              pathname + window.location.search,
            );
            window.location.href = `/login?from=${from}`;
          }
        }
      } finally {
        setLoading(false);
        checkAuthPromise = null;
      }
    })();

    return checkAuthPromise;
  }, [setLoading]);

  return {
    user,
    accessToken,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    checkAuth,
  };
}
