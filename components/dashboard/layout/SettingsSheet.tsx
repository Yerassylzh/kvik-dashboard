'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Building2,
  Users,
  Shield,
  Bell,
  SlidersHorizontal,
  Settings2,
} from 'lucide-react';
import clsx from 'clsx';
import { useRBAC } from '@/hooks/useRBAC';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { WorkspaceForm } from '@/components/dashboard/settings/workspace/WorkspaceForm';
import { StaffSettingsPage } from '@/components/dashboard/settings/staff/StaffSettingsPage';
import { ChangePasswordForm } from '@/components/dashboard/settings/account/ChangePasswordForm';
import { NotificationSettingsPage } from '@/components/dashboard/settings/notifications/NotificationSettingsPage';
import { AdvancedSettings } from '@/components/dashboard/settings/advanced/AdvancedSettings';

// ─── Tab registry ─────────────────────────────────────────────────────────────

type TabId = 'workspace' | 'staff' | 'account' | 'notifications' | 'advanced';

interface TabDef {
  id: TabId;
  labelKey: string;
  Icon: React.ComponentType<{ className?: string }>;
  roles: string[];
}

const TABS: TabDef[] = [
  {
    id: 'workspace',
    labelKey: 'settings.nav_workspace',
    Icon: Building2,
    roles: ['OWNER'],
  },
  {
    id: 'staff',
    labelKey: 'settings.nav_staff',
    Icon: Users,
    roles: ['OWNER', 'ADMIN_MANAGER'],
  },
  {
    id: 'account',
    labelKey: 'settings.nav_account',
    Icon: Shield,
    roles: ['OWNER', 'ADMIN_MANAGER', 'SPECIALIST'],
  },
  {
    id: 'notifications',
    labelKey: 'settings.nav_notifications',
    Icon: Bell,
    roles: ['OWNER', 'ADMIN_MANAGER'],
  },
  {
    id: 'advanced',
    labelKey: 'settings.nav_advanced',
    Icon: SlidersHorizontal,
    roles: ['OWNER', 'ADMIN_MANAGER'],
  },
];

// ─── Panel content ─────────────────────────────────────────────────────────────

function TabPanel({ activeTab }: { activeTab: TabId }) {
  switch (activeTab) {
    case 'workspace':
      return <WorkspaceForm />;
    case 'staff':
      return <StaffSettingsPage />;
    case 'account':
      return <ChangePasswordForm />;
    case 'notifications':
      return <NotificationSettingsPage />;
    case 'advanced':
      return <AdvancedSettings />;
    default:
      return null;
  }
}

// ─── Main component ────────────────────────────────────────────────────────────

interface SettingsSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsSheet({ isOpen, onOpenChange }: SettingsSheetProps) {
  const t = useTranslations('dashboard');
  const { systemRole } = useRBAC();

  const visibleTabs = TABS.filter((tab) => tab.roles.includes(systemRole));

  const [activeTab, setActiveTab] = useState<TabId>(() => {
    // Default to first visible tab for current role
    if (systemRole === 'SPECIALIST') return 'account';
    return 'workspace';
  });

  // Ensure active tab is always visible for the current role
  const safeActiveTab =
    visibleTabs.find((t) => t.id === activeTab)?.id ?? visibleTabs[0]?.id ?? 'account';

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-[760px] md:max-w-[820px] p-0 flex flex-col overflow-hidden"
      >
        {/* Header */}
        <SheetHeader className="px-6 pt-5 pb-4 border-b border-border/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Settings2 className="w-4 h-4" />
            </div>
            <div>
              <SheetTitle>{t('settings.title')}</SheetTitle>
              <SheetDescription className="mt-0.5">
                {t('settings.sheet_desc')}
              </SheetDescription>
            </div>
          </div>

          {/* Tab Bar */}
          <nav className="flex items-center gap-1 mt-3 overflow-x-auto -mb-[17px] pb-[1px] themed-scroll">
            {visibleTabs.map((tab) => {
              const isActive = safeActiveTab === tab.id;
              const Icon = tab.Icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={clsx(
                    'flex items-center gap-1.5 px-3 py-2 text-xs font-medium whitespace-nowrap transition-all border-b-2 shrink-0 cursor-pointer',
                    isActive
                      ? 'border-primary text-primary font-semibold'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border/80'
                  )}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{t(tab.labelKey as any)}</span>
                </button>
              );
            })}
          </nav>
        </SheetHeader>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto themed-scroll px-6 py-5">
          <TabPanel activeTab={safeActiveTab} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
