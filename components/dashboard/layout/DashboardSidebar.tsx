'use client';

import React from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { LayoutDashboard, HelpCircle, Settings2, LogOut } from 'lucide-react';
import clsx from 'clsx';
import { WorkspaceSwitcher } from '@/components/dashboard/shared/WorkspaceSwitcher';
import { useAuth } from '@/hooks/useAuth';
import type { SystemRole } from '@/types/auth';

export interface NavItem {
  href: string;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  roles: readonly SystemRole[] | SystemRole[];
}

export interface NavCluster {
  clusterKey: 'nav.group_operations' | 'nav.group_ai_growth' | 'nav.group_governance';
  items: NavItem[];
}

interface DashboardSidebarProps {
  pathname: string;
  navClusters: NavCluster[];
  systemRole: SystemRole;
  mounted: boolean;
}

export function DashboardSidebar({
  pathname,
  navClusters,
  systemRole,
  mounted,
}: DashboardSidebarProps) {
  const t = useTranslations('dashboard');
  const { logout } = useAuth();

  return (
    <aside className="w-[210px] h-full border-r border-border/70 bg-[#F8F9FA] p-3 flex flex-col justify-between hidden md:flex shrink-0 overflow-y-auto themed-scroll select-none">
      <div className="space-y-4">
        {/* Logo */}
        <div className="px-2 py-1 flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Kvik Logo" className="h-6 w-auto object-contain" />
          <span className="text-base font-bold tracking-tight text-foreground">
            Kvik<span className="text-primary">.ai</span>
          </span>
        </div>

        {/* Workspace Switcher */}
        <WorkspaceSwitcher />

        {/* Categorized Navigation Clusters */}
        <nav className="space-y-3 pt-1">
          {/* Standalone Overview Link */}
          {mounted && (() => {
            const isOverviewActive = pathname === '/overview';
            return (
              <Link
                href="/overview"
                className={clsx(
                  'flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs transition-all whitespace-nowrap',
                  isOverviewActive
                    ? 'bg-primary/10 text-primary font-semibold'
                    : 'text-zinc-600 hover:text-foreground hover:bg-zinc-200/50 font-medium'
                )}
              >
                <LayoutDashboard
                  className={clsx(
                    'w-4 h-4 shrink-0 transition-colors',
                    isOverviewActive ? 'text-primary' : 'text-zinc-500'
                  )}
                />
                <span className="truncate">{t('nav.overview')}</span>
              </Link>
            );
          })()}

          {mounted &&
            navClusters.map((cluster) => {
              const visibleItems = cluster.items.filter((item) =>
                item.roles.includes(systemRole)
              );
              if (visibleItems.length === 0) return null;

              return (
                <div key={cluster.clusterKey} className="space-y-0.5">
                  <div className="px-2.5 pb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
                    {t(cluster.clusterKey)}
                  </div>

                  {visibleItems.map((item) => {
                    const isActive =
                      pathname === item.href ||
                      (item.href !== '/overview' && pathname.startsWith(item.href));
                    const Icon = item.Icon;

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={clsx(
                          'flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-all whitespace-nowrap',
                          isActive
                            ? 'bg-primary/10 text-primary font-semibold'
                            : 'text-zinc-600 hover:text-foreground hover:bg-zinc-200/50 font-medium'
                        )}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Icon
                            className={clsx(
                              'w-4 h-4 shrink-0 transition-colors',
                              isActive ? 'text-primary' : 'text-zinc-500'
                            )}
                          />
                          <span className="truncate">{item.label}</span>
                        </div>

                        {item.badge !== undefined && item.badge > 0 && (
                          <span
                            className={clsx(
                              'h-4 min-w-4 px-1.5 rounded-full text-[10px] font-bold flex items-center justify-center font-mono',
                              isActive
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-zinc-200 text-zinc-700'
                            )}
                          >
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              );
            })}
        </nav>
      </div>

      {/* Sidebar Footer: Support link & Logout */}
      <div className="pt-2 border-t border-border/60 space-y-0.5">
        <a
          href="https://t.me/yerazh4"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-600 hover:text-foreground hover:bg-zinc-200/50 transition-colors group cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <HelpCircle className="w-4 h-4 text-zinc-500 group-hover:text-foreground transition-colors shrink-0" />
            <span>{t('sidebar.get_help')}</span>
          </div>
        </a>

        <button
          type="button"
          onClick={() => logout()}
          className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-600 hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4 text-zinc-500 group-hover:text-destructive transition-colors shrink-0" />
          <span>{t('sidebar.logout_title')}</span>
        </button>
      </div>
    </aside>
  );
}
