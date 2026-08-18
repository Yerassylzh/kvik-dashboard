'use client';

import { useCallback, useEffect } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { loginApi, registerApi, logoutApi, refreshApi, getMeApi } from '@/lib/api/auth';
import { LoginDto, RegisterDto } from '@/types/auth';

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
        setAuth(res.user, res.access_token);
        return res;
      } catch (error) {
        clearAuth();
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [setAuth, clearAuth, setLoading]
  );

  const register = useCallback(
    async (dto: RegisterDto) => {
      setLoading(true);
      try {
        const res = await registerApi(dto);
        setAuth(res.user, res.access_token);
        return res;
      } catch (error) {
        clearAuth();
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [setAuth, clearAuth, setLoading]
  );

  const logout = useCallback(async () => {
    setLoading(true);
    try {
      await logoutApi();
    } catch {
      // Ignore logout errors
    } finally {
      clearAuth();
    }
  }, [clearAuth, setLoading]);

  const checkAuth = useCallback(async () => {
    if (accessToken && user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const refreshRes = await refreshApi();
      setAccessToken(refreshRes.access_token);
      const userData = await getMeApi();
      setUser(userData);
    } catch {
      clearAuth();
      if (typeof window !== 'undefined') {
        const pathname = window.location.pathname;
        if (!pathname.startsWith('/login') && !pathname.startsWith('/register')) {
          const from = encodeURIComponent(pathname + window.location.search);
          window.location.href = `/login?from=${from}`;
        }
      }
    } finally {
      setLoading(false);
    }
  }, [accessToken, user, setAccessToken, setUser, clearAuth, setLoading]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

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
