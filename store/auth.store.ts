import { create } from 'zustand';
import { User } from '@/types/auth';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setAccessToken: (token: string | null) => void;
  setUser: (user: User | null) => void;
  setAuth: (user: User, accessToken: string) => void;
  clearAuth: () => void;
  setLoading: (isLoading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isLoading: true,
  isAuthenticated: false,

  setAccessToken: (token: string | null) =>
    set((state) => ({
      accessToken: token,
      isAuthenticated: Boolean(token || state.user),
    })),

  setUser: (user: User | null) =>
    set((state) => ({
      user,
      isAuthenticated: Boolean(state.accessToken || user),
    })),

  setAuth: (user: User, accessToken: string) =>
    set({
      user,
      accessToken,
      isAuthenticated: true,
      isLoading: false,
    }),

  clearAuth: () =>
    set({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
    }),

  setLoading: (isLoading: boolean) => set({ isLoading }),
}));
