"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { FadeIn } from "@/components/ui/motion/FadeIn";
import { PageHeader } from "@/components/dashboard/shared/PageHeader";
import { SettingsNav } from "./SettingsNav";

interface SettingsPageWrapperProps {
  children: React.ReactNode;
}

export function SettingsPageWrapper({ children }: SettingsPageWrapperProps) {
  const t = useTranslations("dashboard");

  return (
    <FadeIn direction="up" distance={20} duration={0.25} className="space-y-6 max-w-5xl">
      <PageHeader
        title={t("settings.title")}
        description={t("page.settings_desc")}
      />

      <SettingsNav />

      <div className="w-full pt-1">{children}</div>
    </FadeIn>
  );
}
