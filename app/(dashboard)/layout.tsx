'use client';

import React from 'react';
import { useAuth } from '@/hooks/useAuth';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  const niche = user?.workspace?.nicheProfile;

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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-800/80 bg-slate-950 p-4 flex-col justify-between hidden md:flex flex-shrink-0">
        <div>
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8 px-2 py-1">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-400 p-[2px] shadow-lg shadow-indigo-500/20">
              <div className="h-full w-full bg-slate-950 rounded-[10px] flex items-center justify-center font-bold text-lg text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-300">
                K
              </div>
            </div>
            <span className="text-xl font-extrabold tracking-tight text-white">
              Kvik<span className="text-indigo-400">.ai</span>
            </span>
          </div>

          {/* Niche Badge */}
          {niche && (
            <div className="mb-5 mx-2 px-3 py-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs">
              <p className="text-slate-400 font-medium">Ниша</p>
              <p className="text-indigo-300 font-bold mt-0.5">
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
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:bg-slate-900 hover:text-white font-medium text-xs transition-all group"
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
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
            <div className="flex items-center justify-between mb-1">
              <span className="text-slate-400">Тариф</span>
              <span className="text-indigo-400 font-bold">{user?.workspace?.plan || 'STARTER'}</span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mb-1">
              <div className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-full" style={{ width: '14%' }} />
            </div>
            <p className="text-[11px] text-slate-500">142 / 1 000 токенов ИИ использовано</p>
          </div>

          {/* User card */}
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs flex items-center gap-2">
            <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-indigo-400 to-cyan-300 flex items-center justify-center text-slate-950 font-bold text-sm flex-shrink-0">
              {user?.email?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="min-w-0">
              <p className="text-slate-200 font-semibold truncate">{user?.email}</p>
              <p className="text-slate-500 text-[10px]">Администратор</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-16 border-b border-slate-800/80 px-6 flex items-center justify-between bg-slate-950/80 backdrop-blur-md flex-shrink-0 sticky top-0 z-30">
          <h2 className="font-bold text-sm text-white">Панель управления</h2>
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
