'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  LayoutDashboard,
  MessageSquare,
  Users,
  CalendarCheck,
  CreditCard,
  Settings2,
  LogOut,
  Sparkles,
  Database,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useRBAC } from '@/hooks/useRBAC';
import { useDevMode } from '@/hooks/useDevMode';
import { getOnboardingState } from '@/lib/api/onboarding';
import { Badge } from '@/components/ui/badge';
import { useInboxStore } from '@/store/inbox.store';
import { useInboxRealtime } from '@/hooks/useInboxRealtime';
import { WorkspaceSwitcher } from '@/components/dashboard/shared/WorkspaceSwitcher';
import clsx from 'clsx';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const t = useTranslations('dashboard');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, logout } = useAuth();
  const { getTotalUnread } = useInboxStore();
  const { isDevMode } = useDevMode();
  const { isSpecialist, isAdminOrOwner } = useRBAC();

  const [isDemo, setIsDemo] = useState(false);

  // Initialize Socket.IO real-time inbox events
  useInboxRealtime(user?.workspace?.id);

  useEffect(() => {
    let cancelled = false;

    if (typeof window !== 'undefined') {
      const isDemoUrl = searchParams.get('demo') === '1' || searchParams.get('demo') === 'true';
      const storedDemo = localStorage.getItem('kvik_demo_mode') === 'true';

      if (isDemoUrl || storedDemo) {
        setIsDemo(true);
        if (isDemoUrl) {
          localStorage.setItem('kvik_demo_mode', 'true');
        }
        return;
      }
    }

    (async () => {
      try {
        const state = await getOnboardingState();
        if (!cancelled && state.step !== 'DONE') {
          router.replace('/onboarding');
        }
      } catch {
        // Ignore API errors in layout check
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router, searchParams]);

  const toggleDemoMode = () => {
    if (isDemo) {
      localStorage.removeItem('kvik_demo_mode');
      setIsDemo(false);
      router.replace('/onboarding');
    } else {
      localStorage.setItem('kvik_demo_mode', 'true');
      setIsDemo(true);
    }
  };

  const allNavItems = [
    { href: '/overview', label: t('nav.overview'), Icon: LayoutDashboard, roles: ['OWNER', 'ADMIN_MANAGER', 'SPECIALIST'] },
    {
      href: '/inbox',
      label: t('nav.inbox'),
      Icon: MessageSquare,
      badge: getTotalUnread(),
      roles: ['OWNER', 'ADMIN_MANAGER', 'SPECIALIST'],
    },
    { href: '/leads', label: t('nav.leads'), Icon: Users, roles: ['OWNER', 'ADMIN_MANAGER', 'SPECIALIST'] },
    { href: '/bookings', label: t('nav.bookings'), Icon: CalendarCheck, roles: ['OWNER', 'ADMIN_MANAGER', 'SPECIALIST'] },
    { href: '/billing', label: t('nav.billing'), Icon: CreditCard, roles: ['OWNER', 'ADMIN_MANAGER'] },
    { href: '/settings', label: t('nav.settings'), Icon: Settings2, roles: ['OWNER', 'ADMIN_MANAGER', 'SPECIALIST'] },
    { href: '/knowledge-base', label: t('nav.knowledge_base'), Icon: Database, roles: ['OWNER', 'ADMIN_MANAGER'] },
    ...(isDevMode
      ? [{ href: '/dev-messaging', label: t('dev_messaging.nav_label'), Icon: Sparkles, roles: ['OWNER', 'ADMIN_MANAGER'] }]
      : []),
  ];

  const userRole = user?.role || (user?.staffProfile?.systemRole) || 'OWNER';
  const navItems = allNavItems.filter((item) => item.roles.includes(userRole));

  return (
    <div className="h-screen w-screen bg-background text-foreground flex flex-col overflow-hidden">
      {/* Presentation Demo Mode Banner */}
      {isDemo && (
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white px-4 py-1.5 text-xs flex flex-wrap items-center justify-between gap-2 shadow-md z-40 shrink-0">
          <div className="flex items-center gap-2 font-medium">
            <span className="bg-white/20 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
              {t('demo.banner_tag')}
            </span>
            <span>{t('demo.banner_desc')}</span>
          </div>

          <button
            onClick={toggleDemoMode}
            className="text-[11px] underline opacity-80 hover:opacity-100 cursor-pointer"
          >
            {t('demo.banner_exit')}
          </button>
        </div>
      )}

      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 h-full border-r border-border/80 bg-card p-4 flex flex-col justify-between hidden md:flex shrink-0 overflow-y-auto themed-scroll">
          <div className="space-y-4">
            {/* Logo */}
            <div className="px-2 py-1 flex items-center gap-2.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="Kvik Logo" className="h-8 w-auto object-contain" />
              <span className="text-lg font-extrabold tracking-tight text-foreground">
                Kvik<span className="text-primary">.ai</span>
              </span>
            </div>

            {/* Workspace Switcher */}
            <WorkspaceSwitcher />

            {/* Navigation */}
            <nav className="space-y-1">
              {navItems.map((item) => {
                const isActive = pathname.startsWith(item.href);
                const Icon = item.Icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={clsx(
                      'flex items-center justify-between px-3 py-2.5 rounded-xl font-semibold text-xs transition-all border whitespace-nowrap',
                      isActive
                        ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                        : 'bg-transparent border-transparent text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.label}</span>
                    </div>

                    {item.badge !== undefined && item.badge > 0 && (
                      <span
                        className={clsx(
                          'h-4 min-w-4 px-1 rounded-full text-[10px] font-bold flex items-center justify-center font-mono',
                          isActive
                            ? 'bg-background text-foreground'
                            : 'bg-primary text-primary-foreground'
                        )}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* User Profile Footer (Clean Capsule pinned inside viewport) */}
          <div className="pt-3 border-t border-border/50">
            <div className="p-2.5 rounded-xl bg-muted/30 border border-border/60 text-xs flex items-center justify-between gap-2 shadow-2xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="h-7 w-7 rounded-full bg-primary/20 text-primary border border-primary/30 flex items-center justify-center font-bold text-xs shrink-0">
                  {(user?.staffProfile?.name || user?.email)?.[0]?.toUpperCase() || 'A'}
                </div>
                <div className="min-w-0">
                  <p className="text-foreground font-semibold truncate text-xs leading-tight">
                    {user?.staffProfile?.name || user?.email || 'demo@kvik.ai'}
                  </p>
                  <p className="text-muted-foreground text-[10px] leading-tight mt-0.5">
                    {user?.staffProfile?.role || t('sidebar.role_admin')}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={logout}
                title={t('sidebar.logout_title')}
                className="p-1.5 rounded-lg hover:bg-destructive/10 border border-transparent hover:border-destructive/20 text-muted-foreground hover:text-destructive transition-colors text-xs shrink-0 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
          {/* Topbar */}
          <header className="h-14 border-b border-border/60 px-6 flex items-center justify-between bg-card/80 backdrop-blur-md shrink-0 z-30">
            <div className="flex items-center gap-3">
              <h2 className="font-bold text-sm text-foreground">{t('header.title')}</h2>
            </div>

            <div className="flex items-center gap-3">
              <Badge variant="success" pulse>
                {t('header.status_active')}
              </Badge>
            </div>
          </header>

          {/* Page content scroll container */}
          <main className="p-6 flex-1 overflow-y-auto themed-scroll">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
