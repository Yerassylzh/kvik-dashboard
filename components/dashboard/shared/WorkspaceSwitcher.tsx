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
      <div className="mx-0.5 px-3 py-2 rounded-xl bg-muted/40 border border-border/60 text-xs flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-2 min-w-0">
          <Building2 className="w-3.5 h-3.5 text-primary shrink-0" />
          <span className="text-foreground font-semibold truncate text-xs">
            {user?.workspace?.name || t('workspace_switcher.no_workspace')}
          </span>
        </div>
        {user?.role && (
          <span className="text-[10px] font-semibold text-muted-foreground shrink-0 ml-2">
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
    <div ref={ref} className="relative mx-0.5">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full px-3 py-2 rounded-xl bg-muted/40 border border-border/60 text-xs flex items-center justify-between shadow-2xs hover:bg-muted/60 hover:border-border transition-all cursor-pointer"
      >
        <div className="flex items-center gap-2 min-w-0">
          <Building2 className="w-3.5 h-3.5 text-primary shrink-0" />
          <span className="text-foreground font-semibold truncate">
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
        <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-card border border-border/80 rounded-xl shadow-lg py-1.5 text-xs">
          <p className="px-3.5 pb-1.5 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold border-b border-border/40 mb-1">
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
                  'flex items-center justify-between gap-2 w-full px-3.5 py-2 text-left transition-colors',
                  isActive
                    ? 'bg-primary/5 text-foreground'
                    : 'hover:bg-muted/60 text-muted-foreground hover:text-foreground'
                )}
              >
                <div className="min-w-0">
                  <p className={clsx('font-semibold truncate', isActive && 'text-foreground')}>
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
