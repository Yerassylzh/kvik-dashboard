'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  MessageSquare,
  Users,
  CalendarCheck,
  Settings2,
  Settings,
  Bell,
  Bot,
  Terminal,
  LayoutDashboard,
  Search,
  HelpCircle,
  MessageCircle,
  BookOpen,
  Mail,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useRBAC } from '@/hooks/useRBAC';
import { useDevMode } from '@/hooks/useDevMode';
import { getOnboardingState } from '@/lib/api/onboarding';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { useInboxStore } from '@/store/inbox.store';
import { useInboxRealtime } from '@/hooks/useInboxRealtime';
import { WorkspaceSwitcher } from '@/components/dashboard/shared/WorkspaceSwitcher';
import { Toaster } from '@/components/ui/sonner';
import clsx from 'clsx';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const t = useTranslations('dashboard');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { getTotalUnread } = useInboxStore();
  const { isDevMode } = useDevMode();
  const { systemRole } = useRBAC();

  const [isDemo, setIsDemo] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  // Streamlined 6 Core Navigation Items (MoonAI Standard)
  const primaryNavItems = [
    {
      href: '/overview',
      label: t('nav.overview'),
      Icon: LayoutDashboard,
      roles: ['OWNER', 'ADMIN_MANAGER', 'SPECIALIST'],
    },
    {
      href: '/inbox',
      label: t('nav.inbox'),
      Icon: MessageSquare,
      badge: getTotalUnread(),
      roles: ['OWNER', 'ADMIN_MANAGER', 'SPECIALIST'],
    },
    {
      href: '/calendar',
      label: t('nav.calendar'),
      Icon: CalendarCheck,
      roles: ['OWNER', 'ADMIN_MANAGER', 'SPECIALIST'],
    },
    {
      href: '/clients',
      label: t('nav.clients'),
      Icon: Users,
      roles: ['OWNER', 'ADMIN_MANAGER', 'SPECIALIST'],
    },
    {
      href: '/ai-studio',
      label: t('nav.ai_studio'),
      Icon: Bot,
      roles: ['OWNER', 'ADMIN_MANAGER'],
    },
    {
      href: '/settings',
      label: t('nav.settings'),
      Icon: Settings2,
      roles: ['OWNER', 'ADMIN_MANAGER', 'SPECIALIST'],
    },
    ...(isDevMode
      ? [
          {
            href: '/dev-messaging',
            label: t('dev_messaging.nav_label'),
            Icon: Terminal,
            roles: ['OWNER', 'ADMIN_MANAGER'],
          },
        ]
      : []),
  ];

  const visibleNavItems = primaryNavItems.filter((item) =>
    item.roles.includes(systemRole)
  );

  const currentNavItem = primaryNavItems.find(
    (item) => pathname === item.href || (item.href !== '/overview' && pathname.startsWith(item.href))
  );

  return (
    <div className="h-screen w-screen bg-background text-foreground flex flex-col overflow-hidden antialiased">
      <Toaster />

      {/* Presentation Demo Mode Banner */}
      {isDemo && (
        <div className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-4 py-1.5 text-xs flex flex-wrap items-center justify-between gap-2 shadow-xs z-40 shrink-0">
          <div className="flex items-center gap-2 font-medium">
            <span className="bg-white/20 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
              {t('demo.banner_tag')}
            </span>
            <span>{t('demo.banner_desc')}</span>
          </div>

          <button
            onClick={toggleDemoMode}
            className="text-[11px] underline opacity-90 hover:opacity-100 cursor-pointer"
          >
            {t('demo.banner_exit')}
          </button>
        </div>
      )}

      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Sleek MoonAI-Style Sidebar (210px) */}
        <aside className="w-[210px] h-full border-r border-border/70 bg-[#F8F9FA] p-3 flex flex-col justify-between hidden md:flex shrink-0 overflow-y-auto themed-scroll select-none">
          <div className="space-y-3.5">
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

            {/* Primary Navigation */}
            <nav className="space-y-0.5 pt-1">
              {mounted &&
                visibleNavItems.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== '/overview' && pathname.startsWith(item.href));
                  const Icon = item.Icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={clsx(
                        'flex items-center justify-between px-2.5 py-2 rounded-lg text-xs transition-all whitespace-nowrap',
                        isActive
                          ? 'bg-primary/10 text-primary font-semibold'
                          : 'text-zinc-600 hover:text-foreground hover:bg-zinc-200/50 font-medium'
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon
                          className={clsx(
                            'w-4 h-4 shrink-0 transition-colors',
                            isActive ? 'text-primary' : 'text-zinc-500'
                          )}
                        />
                        <span>{item.label}</span>
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
            </nav>
          </div>

          {/* Sidebar Footer: Get Help Button */}
          <div className="pt-2 border-t border-border/60">
            <button
              type="button"
              onClick={() => setHelpOpen(true)}
              className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium text-zinc-600 hover:text-foreground hover:bg-zinc-200/50 transition-colors group cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <HelpCircle className="w-4 h-4 text-zinc-500 group-hover:text-foreground transition-colors shrink-0" />
                <span>{t('sidebar.get_help')}</span>
              </div>
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden bg-background">
          {/* Minimalist 52px Topbar (MoonAI Standard) */}
          <header className="h-13 border-b border-border/70 px-5 flex items-center justify-between bg-card/90 backdrop-blur-sm shrink-0 z-30">
            <div className="flex items-center gap-3 min-w-0">
              <h2 className="font-semibold text-sm text-foreground truncate">
                {currentNavItem?.label || t('header.title')}
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

            {/* Topbar Right Utilities: Notifications, Settings, User Profile */}
            <div className="flex items-center gap-1.5 shrink-0">
              {/* Notification Bell */}
              <Link
                href="/notifications"
                title={t('header.notifications_tooltip')}
                className="relative p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary ring-2 ring-card" />
              </Link>

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

          {/* Page content scroll container */}
          <main className="p-5 sm:p-6 flex-1 overflow-y-auto themed-scroll">
            {children}
          </main>
        </div>
      </div>

      {/* Help & Support Modal */}
      <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-1">
              <HelpCircle className="w-5 h-5" />
            </div>
            <DialogTitle>{t('help_modal.title')}</DialogTitle>
            <DialogDescription>{t('help_modal.desc')}</DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2">
            <a
              href="https://t.me/kvik_support"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-3 rounded-xl border border-border/80 bg-background hover:bg-muted/50 hover:border-primary/40 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-500 flex items-center justify-center shrink-0">
                  <MessageCircle className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                    {t('help_modal.telegram_title')}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {t('help_modal.telegram_desc')}
                  </p>
                </div>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground shrink-0" />
            </a>

            <a
              href="https://docs.kvik.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-3 rounded-xl border border-border/80 bg-background hover:bg-muted/50 hover:border-primary/40 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                    {t('help_modal.docs_title')}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {t('help_modal.docs_desc')}
                  </p>
                </div>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground shrink-0" />
            </a>

            <a
              href="mailto:support@kvik.ai"
              className="flex items-center justify-between p-3 rounded-xl border border-border/80 bg-background hover:bg-muted/50 hover:border-primary/40 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-violet-500/10 text-violet-500 flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                    {t('help_modal.email_title')}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {t('help_modal.email_desc')}
                  </p>
                </div>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground shrink-0" />
            </a>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setHelpOpen(false)}
              className="w-full text-xs cursor-pointer"
            >
              {t('help_modal.close')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
