'use client';

import React from 'react';

export function DemoSettings() {
  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-lg font-bold text-foreground">Настройки ИИ-Агента</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Управление интеграциями, стилем общения и правилами квалификации
        </p>
      </div>

      <div className="p-6 rounded-2xl bg-card border border-border space-y-4">
        <h3 className="font-bold text-sm text-foreground">Подключенные источники данных</h3>
        <div className="p-4 rounded-xl bg-muted/50 border border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🏠</span>
            <div>
              <p className="font-bold text-xs text-foreground">Krisha.kz Авто-импорт</p>
              <p className="text-[11px] text-muted-foreground">ID Агентства: 15837549 · 24 объявления</p>
            </div>
          </div>
          <span className="text-xs font-bold text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
            Активно
          </span>
        </div>
      </div>

      <div className="p-6 rounded-2xl bg-card border border-border space-y-4">
        <h3 className="font-bold text-sm text-foreground">Интеграция каналов связи</h3>
        <div className="p-4 rounded-xl bg-muted/50 border border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📱</span>
            <div>
              <p className="font-bold text-xs text-foreground">WhatsApp Business API</p>
              <p className="text-[11px] text-muted-foreground">+7 (701) 948-22-11 · Подключено</p>
            </div>
          </div>
          <span className="text-xs font-bold text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
            Подключено
          </span>
        </div>
      </div>
    </div>
  );
}
