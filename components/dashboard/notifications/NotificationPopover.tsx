"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Bell,
  CalendarCheck,
  CalendarX,
  AlertTriangle,
  UserCheck,
  LogOut,
  Info,
  Check,
  ArrowRight,
  Loader2,
} from "lucide-react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import clsx from "clsx";
import { useNotifications } from "@/hooks/useNotifications";
import { useNotificationsStore } from "@/store/notifications.store";
import type { NotificationType } from "@/lib/api/notifications";
import { formatRelativeTime } from "@/lib/utils/format";

const TYPE_ICON: Record<NotificationType, React.ComponentType<{ className?: string }>> = {
  ESCALATION: AlertTriangle,
  TAKEOVER: UserCheck,
  TAKEOVER_RELEASED: LogOut,
  NEW_BOOKING: CalendarCheck,
  BOOKING_CANCELLED: CalendarX,
  SYSTEM: Info,
};

const TYPE_COLOR: Record<NotificationType, string> = {
  ESCALATION: "bg-red-50 text-red-600 border-red-100",
  TAKEOVER: "bg-violet-50 text-primary border-violet-100",
  TAKEOVER_RELEASED: "bg-slate-50 text-slate-500 border-slate-200",
  NEW_BOOKING: "bg-emerald-50 text-emerald-600 border-emerald-100",
  BOOKING_CANCELLED: "bg-rose-50 text-rose-500 border-rose-100",
  SYSTEM: "bg-sky-50 text-sky-600 border-sky-100",
};

export function NotificationPopover() {
  const t = useTranslations("dashboard");
  const router = useRouter();
  const [open, setOpen] = useState(false);

  // Use the global store badge count (updated by WS in real-time)
  const storeUnreadCount = useNotificationsStore((s) => s.unreadCount);

  const { items, unreadCount, isLoading, markRead, markAllRead } = useNotifications();

  // Show top 5 most recent
  const previewItems = items.slice(0, 5);

  // Badge drives from WS store so it updates instantly without opening the popover
  const badgeCount = storeUnreadCount > 0 ? storeUnreadCount : unreadCount;

  const handleItemClick = async (
    id: string,
    type: NotificationType,
    conversationId?: string
  ) => {
    await markRead(id);
    setOpen(false);
    if ((type === "ESCALATION" || type === "TAKEOVER") && conversationId) {
      router.push(`/inbox?conversationId=${conversationId}`);
    }
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
          {badgeCount > 0 && (
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
            {badgeCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary font-mono tabular-nums">
                {badgeCount}
              </span>
            )}
          </div>

          {unreadCount > 0 && (
            <button
              type="button"
              onClick={() => markAllRead()}
              className="text-[11px] font-medium text-primary hover:text-primary/80 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Check className="w-3 h-3" />
              <span>{t("notifications.mark_all_read")}</span>
            </button>
          )}
        </div>

        {/* Notifications List */}
        <div className="max-h-[320px] overflow-y-auto divide-y divide-border/60 themed-scroll">
          {isLoading ? (
            <div className="py-8 flex items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
            </div>
          ) : previewItems.length === 0 ? (
            <div className="py-8 px-4 text-center">
              <p className="text-xs font-semibold text-foreground">
                {t("notifications.empty_title")}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {t("notifications.empty_desc")}
              </p>
            </div>
          ) : (
            previewItems.map((item) => {
              const Icon = TYPE_ICON[item.type] ?? Info;
              const colorCls = TYPE_COLOR[item.type] ?? TYPE_COLOR.SYSTEM;

              return (
                <div
                  key={item.id}
                  onClick={() =>
                    handleItemClick(item.id, item.type, item.data?.conversationId)
                  }
                  className={clsx(
                    "flex items-start gap-3 p-3 transition-colors cursor-pointer select-none",
                    item.isRead
                      ? "hover:bg-muted/40 opacity-75"
                      : "bg-primary/[0.02] hover:bg-primary/[0.05]"
                  )}
                >
                  <div
                    className={clsx(
                      "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 border",
                      item.isRead ? "bg-muted text-muted-foreground border-border/60" : colorCls
                    )}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p
                        className={clsx(
                          "text-xs truncate",
                          item.isRead ? "font-medium text-foreground" : "font-semibold text-foreground"
                        )}
                      >
                        {item.title}
                      </p>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap tabular-nums font-mono">
                        {formatRelativeTime(item.createdAt)}
                      </span>
                    </div>

                    <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5 leading-snug">
                      {item.body}
                    </p>
                  </div>

                  {!item.isRead && (
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
