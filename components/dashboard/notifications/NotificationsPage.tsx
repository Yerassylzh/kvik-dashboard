"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import {
  Bell,
  CalendarCheck,
  CalendarX,
  AlertTriangle,
  UserCheck,
  LogOut,
  Info,
  Check,
  Loader2,
} from "lucide-react";
import { FadeIn } from "@/components/ui/motion/FadeIn";
import { DashboardPageHeader } from "@/components/dashboard/shared/DashboardPageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNotifications } from "@/hooks/useNotifications";
import type { NotificationType } from "@/lib/api/notifications";
import { formatRelativeTime } from "@/lib/utils/format";
import clsx from "clsx";

type TabId = "all" | NotificationType;

interface TypeConfig {
  icon: React.ComponentType<{ className?: string }>;
  colorClass: string;
  badgeVariant: "primary" | "info" | "success" | "warning" | "default";
}

const TYPE_CONFIG: Record<NotificationType, TypeConfig> = {
  ESCALATION: {
    icon: AlertTriangle,
    colorClass: "bg-red-50 text-red-600 border-red-100",
    badgeVariant: "warning",
  },
  TAKEOVER: {
    icon: UserCheck,
    colorClass: "bg-violet-50 text-primary border-violet-100",
    badgeVariant: "primary",
  },
  TAKEOVER_RELEASED: {
    icon: LogOut,
    colorClass: "bg-slate-50 text-slate-500 border-slate-200",
    badgeVariant: "default",
  },
  NEW_BOOKING: {
    icon: CalendarCheck,
    colorClass: "bg-emerald-50 text-emerald-600 border-emerald-100",
    badgeVariant: "success",
  },
  BOOKING_CANCELLED: {
    icon: CalendarX,
    colorClass: "bg-rose-50 text-rose-500 border-rose-100",
    badgeVariant: "default",
  },
  SYSTEM: {
    icon: Info,
    colorClass: "bg-sky-50 text-sky-600 border-sky-100",
    badgeVariant: "info",
  },
};

export function NotificationsPage() {
  const t = useTranslations("dashboard");
  const router = useRouter();
  const [activeTab, setActiveTab] = React.useState<TabId>("all");

  const { items, unreadCount, isLoading, markRead, markAllRead, hasMore, loadMore } =
    useNotifications();

  const filtered =
    activeTab === "all" ? items : items.filter((n) => n.type === activeTab);

  const tabs: Array<{ id: TabId; labelKey: string }> = [
    { id: "all", labelKey: "notifications.tab_all" },
    { id: "ESCALATION", labelKey: "notifications.tab_escalation" },
    { id: "NEW_BOOKING", labelKey: "notifications.tab_bookings" },
    { id: "BOOKING_CANCELLED", labelKey: "notifications.tab_bookings_cancelled" },
    { id: "SYSTEM", labelKey: "notifications.tab_system" },
  ];

  return (
    <FadeIn direction="up" distance={10} duration={0.2} className="space-y-4 sm:space-y-5 max-w-4xl">
      <DashboardPageHeader
        title={t("notifications.title")}
        description={t("notifications.desc")}
        badge={
          unreadCount > 0 ? (
            <Badge variant="primary">{unreadCount}</Badge>
          ) : undefined
        }
        actions={
          unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={markAllRead}
              leftIcon={<Check className="w-3.5 h-3.5" />}
              className="text-xs"
            >
              {t("notifications.mark_all_read")}
            </Button>
          )
        }
        tabs={tabs.map(({ id, labelKey }) => ({
          id,
          label: t(labelKey as Parameters<typeof t>[0]),
          count: id === "all" ? items.length : items.filter((n) => n.type === id).length,
          active: activeTab === id,
          onClick: () => setActiveTab(id),
        }))}
      />

      <div className="rounded-xl border border-border/80 bg-card overflow-hidden divide-y divide-border/60">
        {isLoading ? (
          <div className="py-16 flex items-center justify-center text-muted-foreground gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-xs">{t("common.loading")}</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-xs text-muted-foreground">
            <Bell className="w-8 h-8 mx-auto mb-2 opacity-30 text-primary" />
            <p>{t("notifications.empty")}</p>
          </div>
        ) : (
          filtered.map((item) => {
            const cfg = TYPE_CONFIG[item.type] ?? TYPE_CONFIG.SYSTEM;
            const Icon = cfg.icon;

            const handleClick = async () => {
              if (!item.isRead) await markRead(item.id);
              // Navigate to inbox for escalation/takeover notifications
              if (
                (item.type === "ESCALATION" || item.type === "TAKEOVER") &&
                item.data?.conversationId
              ) {
                router.push(`/inbox?conversationId=${item.data.conversationId}`);
              }
            };

            return (
              <div
                key={item.id}
                onClick={handleClick}
                className={clsx(
                  "p-3.5 sm:p-4 flex items-start gap-3.5 transition-colors cursor-pointer",
                  item.isRead ? "bg-card hover:bg-muted/30" : "bg-primary/[0.02] hover:bg-primary/[0.05]"
                )}
              >
                <div
                  className={clsx(
                    "h-8 w-8 rounded-lg flex items-center justify-center shrink-0 border",
                    item.isRead ? "bg-muted text-muted-foreground border-border/70" : cfg.colorClass
                  )}
                >
                  <Icon className="w-4 h-4" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={clsx(
                        "text-xs leading-tight",
                        item.isRead ? "font-medium text-foreground" : "font-bold text-foreground"
                      )}
                    >
                      {item.title}
                    </span>
                    <Badge variant={cfg.badgeVariant} className="text-[9px] px-1.5 py-0">
                      {t(`notifications.type_${item.type.toLowerCase()}` as Parameters<typeof t>[0])}
                    </Badge>
                    {!item.isRead && (
                      <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 ml-auto sm:ml-0" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{item.body}</p>
                </div>

                <div className="shrink-0 text-right">
                  <span className="text-[11px] text-muted-foreground font-mono tabular-nums">
                    {formatRelativeTime(item.createdAt)}
                  </span>
                </div>
              </div>
            );
          })
        )}

        {hasMore && !isLoading && (
          <div className="p-3 text-center">
            <Button variant="ghost" size="sm" onClick={loadMore} className="text-xs text-muted-foreground">
              {t("common.load_more")}
            </Button>
          </div>
        )}
      </div>
    </FadeIn>
  );
}