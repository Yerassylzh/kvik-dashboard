'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { getOnboardingState } from '@/lib/api/onboarding';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isLoading, logout } = useAuth();

  const niche = user?.workspace?.nicheProfile;

  // Onboarding Guard: If user manually navigates to dashboard before completing onboarding, redirect to /onboarding
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const state = await getOnboardingState();
        if (!cancelled && state.step !== 'DONE') {
          router.replace('/onboarding');
        }
      } catch {
        // Ignore API errors, let auth proxy/hook handle session
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  const navItems = [
    { href: '/', label: 'Дашборд', icon: '📊', always: true },
    { href: '/inbox', label: 'Диалоги', icon: '💬', always: true },
    { href: '/leads', label: 'Лиды (CRM)', icon: '👥', always: true },
    ...(niche === 'REALTY' ? [
      { href: '/objects', label: 'Объекты Krisha', icon: '🏠', always: false },
    ] : []),
    ...(niche === 'AUTO_SALES' || niche === 'AUTO_SERVICE' ? [
      { href: '/catalog', label: 'Авто Kolesa', icon: '🚗', always: false },
    ] : []),
    ...(niche === 'OTHER_CALENDAR' || niche === 'BEAUTY' || niche === 'CLINIC' ? [
      { href: '/schedule', label: 'Расписание', icon: '📅', always: false },
    ] : []),
    { href: '/analytics', label: 'Аналитика', icon: '📈', always: true },
    { href: '/settings', label: 'Настройки', icon: '⚙️', always: true },
    { href: '/billing', label: 'Тариф и оплата', icon: '💳', always: true },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card p-4 flex-col justify-between hidden md:flex flex-shrink-0">
        <div>
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8 px-2 py-1">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-400 p-[2px] shadow-lg shadow-indigo-500/20">
              <div className="h-full w-full bg-background rounded-[10px] flex items-center justify-center font-bold text-lg text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-300">
                K
              </div>
            </div>
            <span className="text-xl font-extrabold tracking-tight text-foreground">
              Kvik<span className="text-accent-brand">.ai</span>
            </span>
          </div>

          {/* Niche Badge */}
          {niche && (
            <div className="mb-5 mx-2 px-3 py-2 rounded-xl bg-primary/10 border border-primary/20 text-xs">
              <p className="text-muted-foreground font-medium">Ниша</p>
              <p className="text-primary-foreground font-bold mt-0.5">
                {niche === 'REALTY' && '🏠 Недвижимость'}
                {niche === 'AUTO_SALES' && '🚗 Автопродажи'}
                {niche === 'AUTO_SERVICE' && '🔧 Автосервис'}
                {niche === 'BEAUTY' && '💅 Бьюти'}
                {niche === 'CLINIC' && '🏥 Клиника'}
                {niche === 'OTHER_CALENDAR' && '📅 Запись на услуги'}
              </p>
            </div>
          )}

          {/* Navigation */}
          <nav className="space-y-0.5">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground font-medium text-xs transition-all group"
              >
                <span className="text-base">{item.icon}</span>
                <span>{item.label}</span>
              </a>
            ))}
          </nav>
        </div>

        {/* User & Plan Footer */}
        <div className="space-y-2 mt-4">
          {/* Plan card */}
          <div className="p-3 rounded-xl bg-muted/80 border border-border text-xs">
            <div className="flex items-center justify-between mb-1">
              <span className="text-muted-foreground">Тариф</span>
              <span className="text-accent-brand font-bold">{user?.workspace?.plan || 'STARTER'}</span>
            </div>
            <div className="w-full h-1.5 bg-background rounded-full overflow-hidden mb-1">
              <div className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-full" style={{ width: '14%' }} />
            </div>
            <p className="text-[11px] text-muted-foreground">142 / 1 000 токенов ИИ использовано</p>
          </div>

          {/* User card with Logout button */}
          <div className="p-3 rounded-xl bg-muted/60 border border-border text-xs flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-indigo-400 to-cyan-300 flex items-center justify-center text-slate-950 font-bold text-sm flex-shrink-0">
                {user?.email?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="min-w-0">
                <p className="text-foreground font-semibold truncate">{user?.email}</p>
                <p className="text-muted-foreground text-[10px]">Администратор</p>
              </div>
            </div>
            <button
              onClick={logout}
              title="Выйти из аккаунта"
              className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors text-sm flex-shrink-0"
            >
              🚪
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-16 border-b border-border px-6 flex items-center justify-between bg-card/80 backdrop-blur-md flex-shrink-0 sticky top-0 z-30">
          <h2 className="font-bold text-sm text-foreground">Панель управления</h2>
          <div className="flex items-center gap-3">
            {user?.workspace?.isActive ? (
              <span className="text-xs text-emerald-400 font-semibold px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                ИИ-Агент активен
              </span>
            ) : (
              <span className="text-xs text-amber-400 font-semibold px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20">
                ⚠ Агент не активирован
              </span>
            )}
            <button
              onClick={logout}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive-foreground hover:bg-destructive/20 transition-colors flex items-center gap-1.5 cursor-pointer md:hidden"
            >
              <span>🚪</span>
              <span>Выйти</span>
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6 flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
