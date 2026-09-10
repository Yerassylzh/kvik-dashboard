'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/hooks/useAuth';
import { getOnboardingState } from '@/lib/api/onboarding';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const t = useTranslations('dashboard');
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, logout } = useAuth();

  const [isDemo, setIsDemo] = useState(false);

  const currentTab = searchParams.get('tab') || 'overview';

  useEffect(() => {
    let cancelled = false;

    // Check query param or localStorage for demo mode
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

  const niche = user?.workspace?.nicheProfile || 'OTHER_CALENDAR';

  const nicheBadges: Record<string, string> = {
    BEAUTY: t('niche.beauty'),
    CLINIC: t('niche.clinic'),
    FITNESS: t('niche.fitness'),
    CONSULTING: t('niche.consulting'),
    OTHER_CALENDAR: t('niche.other_calendar'),
  };

  const navItems = [
    { id: 'overview', href: '/?demo=1&tab=overview', label: t('nav.overview'), icon: '📊' },
    { id: 'inbox', href: '/?demo=1&tab=inbox', label: t('nav.inbox'), icon: '💬' },
    { id: 'leads', href: '/?demo=1&tab=leads', label: t('nav.leads'), icon: '👥' },
    { id: 'analytics', href: '/?demo=1&tab=analytics', label: t('nav.analytics'), icon: '📈' },
    { id: 'settings', href: '/?demo=1&tab=settings', label: t('nav.settings'), icon: '⚙️' },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Presentation Demo Mode Banner */}
      {isDemo && (
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white px-4 py-2 text-xs flex flex-wrap items-center justify-between gap-2 shadow-md z-40">
          <div className="flex items-center gap-2 font-medium">
            <span className="bg-white/20 px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider">
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

      <div className="flex-1 flex min-h-0">
        {/* Sidebar */}
        <aside className="w-64 border-r border-border bg-card p-4 flex-col justify-between hidden md:flex flex-shrink-0">
          <div>
            {/* Logo */}
            <div className="mb-8 px-2 py-1 flex items-center gap-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="Kvik Logo" className="h-15 w-auto object-contain" />
              <span className="text-xl font-extrabold tracking-tight text-foreground">
                Kvik<span className="text-primary">.ai</span>
              </span>
            </div>

            {/* Niche Badge */}
            <div className="mb-5 mx-2 px-3.5 py-2.5 rounded-xl bg-primary/10 border border-primary/20 text-xs shadow-xs">
              <p className="text-primary font-semibold text-[11px]">{t('sidebar.niche_label')}</p>
              <p className="text-foreground font-bold mt-0.5">{nicheBadges[niche] || nicheBadges.OTHER_CALENDAR}</p>
            </div>

            {/* Navigation */}
            <nav className="space-y-1">
              {navItems.map((item) => {
                const isActive = currentTab === item.id;
                return (
                  <a
                    key={item.id}
                    href={item.href}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold text-xs transition-all ${
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20 font-bold'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    <span className="text-base">{item.icon}</span>
                    <span>{item.label}</span>
                  </a>
                );
              })}
            </nav>
          </div>

          {/* User & Plan Footer */}
          <div className="space-y-2 mt-4">
            <div className="p-3 rounded-xl bg-card border border-border/80 text-xs shadow-xs">
              <div className="flex items-center justify-between mb-1">
                <span className="text-muted-foreground font-medium">{t('sidebar.plan_label')}</span>
                <span className="text-primary font-bold">{t('sidebar.plan_name')}</span>
              </div>
              <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden mb-1">
                <div className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400 rounded-full" style={{ width: '68%' }} />
              </div>
              <p className="text-[11px] text-muted-foreground">{t('sidebar.tokens_usage')}</p>
            </div>

            <div className="p-3 rounded-xl bg-card border border-border/80 text-xs flex items-center justify-between gap-2 shadow-xs">
              <div className="flex items-center gap-2 min-w-0">
                <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {user?.email?.[0]?.toUpperCase() || 'A'}
                </div>
                <div className="min-w-0">
                  <p className="text-foreground font-semibold truncate">{user?.email || 'demo@kvik.ai'}</p>
                  <p className="text-muted-foreground text-[10px]">{t('sidebar.role_admin')}</p>
                </div>
              </div>
              <button
                onClick={logout}
                title={t('sidebar.logout_title')}
                className="p-1.5 rounded-lg bg-destructive/10 hover:bg-destructive/20 border border-destructive/20 text-destructive transition-colors text-sm flex-shrink-0 cursor-pointer"
              >
                🚪
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Topbar */}
          <header className="h-16 border-b border-border px-6 flex items-center justify-between bg-card/80 backdrop-blur-md flex-shrink-0 sticky top-0 z-30">
            <div className="flex items-center gap-3">
              <h2 className="font-bold text-sm text-foreground">{t('header.title')}</h2>
            </div>

            <div className="flex items-center gap-3">
              <Badge variant="success" pulse>
                {t('header.status_active')}
              </Badge>

              {!isDemo && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleDemoMode}
                  className="bg-primary/5 text-primary border-primary/30 hover:bg-primary/10"
                >
                  {t('header.open_demo')}
                </Button>
              )}
            </div>
          </header>

          {/* Page content */}
          <main className="p-6 flex-1 overflow-y-auto themed-scroll">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
