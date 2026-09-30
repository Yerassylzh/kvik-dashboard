'use client';

import { useSyncExternalStore } from 'react';
import { useAuthStore, getCachedSystemRole, decodeJwtPayload } from '@/store/auth.store';
import { SystemRole } from '@/types/auth';

const emptySubscribe = () => () => {};

export function useRBAC() {
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const isMounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const tokenRole = accessToken ? decodeJwtPayload(accessToken)?.role : null;

  // Synchronously resolve system role from active user, JWT token payload, cached role, or default to OWNER
  const systemRole: SystemRole =
    user?.role ||
    user?.staffProfile?.systemRole ||
    tokenRole ||
    (isMounted ? getCachedSystemRole() : null) ||
    'OWNER';

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
    isMounted,
    isOwner,
    isAdminManager,
    isSpecialist,
    isAdminOrOwner,
    canAccessSettingsTab,
    canAccessNavRoute,
  };
}
