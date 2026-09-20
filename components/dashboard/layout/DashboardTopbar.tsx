'use client';

import React from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Search, Settings } from 'lucide-react';
import { NotificationPopover } from '@/components/dashboard/notifications/NotificationPopover';
import type { User } from '@/types/auth';

interface DashboardTopbarProps {
  title?: string;
  user: User | null;
}

export function DashboardTopbar({ title, user }: DashboardTopbarProps) {
  const t = useTranslations('dashboard');

  return (
    <header className="h-13 border-b border-border/70 px-5 flex items-center justify-between bg-card/90 backdrop-blur-sm shrink-0 z-30">
      <div className="flex items-center gap-3 min-w-0">
        <h2 className="font-semibold text-sm text-foreground truncate">
          {title || t('header.title')}
        </h2>
      </div>

      <div className="hidden sm:flex items-center relative w-64 mx-4">
        <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder={t('header.search_placeholder')}
          className="w-full bg-muted/40 border border-border/70 rounded-lg pl-8 pr-3 py-1 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-all"
        />
      </div>

      {/* Topbar Right Utilities: Notifications Popover, Settings, User Profile */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* Notification Bell Popover */}
        <NotificationPopover />

        {/* Settings Gear */}
        <Link
          href="/settings"
          title={t('header.settings_tooltip')}
          className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          <Settings className="w-4 h-4" />
        </Link>

        <div className="h-4 w-px bg-border/80 mx-1 hidden sm:block" />

        {/* Profile Name & Avatar */}
        <Link
          href="/settings/account"
          className="flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-lg hover:bg-muted/70 transition-colors cursor-pointer"
        >
          <div className="h-6 w-6 rounded-md bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold text-xs shrink-0">
            {(user?.staffProfile?.name || user?.email)?.[0]?.toUpperCase() || 'A'}
          </div>
          <span className="text-xs font-semibold text-foreground max-w-[130px] truncate hidden sm:inline">
            {user?.staffProfile?.name || user?.email?.split('@')[0] || 'Admin'}
          </span>
        </Link>
      </div>
    </header>
  );
}
