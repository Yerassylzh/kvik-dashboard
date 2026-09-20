import { create } from 'zustand';
import { User, SystemRole, StaffProfileSummary } from '@/types/auth';

const SESSION_KEY = 'kvik_pending_verification_email';
const ROLE_COOKIE_KEY = 'kvik_role';
const ROLE_STORAGE_KEY = 'kvik_user_role';

export function getCachedSystemRole(): SystemRole | null {
  if (typeof window === 'undefined') return null;
  try {
    const fromStorage = localStorage.getItem(ROLE_STORAGE_KEY) as SystemRole | null;
    if (fromStorage && ['OWNER', 'ADMIN_MANAGER', 'SPECIALIST'].includes(fromStorage)) {
      return fromStorage;
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
  accessToken: null,
  isLoading: true,
  isAuthenticated: false,
  pendingVerificationEmail: loadPendingEmail(),

  setAccessToken: (token: string | null) =>
    set((state) => ({
      accessToken: token,
      isAuthenticated: Boolean(token || state.user),
    })),

  setUser: (user: User | null) => {
    const role = user?.role || user?.staffProfile?.systemRole || null;
    saveCachedSystemRole(role);
    set((state) => ({
      user,
      isAuthenticated: Boolean(state.accessToken || user),
    }));
  },

  setAuth: (user: User, accessToken: string) => {
    const role = user?.role || user?.staffProfile?.systemRole || null;
    saveCachedSystemRole(role);
    set({
      user,
      accessToken,
      isAuthenticated: true,
      isLoading: false,
    });
  },

  updateWorkspaceContext: ({ workspace, role, staffProfile, accessToken }) => {
    saveCachedSystemRole(role);
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
