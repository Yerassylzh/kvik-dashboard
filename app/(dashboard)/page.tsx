'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { DemoOverview } from '@/components/dashboard/DemoOverview';
import { DemoLeads } from '@/components/dashboard/DemoLeads';
import { DemoObjects } from '@/components/dashboard/DemoObjects';
import { DemoInbox } from '@/components/dashboard/DemoInbox';
import { DemoAnalytics } from '@/components/dashboard/DemoAnalytics';
import { DemoSettings } from '@/components/dashboard/DemoSettings';

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const [niche, setNiche] = useState<string>('REALTY');

  const activeTab = searchParams.get('tab') || 'overview';

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const nicheParam = searchParams.get('niche');
      if (nicheParam === 'AUTO_SALES' || nicheParam === 'REALTY') {
        setNiche(nicheParam);
      }
    }
  }, [searchParams]);

  return (
    <div className="space-y-6">
      {/* Dashboard Page Title Header (No pagination buttons on top right) */}
      <div className="pb-4 border-b border-border">
        <h1 className="text-2xl font-extrabold text-foreground tracking-tight flex items-center gap-2.5">
          <span>
            {activeTab === 'overview' && 'Дашборд ИИ-Менеджера'}
            {activeTab === 'inbox' && 'Входящие Диалоги ИИ'}
            {activeTab === 'leads' && 'CRM Лиды от ИИ-Агента'}
            {activeTab === 'objects' && (niche === 'REALTY' ? 'Объекты Krisha.kz' : 'Каталог Kolesa.kz')}
            {activeTab === 'analytics' && 'Аналитика и Метрики'}
            {activeTab === 'settings' && 'Настройки ИИ-Агента'}
          </span>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 font-bold">
            {niche === 'REALTY' ? '🏠 Krisha.kz Realty' : '🚗 Kolesa.kz Auto'}
          </span>
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          {activeTab === 'overview' && 'Оперативная панель автоответов, квалификации лидов и синхронизации каталога'}
          {activeTab === 'inbox' && 'Автоматические ответы клиентам в WhatsApp и Instagram в режиме 24/7'}
          {activeTab === 'leads' && 'База данных квалифицированных клиентов с готовыми условиями покупки'}
          {activeTab === 'objects' && 'База знаний ИИ: объекты недвижимого имущества и автотранспорт'}
          {activeTab === 'analytics' && 'Статистика конверсии, времени ответа и экономии рабочего времени'}
          {activeTab === 'settings' && 'Параметры работы ИИ-агента, каналы связи и интеграции'}
        </p>
      </div>

      {/* Main Tab Content based on Sidebar Navigation */}
      {activeTab === 'overview' && <DemoOverview niche={niche} />}
      {activeTab === 'inbox' && <DemoInbox niche={niche} />}
      {activeTab === 'leads' && <DemoLeads niche={niche} />}
      {activeTab === 'objects' && <DemoObjects niche={niche} />}
      {activeTab === 'analytics' && <DemoAnalytics />}
      {activeTab === 'settings' && <DemoSettings />}
    </div>
  );
}
