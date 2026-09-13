'use client';

import React from 'react';
import { useRBAC } from '@/hooks/useRBAC';
import { SystemRole } from '@/types/auth';

interface RoleGateProps {
  allowedRoles: SystemRole[];
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function RoleGate({ allowedRoles, fallback = null, children }: RoleGateProps) {
  const { systemRole } = useRBAC();

  if (!allowedRoles.includes(systemRole)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
