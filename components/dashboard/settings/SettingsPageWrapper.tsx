"use client";

import React, { useMemo } from "react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { FadeIn } from "@/components/ui/motion/FadeIn";
import { DashboardPageHeader, type DashboardTabItem } from "@/components/dashboard/shared/DashboardPageHeader";
import { useRBAC } from "@/hooks/useRBAC";
import { settingsNavItems } from "./SettingsNav";

interface SettingsPageWrapperProps {
  children: React.ReactNode;
}

export function SettingsPageWrapper({ children }: SettingsPageWrapperProps) {
  const t = useTranslations("dashboard");
  const pathname = usePathname();
  const { systemRole, isMounted } = useRBAC();

  const tabs: DashboardTabItem[] = useMemo(() => {
    if (!isMounted) return [];
    return settingsNavItems
      .filter((item) => item.roles.includes(systemRole))
      .map((item) => ({
        id: item.href,
        label: t(item.labelKey as any),
        href: item.href,
        active: pathname === item.href,
        icon: item.icon,
      }));
  }, [isMounted, pathname, systemRole, t]);

  return (
    <FadeIn direction="up" distance={8} duration={0.2} className="space-y-6 max-w-4xl">
      <DashboardPageHeader
        title={t("settings.title")}
        description={t("settings.desc")}
        tabs={tabs}
      />
      <div className="w-full">{children}</div>
    </FadeIn>
  );
}
