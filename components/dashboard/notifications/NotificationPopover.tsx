"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  Bell,
  CalendarCheck,
  Bot,
  MessageSquare,
  Clock,
  ArrowRight,
  Check,
} from "lucide-react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import clsx from "clsx";

interface NotificationPreviewItem {
  id: string;
  title: string;
  description: string;
  category: "bookings" | "system" | "channels";
  timestamp: string;
  read: boolean;
  icon: React.ComponentType<{ className?: string }>;
}

const initialNotifications: NotificationPreviewItem[] = [
  {
    id: "1",
    title: "Новая запись через ИИ",
    description: "Алина Смирнова на 'Чистка лица' к мастеру Елена на 18:00",
    category: "bookings",
    timestamp: "10 мин назад",
    read: false,
    icon: CalendarCheck,
  },
  {
    id: "2",
    title: "WhatsApp канал активен",
    description: "WhatsApp Cloud API успешно подключен для текущего филиала",
    category: "channels",
    timestamp: "2 часа назад",
    read: false,
    icon: MessageSquare,
  },
  {
    id: "3",
    title: "ИИ обработал обращение",
    description: "Консультация по стоимости услуг завершена без участия менеджера",
    category: "system",
    timestamp: "4 часа назад",
    read: true,
    icon: Bot,
  },
  {
    id: "4",
    title: "Перенос записи",
    description: "Арман Ержанов перенес запись на 16:30",
    category: "bookings",
    timestamp: "Вчера",
    read: true,
    icon: Clock,
  },
];

export function NotificationPopover() {
  const t = useTranslations("dashboard");
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationPreviewItem[]>(initialNotifications);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markItemAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          title={t("header.notifications_tooltip")}
          className="relative p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary ring-2 ring-card" />
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-[340px] sm:w-[380px] p-0 rounded-xl border border-border/80 bg-card shadow-xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/70 bg-muted/20">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-foreground">
              {t("notifications.popover_title")}
            </span>
            {unreadCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary font-mono">
                {unreadCount}
              </span>
            )}
          </div>

          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllAsRead}
              className="text-[11px] font-medium text-primary hover:text-primary/80 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Check className="w-3 h-3" />
              <span>{t("notifications.mark_all_read")}</span>
            </button>
          )}
        </div>

        {/* Notifications List */}
        <div className="max-h-[320px] overflow-y-auto divide-y divide-border/60 themed-scroll">
          {notifications.length === 0 ? (
            <div className="py-8 px-4 text-center">
              <p className="text-xs font-semibold text-foreground">
                {t("notifications.empty_title")}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {t("notifications.empty_desc")}
              </p>
            </div>
          ) : (
            notifications.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.id}
                  onClick={() => markItemAsRead(item.id)}
                  className={clsx(
                    "flex items-start gap-3 p-3 transition-colors cursor-pointer select-none",
                    item.read
                      ? "hover:bg-muted/40 opacity-75"
                      : "bg-primary/[0.02] hover:bg-primary/[0.05]"
                  )}
                >
                  <div
                    className={clsx(
                      "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
                      item.category === "bookings" && "bg-violet-50 text-primary border border-violet-100",
                      item.category === "channels" && "bg-emerald-50 text-emerald-600 border border-emerald-100",
                      item.category === "system" && "bg-sky-50 text-sky-600 border border-sky-100"
                    )}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p
                        className={clsx(
                          "text-xs truncate",
                          item.read
                            ? "font-medium text-foreground"
                            : "font-semibold text-foreground"
                        )}
                      >
                        {item.title}
                      </p>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap tabular-nums">
                        {item.timestamp}
                      </span>
                    </div>

                    <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5 leading-snug">
                      {item.description}
                    </p>
                  </div>

                  {!item.read && (
                    <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-2" />
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-2.5 border-t border-border/70 bg-muted/10 text-center">
          <Link
            href="/notifications"
            onClick={() => setOpen(false)}
            className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors w-full py-1 rounded-lg hover:bg-muted/40 cursor-pointer"
          >
            <span>{t("notifications.view_all")}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
