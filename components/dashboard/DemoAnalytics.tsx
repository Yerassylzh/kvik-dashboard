'use client';

import React from 'react';

export function DemoAnalytics() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-foreground">Аналитика и конверсия ИИ</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Детальная статистика обработанных лидов, времени ответа и конверсии в показы
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-5 rounded-2xl bg-card border border-border space-y-2">
          <p className="text-xs font-semibold text-muted-foreground">Конверсия в целевой показ</p>
          <p className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400">75.6%</p>
          <p className="text-[11px] text-emerald-600 font-semibold">↑ +14% выше среднего по рынку</p>
        </div>

        <div className="p-5 rounded-2xl bg-card border border-border space-y-2">
          <p className="text-xs font-semibold text-muted-foreground">Сэкономлено времени менеджеров</p>
          <p className="text-3xl font-extrabold text-foreground">42 часа</p>
          <p className="text-[11px] text-muted-foreground">За текущий месяц</p>
        </div>

        <div className="p-5 rounded-2xl bg-card border border-border space-y-2">
          <p className="text-xs font-semibold text-muted-foreground">Удовлетворенность клиентов (CSAT)</p>
          <p className="text-3xl font-extrabold text-emerald-600">4.9 / 5.0</p>
          <p className="text-[11px] text-emerald-600 font-semibold">98.4% позитивных отзывов</p>
        </div>
      </div>

      <div className="p-6 rounded-2xl bg-card border border-border space-y-4">
        <h3 className="font-bold text-sm text-foreground">Воронка квалификации лидов (Последние 30 дней)</h3>
        <div className="space-y-3 text-xs">
          <div>
            <div className="flex justify-between mb-1 font-semibold">
              <span>1. Входящие сообщения в WhatsApp / Instagram</span>
              <span className="text-indigo-600">148 (100%)</span>
            </div>
            <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-indigo-500 rounded-full" style={{ width: '100%' }} />
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-1 font-semibold">
              <span>2. ИИ ответил и выявил потребности (бюджет, ипотека)</span>
              <span className="text-indigo-600">132 (89.1%)</span>
            </div>
            <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-indigo-600 rounded-full" style={{ width: '89.1%' }} />
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-1 font-semibold">
              <span>3. Записаны на показ / тест-драйв</span>
              <span className="text-emerald-600">112 (75.6%)</span>
            </div>
            <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: '75.6%' }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
