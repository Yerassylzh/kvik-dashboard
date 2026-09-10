'use client';

import React from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { DemoOverview } from '@/components/dashboard/DemoOverview';
import { DemoLeads } from '@/components/dashboard/DemoLeads';
import { DemoInbox } from '@/components/dashboard/DemoInbox';
import { DemoAnalytics } from '@/components/dashboard/DemoAnalytics';
import { DemoSettings } from '@/components/dashboard/DemoSettings';

export default function DashboardPage() {
  const t = useTranslations('dashboard');
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab') || 'overview';

  const tabTitles: Record<string, string> = {
    overview: t('page.overview_title'),
    inbox: t('page.inbox_title'),
    leads: t('page.leads_title'),
    analytics: t('page.analytics_title'),
    settings: t('page.settings_title'),
  };

  const tabDescriptions: Record<string, string> = {
    overview: t('page.overview_desc'),
    inbox: t('page.inbox_desc'),
    leads: t('page.leads_desc'),
    analytics: t('page.analytics_desc'),
    settings: t('page.settings_desc'),
  };

  return (
    <div className="space-y-6">
      {/* Dashboard Page Title Header */}
      <div className="pb-4 border-b border-border">
        <h1 className="text-2xl font-extrabold text-foreground tracking-tight flex items-center gap-2.5">
          <span>{tabTitles[activeTab] || tabTitles.overview}</span>
          <Badge variant="primary" className="text-xs font-bold">
            {t('page.niche_badge')}
          </Badge>
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          {tabDescriptions[activeTab] || tabDescriptions.overview}
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
