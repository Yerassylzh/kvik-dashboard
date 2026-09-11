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
    <FadeIn direction="up" distance={20} duration={0.25} className="space-y-6">
      <PageHeader
        title={t("settings.title")}
        description={t("page.settings_desc")}
      />

      <div className="flex flex-col lg:flex-row items-start gap-6">
        <SettingsNav />
        <div className="flex-1 w-full min-w-0">{children}</div>
      </div>
    </FadeIn>
  );
}
