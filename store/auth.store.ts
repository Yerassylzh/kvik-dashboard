import { create } from 'zustand';
import { User } from '@/types/auth';

const SESSION_KEY = 'kvik_pending_verification_email';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  /** Email awaiting OTP verification after registration. Persisted in sessionStorage. */
  pendingVerificationEmail: string | null;
  setAccessToken: (token: string | null) => void;
  setUser: (user: User | null) => void;
  setAuth: (user: User, accessToken: string) => void;
  clearAuth: () => void;
  setLoading: (isLoading: boolean) => void;
  setPendingVerificationEmail: (email: string | null) => void;
}

function loadPendingEmail(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return sessionStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
}

function savePendingEmail(email: string | null) {
  if (typeof window === 'undefined') return;
  try {
    if (email) {
      sessionStorage.setItem(SESSION_KEY, email);
    } else {
      sessionStorage.removeItem(SESSION_KEY);
    }
  } catch {
    // ignore
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isLoading: true,
  isAuthenticated: false,
  pendingVerificationEmail: loadPendingEmail(),

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

  setPendingVerificationEmail: (email: string | null) => {
    savePendingEmail(email);
    set({ pendingVerificationEmail: email });
  },
}));
