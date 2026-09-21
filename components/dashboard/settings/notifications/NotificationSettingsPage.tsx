"use client";

import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Bell, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { DashboardPageHeader } from "@/components/dashboard/shared/DashboardPageHeader";
import { FadeIn } from "@/components/ui/motion/FadeIn";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TelegramRecipientsCard } from "./TelegramRecipientsCard";
import { toast } from "sonner";

export function NotificationSettingsPage() {
  const t = useTranslations("dashboard");
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");

  useEffect(() => {
    if (typeof window !== "undefined") {
      if ("Notification" in window) {
        setPermission(Notification.permission);
      } else {
        setPermission("unsupported");
      }
    }
  }, []);

  const handleRequestPermission = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    try {
      const res = await Notification.requestPermission();
      setPermission(res);
      if (res === "granted") {
        toast.success(t("settings.notifications.push_granted_toast"));
        new Notification(t("settings.notifications.push_test_title"), {
          body: t("settings.notifications.push_test_body"),
          icon: "/favicon.ico",
        });
      } else if (res === "denied") {
        toast.error(t("settings.notifications.push_denied_toast"));
      }
    } catch {
      toast.error(t("settings.notifications.push_error_toast"));
    }
  };

  return (
    <FadeIn direction="up" distance={8} duration={0.2} className="space-y-6 max-w-4xl">
      <DashboardPageHeader
        title={t("settings.notifications_title")}
        description={t("settings.notifications_desc")}
      />

      <div className="space-y-4">
        {/* Browser Push Notifications Card */}
        <div className="rounded-xl border border-border/80 bg-card p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary mt-0.5 shrink-0">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-foreground">
                    {t("settings.notifications.browser_push_title")}
                  </h3>
                  {permission === "granted" && (
                    <Badge variant="success" className="text-[10px] gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                      {t("settings.notifications.permission_granted")}
                    </Badge>
                  )}
                  {permission === "denied" && (
                    <Badge variant="destructive" className="text-[10px] gap-1">
                      <XCircle className="w-3 h-3 text-destructive" />
                      {t("settings.notifications.permission_denied")}
                    </Badge>
                  )}
                  {permission === "default" && (
                    <Badge variant="warning" className="text-[10px] gap-1">
                      <AlertCircle className="w-3 h-3 text-amber-500" />
                      {t("settings.notifications.permission_default")}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {t("settings.notifications.browser_push_desc")}
                </p>
              </div>
            </div>

            {permission === "default" && (
              <Button
                size="sm"
                onClick={handleRequestPermission}
                className="text-xs shrink-0"
              >
                {t("settings.notifications.enable_push_btn")}
              </Button>
            )}

            {permission === "granted" && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  new Notification(t("settings.notifications.push_test_title"), {
                    body: t("settings.notifications.push_test_body"),
                    icon: "/favicon.ico",
                  });
                  toast.success(t("settings.notifications.push_test_sent"));
                }}
                className="text-xs shrink-0"
              >
                {t("settings.notifications.test_push_btn")}
              </Button>
            )}
          </div>
        </div>

        {/* Telegram Recipients Card */}
        <TelegramRecipientsCard />
      </div>
    </FadeIn>
  );
}
