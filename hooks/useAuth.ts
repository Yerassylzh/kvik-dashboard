"use client";

import { useCallback } from "react";
import { useAuthStore } from "@/store/auth.store";
import { useOnboardingStore } from "@/store/onboarding.store";
import {
  loginApi,
  registerApi,
  registerStaffApi,
  switchWorkspaceApi,
  logoutApi,
  getMeApi,
} from "@/lib/api/auth";
import { getOrRefreshToken } from "@/lib/api/client";
import { LoginDto, RegisterDto, RegisterStaffDto, SwitchWorkspaceDto } from "@/types/auth";

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
    pendingVerificationEmail,
    setAuth,
    setAccessToken,
    setUser,
    clearAuth,
    setLoading,
    setPendingVerificationEmail,
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
        // Save email so verify-email page can resume after refresh
        if (!res.user.isEmailVerified) {
          setPendingVerificationEmail(res.user.email);
        }
        return res;
      } catch (error) {
        clearAuth();
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [setAuth, clearAuth, setLoading, setPendingVerificationEmail],
  );

  const registerStaff = useCallback(
    async (dto: RegisterStaffDto) => {
      setLoading(true);
      try {
        const res = await registerStaffApi(dto);
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

  const switchWorkspace = useCallback(
    async (dto: SwitchWorkspaceDto) => {
      setLoading(true);
      try {
        const res = await switchWorkspaceApi(dto);
        setAuth(res.user, res.access_token);
        if (typeof window !== 'undefined') {
          // Trigger a hard reload or navigation to ensure all SWR caches and state re-sync with new workspace
          window.location.reload();
        }
        return res;
      } catch (error) {
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [setAuth, setLoading],
  );

  const logout = useCallback(async () => {
    setLoading(true);
    try {
      await logoutApi();
    } catch {
      // Ignore logout errors
    } finally {
      useOnboardingStore.getState().resetOnboarding();
      setPendingVerificationEmail(null);
      clearAuth();
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
  }, [clearAuth, setLoading, setPendingVerificationEmail]);

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
      // If user is explicitly unverified and attempting onboarding or pending verification
      if (state.user.isEmailVerified === false) {
        const pathname = typeof window !== "undefined" ? window.location.pathname : "";
        if (state.pendingVerificationEmail || pathname.startsWith("/onboarding")) {
          if (!pathname.startsWith("/verify-email")) {
            window.location.href = "/verify-email";
          }
        }
      }
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

        // Enforce email verification gate for onboarding and pending verification
        if (userData.isEmailVerified === false) {
          if (typeof window !== "undefined") {
            const pathname = window.location.pathname;
            const pending = useAuthStore.getState().pendingVerificationEmail;
            if (pending || pathname.startsWith("/onboarding")) {
              useAuthStore.getState().setPendingVerificationEmail(userData.email);
              if (!pathname.startsWith("/verify-email")) {
                window.location.href = "/verify-email";
              }
            }
          }
        }
      } catch {
        useOnboardingStore.getState().resetOnboarding();
        useAuthStore.getState().clearAuth();

        if (typeof window !== "undefined") {
          const pathname = window.location.pathname;
          const isPublicPath =
            pathname.startsWith("/login") ||
            pathname.startsWith("/register") ||
            pathname.startsWith("/register-staff") ||
            pathname.startsWith("/forgot-password") ||
            pathname.startsWith("/verify-email") ||
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
    pendingVerificationEmail,
    login,
    register,
    registerStaff,
    switchWorkspace,
    logout,
    checkAuth,
    setPendingVerificationEmail,
  };
}
