'use client';

import { useAuthStore, getCachedSystemRole } from '@/store/auth.store';
import { SystemRole } from '@/types/auth';

export function useRBAC() {
  const user = useAuthStore((state) => state.user);

  // Synchronously resolve system role from active user, cached role in localStorage/cookie, or safe fallback
  const systemRole: SystemRole =
    user?.role ||
    user?.staffProfile?.systemRole ||
    getCachedSystemRole() ||
    'SPECIALIST';

  const isOwner = systemRole === 'OWNER';
  const isAdminManager = systemRole === 'ADMIN_MANAGER';
  const isSpecialist = systemRole === 'SPECIALIST';
  const isAdminOrOwner = isOwner || isAdminManager;

  const canAccessSettingsTab = (tabHref: string): boolean => {
    if (isOwner) return true;

    if (isAdminManager) {
      // Admin manager can access staff, channels, ai-agent, business-context, account, advanced
      // But not workspace general ownership or billing
      const restrictedForManager = ['/settings/workspace', '/settings/billing'];
      return !restrictedForManager.includes(tabHref);
    }

    if (isSpecialist) {
      // Specialist can only access account settings
      return tabHref === '/settings/account';
    }

    return false;
  };

  const canAccessNavRoute = (routeHref: string): boolean => {
    if (isOwner || isAdminManager) return true;

    if (isSpecialist) {
      // Specialist can access overview, inbox, bookings, and settings/account
      const allowedForSpecialist = ['/overview', '/inbox', '/bookings', '/settings'];
      return allowedForSpecialist.some((allowed) => routeHref.startsWith(allowed));
    }

    return true;
  };

  return {
    systemRole,
    isOwner,
    isAdminManager,
    isSpecialist,
    isAdminOrOwner,
    canAccessSettingsTab,
    canAccessNavRoute,
  };
}
