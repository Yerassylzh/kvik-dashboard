'use client';

import React from 'react';
import { useSearchParams } from 'next/navigation';
import { DemoOverview } from '@/components/dashboard/DemoOverview';
import { DemoLeads } from '@/components/dashboard/DemoLeads';
import { DemoInbox } from '@/components/dashboard/DemoInbox';
import { DemoAnalytics } from '@/components/dashboard/DemoAnalytics';
import { DemoSettings } from '@/components/dashboard/DemoSettings';

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab') || 'overview';

  return (
    <div className="space-y-6">
      {/* Dashboard Page Title Header (No pagination buttons on top right) */}
      <div className="pb-4 border-b border-border">
        <h1 className="text-2xl font-extrabold text-foreground tracking-tight flex items-center gap-2.5">
          <span>
            {activeTab === 'overview' && 'Дашборд ИИ-Менеджера'}
            {activeTab === 'inbox' && 'Входящие Диалоги ИИ'}
            {activeTab === 'leads' && 'CRM Лиды от ИИ-Агента'}
            {activeTab === 'analytics' && 'Аналитика и Метрики'}
            {activeTab === 'settings' && 'Настройки ИИ-Агента'}
          </span>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 font-bold">
            📅 Запись на услуги
          </span>
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          {activeTab === 'overview' && 'Оперативная панель записи клиентов, квалификации лидов и базы знаний'}
          {activeTab === 'inbox' && 'Автоматические ответы и запись клиентов в WhatsApp и Instagram в режиме 24/7'}
          {activeTab === 'leads' && 'База данных квалифицированных клиентов, готовых записаться на услугу'}
          {activeTab === 'analytics' && 'Статистика конверсии, времени ответа и экономии рабочего времени'}
          {activeTab === 'settings' && 'Параметры работы ИИ-агента, каналы связи и интеграции'}
        </p>
      </div>

      {/* Main Tab Content based on Sidebar Navigation */}
      {activeTab === 'overview' && <DemoOverview />}
      {activeTab === 'inbox' && <DemoInbox />}
      {activeTab === 'leads' && <DemoLeads />}
      {activeTab === 'analytics' && <DemoAnalytics />}
      {activeTab === 'settings' && <DemoSettings />}
    </div>
  );
}
