import { create } from 'zustand';
import { User, SystemRole, StaffProfileSummary } from '@/types/auth';

const SESSION_KEY = 'kvik_pending_verification_email';
const ROLE_COOKIE_KEY = 'kvik_role';
const ROLE_STORAGE_KEY = 'kvik_user_role';
const TOKEN_STORAGE_KEY = 'kvik_access_token';

export function decodeJwtPayload(token: string): { role?: SystemRole; sub?: string; staffMemberId?: string } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = payload + '='.repeat((4 - (payload.length % 4)) % 4);
    if (typeof atob === 'function') {
      return JSON.parse(atob(padded));
    }
    return null;
  } catch {
    return null;
  }
}

function loadInitialAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

function saveCachedAccessToken(token: string | null) {
  if (typeof window === 'undefined') return;
  try {
    if (token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
      document.cookie = `kvik_token=${token}; path=/; max-age=2592000; SameSite=Lax`;
    } else {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      document.cookie = `kvik_token=; path=/; max-age=0; SameSite=Lax`;
    }
  } catch {
    // ignore
  }
}

export function getCachedSystemRole(): SystemRole | null {
  if (typeof window === 'undefined') return null;
  try {
    const fromStorage = localStorage.getItem(ROLE_STORAGE_KEY) as SystemRole | null;
    if (fromStorage && ['OWNER', 'ADMIN_MANAGER', 'SPECIALIST'].includes(fromStorage)) {
      return fromStorage;
    }
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (token) {
      const payload = decodeJwtPayload(token);
      if (payload?.role && ['OWNER', 'ADMIN_MANAGER', 'SPECIALIST'].includes(payload.role)) {
        return payload.role;
      }
    }
    const match = document.cookie.match(new RegExp('(^| )' + ROLE_COOKIE_KEY + '=([^;]+)'));
    if (match && ['OWNER', 'ADMIN_MANAGER', 'SPECIALIST'].includes(match[2])) {
      return decodeURIComponent(match[2]) as SystemRole;
    }
  } catch {
    // ignore
  }
  return null;
}

export function saveCachedSystemRole(role: SystemRole | null) {
  if (typeof window === 'undefined') return;
  try {
    if (role) {
      localStorage.setItem(ROLE_STORAGE_KEY, role);
      document.cookie = `${ROLE_COOKIE_KEY}=${role}; path=/; max-age=2592000; SameSite=Lax`;
    } else {
      localStorage.removeItem(ROLE_STORAGE_KEY);
      document.cookie = `${ROLE_COOKIE_KEY}=; path=/; max-age=0; SameSite=Lax`;
    }
  } catch {
    // ignore
  }
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  /** Email awaiting OTP verification after registration. Persisted in sessionStorage. */
  pendingVerificationEmail: string | null;
  setAccessToken: (token: string | null) => void;
  setTokens: (accessToken: string, refreshToken?: string) => void;
  setUser: (user: User | null) => void;
  setAuth: (user: User, accessToken: string) => void;
  updateWorkspaceContext: (params: {
    workspace: { id: string; name: string };
    role: SystemRole;
    staffProfile?: StaffProfileSummary | null;
    accessToken: string;
  }) => void;
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
  accessToken: loadInitialAccessToken(),
  isLoading: true,
  isAuthenticated: Boolean(loadInitialAccessToken()),
  pendingVerificationEmail: loadPendingEmail(),

  setAccessToken: (token: string | null) => {
    saveCachedAccessToken(token);
    if (token) {
      const payload = decodeJwtPayload(token);
      if (payload?.role) {
        saveCachedSystemRole(payload.role);
      }
    }
    set((state) => ({
      accessToken: token,
      isAuthenticated: Boolean(token || state.user),
    }));
  },

  setTokens: (accessToken: string, refreshToken?: string) => {
    saveCachedAccessToken(accessToken);
    if (accessToken) {
      const payload = decodeJwtPayload(accessToken);
      if (payload?.role) {
        saveCachedSystemRole(payload.role);
      }
    }
    if (typeof window !== 'undefined' && refreshToken) {
      try {
        document.cookie = `refresh_token=${refreshToken}; path=/; max-age=2592000; SameSite=Lax`;
      } catch {
        // ignore
      }
    }
    set({
      accessToken,
      isAuthenticated: true,
      isLoading: false,
    });
  },

  setUser: (user: User | null) => {
    let role = user?.role || user?.staffProfile?.systemRole || null;
    if (!role && user) {
      const token = useAuthStore.getState().accessToken;
      if (token) {
        const payload = decodeJwtPayload(token);
        if (payload?.role) {
          role = payload.role;
        }
      }
    }
    const finalUser = user ? { ...user, role: role || user.role || 'OWNER' } : null;
    saveCachedSystemRole(role || finalUser?.role || null);
    set((state) => ({
      user: finalUser,
      isAuthenticated: Boolean(state.accessToken || finalUser),
    }));
  },

  setAuth: (user: User, accessToken: string) => {
    let role = user?.role || user?.staffProfile?.systemRole || null;
    if (!role && accessToken) {
      const payload = decodeJwtPayload(accessToken);
      if (payload?.role) {
        role = payload.role;
      }
    }
    const finalUser = { ...user, role: role || user.role || 'OWNER' };
    saveCachedSystemRole(role || finalUser.role);
    saveCachedAccessToken(accessToken);
    set({
      user: finalUser,
      accessToken,
      isAuthenticated: true,
      isLoading: false,
    });
  },

  updateWorkspaceContext: ({ workspace, role, staffProfile, accessToken }) => {
    saveCachedSystemRole(role);
    saveCachedAccessToken(accessToken);
    set((state) => {
      const updatedUser: User | null = state.user
        ? {
            ...state.user,
            role,
            staffProfile: staffProfile ?? state.user.staffProfile,
            workspace: {
              ...(state.user.workspace || {
                knowledgeConfirmed: true,
                qualificationRulesSet: true,
                isActive: true,
                vipRequested: false,
                plan: 'PRO',
              }),
              id: workspace.id,
              name: workspace.name,
            },
          }
        : null;

      return {
        user: updatedUser,
        accessToken,
        isAuthenticated: true,
        isLoading: false,
      };
    });
  },

  clearAuth: () => {
    saveCachedSystemRole(null);
    saveCachedAccessToken(null);
    set({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },

  setLoading: (isLoading: boolean) => set({ isLoading }),

  setPendingVerificationEmail: (email: string | null) => {
    savePendingEmail(email);
    set({ pendingVerificationEmail: email });
  },
}));
