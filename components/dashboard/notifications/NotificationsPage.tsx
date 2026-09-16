"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Bell,
  CalendarCheck,
  Bot,
  MessageSquare,
  CheckCircle2,
  Clock,
  Check,
} from "lucide-react";
import { FadeIn } from "@/components/ui/motion/FadeIn";
import { DashboardPageHeader } from "@/components/dashboard/shared/DashboardPageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import clsx from "clsx";

interface NotificationItem {
  id: string;
  title: string;
  description: string;
  category: "bookings" | "system" | "channels";
  timestamp: string;
  read: boolean;
  icon: React.ComponentType<{ className?: string }>;
}

const mockNotifications: NotificationItem[] = [
  {
    id: "1",
    title: "Новая запись через ИИ",
    description: "Клиент Алина Смирнова записана на 'Чистка лица' к мастеру Елена на 18:00",
    category: "bookings",
    timestamp: "10 мин назад",
    read: false,
    icon: CalendarCheck,
  },
  {
    id: "2",
    title: "WhatsApp канал подключен",
    description: "Интеграция WhatsApp Cloud API успешно активирована для филиала 'Алматы Центр'",
    category: "channels",
    timestamp: "2 часа назад",
    read: false,
    icon: MessageSquare,
  },
  {
    id: "3",
    title: "ИИ-Агент обработал диалог",
    description: "Вопрос по стоимости услуг был успешно закрыт без вмешательства администратора",
    category: "system",
    timestamp: "4 часа назад",
    read: true,
    icon: Bot,
  },
  {
    id: "4",
    title: "Перенос записи",
    description: "Клиент Арман Ержанов перенес запись с 15:00 на 16:30",
    category: "bookings",
    timestamp: "Вчера",
    read: true,
    icon: Clock,
  },
  {
    id: "5",
    title: "Синхронизация базы знаний",
    description: "Прайс-лист и правила компании успешно проиндексированы",
    category: "system",
    timestamp: "2 дня назад",
    read: true,
    icon: CheckCircle2,
  },
];

const categoryBadgeStyles: Record<string, { labelKey: string; variant: "primary" | "info" | "success" | "default" }> = {
  bookings: { labelKey: "notifications.tab_bookings", variant: "primary" },
  system: { labelKey: "notifications.tab_system", variant: "info" },
  channels: { labelKey: "notifications.tab_channels", variant: "success" },
};

export function NotificationsPage() {
  const t = useTranslations("dashboard");
  const [activeCategory, setActiveCategory] = useState<"all" | "bookings" | "system" | "channels">("all");
  const [notifications, setNotifications] = useState<NotificationItem[]>(mockNotifications);

  const filtered = notifications.filter(
    (n) => activeCategory === "all" || n.category === activeCategory
  );

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  return (
    <FadeIn direction="up" distance={10} duration={0.2} className="space-y-4 sm:space-y-5 max-w-4xl">
      <DashboardPageHeader
        title={t("notifications.title")}
        description={t("notifications.desc")}
        badge={
          unreadCount > 0 ? (
            <Badge variant="primary">
              {unreadCount}
            </Badge>
          ) : undefined
        }
        actions={
          unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={markAllAsRead}
              leftIcon={<Check className="w-3.5 h-3.5" />}
              className="text-xs"
            >
              {t("notifications.mark_all_read")}
            </Button>
          )
        }
        tabs={[
          {
            id: "all",
            label: t("notifications.tab_all"),
            count: notifications.length,
            active: activeCategory === "all",
            onClick: () => setActiveCategory("all"),
          },
          {
            id: "bookings",
            label: t("notifications.tab_bookings"),
            count: notifications.filter((n) => n.category === "bookings").length,
            active: activeCategory === "bookings",
            onClick: () => setActiveCategory("bookings"),
          },
          {
            id: "system",
            label: t("notifications.tab_system"),
            count: notifications.filter((n) => n.category === "system").length,
            active: activeCategory === "system",
            onClick: () => setActiveCategory("system"),
          },
          {
            id: "channels",
            label: t("notifications.tab_channels"),
            count: notifications.filter((n) => n.category === "channels").length,
            active: activeCategory === "channels",
            onClick: () => setActiveCategory("channels"),
          },
        ]}
      />

      {/* Notification Rows List (MoonAI Style) */}
      <div className="rounded-xl border border-border/80 bg-card overflow-hidden divide-y divide-border/60">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-xs text-muted-foreground">
            <Bell className="w-8 h-8 mx-auto mb-2 opacity-30 text-primary" />
            <p>{t("notifications.empty")}</p>
          </div>
        ) : (
          filtered.map((item) => {
            const Icon = item.icon;
            const categoryInfo = categoryBadgeStyles[item.category];

            return (
              <div
                key={item.id}
                onClick={() => markAsRead(item.id)}
                className={clsx(
                  "p-3.5 sm:p-4 flex items-start gap-3.5 transition-colors cursor-pointer",
                  item.read ? "bg-card hover:bg-muted/30" : "bg-primary/[0.02] hover:bg-primary/[0.05]"
                )}
              >
                <div
                  className={clsx(
                    "h-8 w-8 rounded-lg flex items-center justify-center shrink-0 border",
                    item.read
                      ? "bg-muted text-muted-foreground border-border/70"
                      : "bg-primary/10 text-primary border-primary/20"
                  )}
                >
                  <Icon className="w-4 h-4" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={clsx(
                        "text-xs font-semibold leading-tight",
                        item.read ? "text-foreground" : "text-foreground font-bold"
                      )}
                    >
                      {item.title}
                    </span>
                    {categoryInfo && (
                      <Badge variant={categoryInfo.variant} className="text-[9px] px-1.5 py-0">
                        {t(categoryInfo.labelKey as any)}
                      </Badge>
                    )}
                    {!item.read && (
                      <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 ml-auto sm:ml-0" />
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="shrink-0 text-right">
                  <span className="text-[11px] text-muted-foreground font-mono">
                    {item.timestamp}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </FadeIn>
  );
}