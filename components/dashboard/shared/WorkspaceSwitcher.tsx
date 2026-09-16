'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Building2, ChevronDown, Check, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import clsx from 'clsx';
import { useAuth } from '@/hooks/useAuth';
import type { AvailableWorkspace } from '@/types/auth';

export function WorkspaceSwitcher() {
  const t = useTranslations('dashboard');
  const { user, switchWorkspace } = useAuth();
  const [open, setOpen] = useState(false);
  const [switching, setSwitching] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  const roleLabels: Record<string, string> = {
    OWNER: t('staff.role_owner'),
    ADMIN_MANAGER: t('staff.role_admin_manager'),
    SPECIALIST: t('staff.role_specialist'),
  };

  const workspaces = user?.availableWorkspaces || [];
  const activeWorkspaceId = user?.workspace?.id;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Only one workspace — render as plain badge
  if (workspaces.length <= 1) {
    return (
      <div className="px-2.5 py-1.5 rounded-lg bg-card border border-border/80 text-xs flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <Building2 className="w-3.5 h-3.5 text-primary shrink-0" />
          <span className="text-foreground font-medium truncate text-xs">
            {user?.workspace?.name || t('workspace_switcher.no_workspace')}
          </span>
        </div>
        {user?.role && (
          <span className="text-[10px] font-medium text-muted-foreground shrink-0 ml-1.5">
            {roleLabels[user.role] || user.role}
          </span>
        )}
      </div>
    );
  }

  const activeWs = workspaces.find((w) => w.workspaceId === activeWorkspaceId);

  const handleSwitch = async (ws: AvailableWorkspace) => {
    if (ws.workspaceId === activeWorkspaceId) {
      setOpen(false);
      return;
    }
    setSwitching(ws.workspaceId);
    try {
      await switchWorkspace({ workspaceId: ws.workspaceId });
    } catch {
      // Error handled upstream
    } finally {
      setSwitching(null);
      setOpen(false);
    }
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full px-2.5 py-1.5 rounded-lg bg-card border border-border/80 text-xs flex items-center justify-between hover:border-zinc-300 transition-all cursor-pointer"
      >
        <div className="flex items-center gap-2 min-w-0">
          <Building2 className="w-3.5 h-3.5 text-primary shrink-0" />
          <span className="text-foreground font-medium truncate">
            {activeWs?.workspaceName || user?.workspace?.name || t('workspace_switcher.no_workspace')}
          </span>
        </div>
        <ChevronDown
          className={clsx(
            'w-3.5 h-3.5 text-muted-foreground shrink-0 transition-transform duration-200',
            open && 'rotate-180'
          )}
        />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-card border border-border/90 rounded-lg shadow-sm py-1 text-xs">
          <p className="px-3 py-1 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold border-b border-border/40 mb-0.5">
            {t('workspace_switcher.switch_label')}
          </p>

          {workspaces.map((ws) => {
            const isActive = ws.workspaceId === activeWorkspaceId;
            const isLoading = switching === ws.workspaceId;

            return (
              <button
                key={ws.workspaceId}
                type="button"
                disabled={isLoading}
                onClick={() => handleSwitch(ws)}
                className={clsx(
                  'flex items-center justify-between gap-2 w-full px-3 py-1.5 text-left transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary font-semibold'
                    : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                )}
              >
                <div className="min-w-0">
                  <p className={clsx('font-medium truncate', isActive && 'text-primary font-semibold')}>
                    {ws.workspaceName}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {roleLabels[ws.role] || ws.role}
                  </p>
                </div>

                {isLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-primary shrink-0" />
                ) : isActive ? (
                  <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                ) : null}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
