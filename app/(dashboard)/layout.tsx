'use client';

import React, { useEffect, useState, useMemo, useSyncExternalStore } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  MessageSquare,
  Users,
  CalendarCheck,
  Settings2,
  Bot,
  Terminal,
  Zap,
  BarChart3,
  UserCheck,
  Share2,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useRBAC } from '@/hooks/useRBAC';
import { useDevMode } from '@/hooks/useDevMode';
import { getOnboardingState } from '@/lib/api/onboarding';
import { useInboxStore } from '@/store/inbox.store';
import { useNotificationsStore } from '@/store/notifications.store';
import { notificationsApi } from '@/lib/api/notifications';
import { useInboxRealtime } from '@/hooks/useInboxRealtime';
import { Toaster } from '@/components/ui/sonner';
import type { SystemRole } from '@/types/auth';
import { HelpSupportModal } from '@/components/dashboard/layout/HelpSupportModal';
import { DashboardTopbar } from '@/components/dashboard/layout/DashboardTopbar';
import { DashboardSidebar, type NavCluster } from '@/components/dashboard/layout/DashboardSidebar';
import { SettingsSheet } from '@/components/dashboard/layout/SettingsSheet';

const emptySubscribe = () => () => {};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const t = useTranslations('dashboard');
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const { getTotalUnread } = useInboxStore();
  const setNotificationCount = useNotificationsStore((s) => s.setCount);
  const { isDevMode } = useDevMode();
  const { systemRole } = useRBAC();

  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const [helpOpen, setHelpOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Initialize Socket.IO real-time inbox events
  useInboxRealtime(user?.workspace?.id);

  // Request browser Notification permission once & seed initial unread notification count
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission().catch(() => {});
      }
    }

    if (user?.workspace?.id) {
      notificationsApi
        .getNotifications({ page: 1, limit: 1 })
        .then((res) => {
          setNotificationCount(res.unreadCount);
        })
        .catch(() => {});
    }
  }, [user?.workspace?.id, setNotificationCount]);

  useEffect(() => {
    let cancelled = false;

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
  }, [router]);

  // Structured 3-Cluster Enterprise Navigation
  const navClusters: NavCluster[] = useMemo(
    () => [
      {
        clusterKey: 'nav.group_operations',
        items: [
          {
            href: '/inbox',
            label: t('nav.inbox'),
            Icon: MessageSquare,
            badge: getTotalUnread(),
            roles: ['OWNER', 'ADMIN_MANAGER', 'SPECIALIST'],
          },
          {
            href: '/calendar',
            label: t('nav.calendar'),
            Icon: CalendarCheck,
            roles: ['OWNER', 'ADMIN_MANAGER', 'SPECIALIST'],
          },
          {
            href: '/clients',
            label: t('nav.clients'),
            Icon: Users,
            roles: ['OWNER', 'ADMIN_MANAGER', 'SPECIALIST'],
          },
        ],
      },
      {
        clusterKey: 'nav.group_ai_growth',
        items: [
          {
            href: '/insights',
            label: t('nav.insights'),
            Icon: BarChart3,
            roles: ['OWNER', 'ADMIN_MANAGER'],
          },
          {
            href: '/automations',
            label: t('nav.automations'),
            Icon: Zap,
            roles: ['OWNER', 'ADMIN_MANAGER'],
          },
          {
            href: '/ai-studio',
            label: t('nav.ai_studio'),
            Icon: Bot,
            roles: ['OWNER', 'ADMIN_MANAGER'],
          },
        ],
      },
      {
        clusterKey: 'nav.group_governance',
        items: [
          {
            href: '/team',
            label: t('nav.team'),
            Icon: UserCheck,
            roles: ['OWNER', 'ADMIN_MANAGER'],
          },
          {
            href: '/integrations',
            label: t('nav.integrations'),
            Icon: Share2,
            roles: ['OWNER', 'ADMIN_MANAGER'],
          },
          {
            href: '/settings',
            label: t('nav.settings'),
            Icon: Settings2,
            roles: ['OWNER', 'ADMIN_MANAGER', 'SPECIALIST'],
          },
          ...(isDevMode
            ? [
                {
                  href: '/dev-messaging',
                  label: t('dev_messaging.nav_label'),
                  Icon: Terminal,
                  roles: ['OWNER', 'ADMIN_MANAGER'] as SystemRole[],
                },
              ]
            : []),
        ],
      },
    ],
    [t, getTotalUnread, isDevMode]
  );

  const currentNavItem = useMemo(() => {
    const allNavItems = navClusters.flatMap((c) => c.items);
    return allNavItems.find(
      (item) => pathname === item.href || (item.href !== '/overview' && pathname.startsWith(item.href))
    );
  }, [navClusters, pathname]);

  return (
    <div className="h-screen w-screen bg-background text-foreground flex flex-col overflow-hidden antialiased">
      <Toaster />

      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Sleek MoonAI-Style Sidebar (210px) */}
        <DashboardSidebar
          pathname={pathname}
          navClusters={navClusters}
          systemRole={systemRole}
          mounted={mounted}
          onOpenHelp={() => setHelpOpen(true)}
          onOpenSettings={() => setSettingsOpen(true)}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden bg-background">
          {/* Minimalist 52px Topbar (MoonAI Standard) */}
          <DashboardTopbar
            title={currentNavItem?.label}
            user={user}
          />

          {/* Page content scroll container — inbox manages its own internal scroll */}
          <main
            className={
              pathname.startsWith('/inbox')
                ? 'p-5 sm:p-6 flex-1 overflow-hidden'
                : 'p-5 sm:p-6 flex-1 overflow-y-auto themed-scroll'
            }
          >
            {children}
          </main>
        </div>
      </div>

      {/* Help & Support Modal */}
      <HelpSupportModal isOpen={helpOpen} onOpenChange={setHelpOpen} />

      {/* Settings Slide-over Sheet */}
      <SettingsSheet isOpen={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
}
