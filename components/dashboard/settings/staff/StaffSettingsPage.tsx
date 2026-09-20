'use client';

import React from 'react';
import { Shuffle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { DashboardPageHeader } from '@/components/dashboard/shared/DashboardPageHeader';
import { FadeIn } from '@/components/ui/motion/FadeIn';
import { useRoundRobin } from '@/hooks/useRoundRobin';
import { RoundRobinGlobalCard } from './RoundRobinGlobalCard';
import { RoundRobinStaffList } from './RoundRobinStaffList';

export function StaffSettingsPage() {
  const t = useTranslations('dashboard');
  const { settings, staff, isLoading, updateSettings, updateStaffRoundRobin } =
    useRoundRobin();

  return (
    <FadeIn direction="up" distance={8} duration={0.2} className="space-y-6 max-w-4xl">
      <DashboardPageHeader
        title={t('settings.rr_section_title')}
        description={t('settings.rr_section_desc')}
        badge={
          settings?.roundRobinEnabled ? (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
              <Shuffle className="w-3 h-3" />
              {settings.strategy}
            </span>
          ) : undefined
        }
      />

      {isLoading || !settings ? (
        <div className="space-y-4">
          <div className="h-48 rounded-2xl bg-muted/40 animate-pulse" />
          <div className="h-64 rounded-2xl bg-muted/40 animate-pulse" />
        </div>
      ) : (
        <div className="space-y-4">
          <RoundRobinGlobalCard
            enabled={settings.roundRobinEnabled}
            strategy={settings.strategy}
            matchSpecialization={settings.matchSpecialization}
            considerWeeklyLoad={settings.considerWeeklyLoad}
            onSave={updateSettings}
          />
          <RoundRobinStaffList
            staff={staff}
            strategy={settings.strategy}
            globalEnabled={settings.roundRobinEnabled}
            onUpdateStaff={updateStaffRoundRobin}
          />
        </div>
      )}
    </FadeIn>
  );
}
