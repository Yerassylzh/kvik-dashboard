'use client';

import React from 'react';
import { useRoundRobin } from '@/hooks/useRoundRobin';
import { RoundRobinGlobalCard } from './RoundRobinGlobalCard';
import { RoundRobinStaffList } from './RoundRobinStaffList';

export function StaffSettingsPage() {
  const { settings, staff, isLoading, updateSettings, updateStaffRoundRobin } =
    useRoundRobin();

  if (isLoading || !settings) {
    return (
      <div className="space-y-4">
        <div className="h-48 rounded-2xl bg-muted/40 animate-pulse" />
        <div className="h-64 rounded-2xl bg-muted/40 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
  );
}
