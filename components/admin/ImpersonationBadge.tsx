'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/store/auth.store';
import { ShieldCheck, ExternalLink, Building2, Hash, Copy, Check } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

export function ImpersonationBadge() {
  const t = useTranslations('common');
  const user = useAuthStore((s) => s.user);
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!user?.isSuperAdmin) {
    return null;
  }

  const workspace = user.workspace;
  const workspaceName = workspace?.name || t('god_mode.workspace_fallback');
  const workspaceId = workspace?.id || '—';

  const handleCopyId = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!workspace?.id) return;
    navigator.clipboard.writeText(workspace.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExit = (e: React.MouseEvent) => {
    e.stopPropagation();
    const adminUrl = process.env.NEXT_PUBLIC_ADMIN_URL || 'http://localhost:3001';
    /* eslint-disable-next-line @next/next/no-location-assign-relative-destination */
    window.location.assign(`${adminUrl}/workspaces`);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        className="relative inline-flex items-center"
      >
        <PopoverTrigger asChild>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30 text-[11px] font-bold transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500/30"
            aria-label={t('superadmin.badge')}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
            <span className="font-semibold tracking-tight text-[11px]">
              {t('superadmin.badge')}
            </span>
          </button>
        </PopoverTrigger>

        <PopoverContent
          side="bottom"
          align="end"
          sideOffset={6}
          className="w-72 p-3.5 space-y-3 bg-card border-border/80 shadow-xl rounded-2xl text-xs z-50"
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
        >
          {/* Header */}
          <div className="flex items-center gap-2 border-b border-border/60 pb-2">
            <div className="w-6 h-6 rounded-md bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="min-w-0">
              <div className="font-bold text-foreground text-xs leading-none">
                {t('superadmin.tooltip_title')}
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5">
                {t('superadmin.tooltip_desc')}
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-2 text-[11px]">
            {/* Workspace Name */}
            <div className="flex items-start gap-2 bg-muted/40 p-2 rounded-xl border border-border/50">
              <Building2 className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
              <div className="min-w-0">
                <span className="text-muted-foreground block text-[10px]">
                  {t('superadmin.workspace_name')}
                </span>
                <span className="font-semibold text-foreground truncate block">
                  {workspaceName}
                </span>
              </div>
            </div>

            {/* Workspace ID */}
            <div className="flex items-start justify-between gap-2 bg-muted/40 p-2 rounded-xl border border-border/50">
              <div className="flex items-start gap-2 min-w-0">
                <Hash className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <span className="text-muted-foreground block text-[10px]">
                    {t('superadmin.workspace_id')}
                  </span>
                  <code className="font-mono text-[10.5px] text-foreground select-all break-all block tabular-nums">
                    {workspaceId}
                  </code>
                </div>
              </div>

              {workspace?.id && (
                <button
                  type="button"
                  onClick={handleCopyId}
                  title={copied ? t('superadmin.copied') : 'Copy ID'}
                  className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0 mt-0.5 cursor-pointer"
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Action Button */}
          <button
            type="button"
            onClick={handleExit}
            className="w-full bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-bold px-3 py-1.5 rounded-xl text-xs transition inline-flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-400/50"
          >
            <span>{t('superadmin.exit_btn')}</span>
            <ExternalLink className="w-3.5 h-3.5 shrink-0" />
          </button>
        </PopoverContent>
      </div>
    </Popover>
  );
}
