'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { getOnboardingState } from '@/lib/api/onboarding';
import { NicheProfile } from '@/types/niche';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, logout } = useAuth();

  const [isDemo, setIsDemo] = useState(false);
  const [demoNiche, setDemoNiche] = useState<NicheProfile>('REALTY');

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
        const nicheParam = searchParams.get('niche') as NicheProfile;
        if (nicheParam && ['REALTY', 'AUTO_SALES', 'AUTO_SERVICE'].includes(nicheParam)) {
          setDemoNiche(nicheParam);
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

  const niche = isDemo ? demoNiche : user?.workspace?.nicheProfile || 'REALTY';

  const navItems = [
    { id: 'overview', href: '/?demo=1&tab=overview', label: 'Дашборд', icon: '📊' },
    { id: 'inbox', href: '/?demo=1&tab=inbox', label: 'Диалоги', icon: '💬' },
    { id: 'leads', href: '/?demo=1&tab=leads', label: 'Лиды (CRM)', icon: '👥' },
    ...(niche === 'REALTY' ? [
      { id: 'objects', href: '/?demo=1&tab=objects', label: 'Объекты Krisha', icon: '🏠' },
    ] : []),
    ...(niche === 'AUTO_SALES' || niche === 'AUTO_SERVICE' ? [
      { id: 'objects', href: '/?demo=1&tab=objects', label: 'Авто Kolesa', icon: '🚗' },
    ] : []),
    { id: 'analytics', href: '/?demo=1&tab=analytics', label: 'Аналитика', icon: '📈' },
    { id: 'settings', href: '/?demo=1&tab=settings', label: 'Настройки', icon: '⚙️' },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Presentation Demo Mode Banner */}
      {isDemo && (
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white px-4 py-2 text-xs flex flex-wrap items-center justify-between gap-2 shadow-md z-40">
          <div className="flex items-center gap-2 font-medium">
            <span className="bg-white/20 px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider">
              ✨ Presentation Demo Mode
            </span>
            <span>Показ интерактивного дашборда для презентации</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-white/80 text-[11px]">Ниша:</span>
            <div className="flex items-center bg-black/20 p-0.5 rounded-lg border border-white/20">
              <button
                onClick={() => setDemoNiche('REALTY')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                  demoNiche === 'REALTY' ? 'bg-white text-indigo-900 shadow-sm' : 'text-white/80 hover:text-white'
                }`}
              >
                🏠 Krisha.kz (Недвижимость)
              </button>
              <button
                onClick={() => setDemoNiche('AUTO_SALES')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                  demoNiche === 'AUTO_SALES' ? 'bg-white text-indigo-900 shadow-sm' : 'text-white/80 hover:text-white'
                }`}
              >
                🚗 Kolesa.kz (Автопродажи)
              </button>
            </div>
            <button
              onClick={toggleDemoMode}
              className="text-[11px] underline opacity-80 hover:opacity-100 ml-2"
            >
              Выйти из Demo
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 flex min-h-0">
        {/* Sidebar */}
        <aside className="w-64 border-r border-border bg-card p-4 flex-col justify-between hidden md:flex flex-shrink-0">
          <div>
            {/* Logo: logo2.png icon image + Kvik.ai text next to it */}
            <div className="mb-8 px-2 py-1 flex items-center gap-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="Kvik Logo" className="h-15 w-auto object-contain" />
              <span className="text-xl font-extrabold tracking-tight text-foreground">
                Kvik<span className="text-indigo-600 dark:text-indigo-400">.ai</span>
              </span>
            </div>

            {/* Niche Badge */}
            <div className="mb-5 mx-2 px-3.5 py-2.5 rounded-xl bg-indigo-50/60 border border-indigo-200/60 text-xs shadow-sm">
              <p className="text-indigo-600 font-semibold text-[11px]">Активная ниша</p>
              <p className="text-slate-900 font-bold mt-0.5">
                {niche === 'REALTY' && '🏠 Недвижимость (Krisha.kz)'}
                {niche === 'AUTO_SALES' && '🚗 Автопродажи (Kolesa.kz)'}
                {niche === 'AUTO_SERVICE' && '🔧 Автосервис'}
                {niche === 'BEAUTY' && '💅 Бьюти'}
                {niche === 'CLINIC' && '🏥 Клиника'}
                {niche === 'OTHER_CALENDAR' && '📅 Запись на услуги'}
              </p>
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
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20 font-bold'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
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
            <div className="p-3 rounded-xl bg-card border border-border/80 text-xs shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <span className="text-muted-foreground font-medium">Тариф</span>
                <span className="text-indigo-600 font-bold">PRO AGENT</span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mb-1">
                <div className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400 rounded-full" style={{ width: '68%' }} />
              </div>
              <p className="text-[11px] text-muted-foreground">6,840 / 10,000 токенов ИИ</p>
            </div>

            <div className="p-3 rounded-xl bg-card border border-border/80 text-xs flex items-center justify-between gap-2 shadow-sm">
              <div className="flex items-center gap-2 min-w-0">
                <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {user?.email?.[0]?.toUpperCase() || 'A'}
                </div>
                <div className="min-w-0">
                  <p className="text-foreground font-semibold truncate">{user?.email || 'demo@kvik.ai'}</p>
                  <p className="text-muted-foreground text-[10px]">Администратор</p>
                </div>
              </div>
              <button
                onClick={logout}
                title="Выйти"
                className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 transition-colors text-sm flex-shrink-0 cursor-pointer"
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
              <h2 className="font-bold text-sm text-foreground">Панель управления ИИ-агентом Kvik</h2>
              {false && isDemo && (
                <span className="text-[11px] bg-indigo-100 text-indigo-700 font-bold px-2.5 py-0.5 rounded-full border border-indigo-200">
                  {/* Демо-режим для презентации */}
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                ИИ-Агент активен 24/7
              </span>

              {!isDemo && (
                <button
                  onClick={toggleDemoMode}
                  className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200 hover:bg-indigo-100 transition-all cursor-pointer"
                >
                  ✨ Открыть Демо для Презентации
                </button>
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


