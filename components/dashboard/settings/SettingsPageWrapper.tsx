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
  return (
    <FadeIn direction="up" distance={8} duration={0.2} className="space-y-4 max-w-5xl">
      <SettingsNav />
      <div className="w-full pt-1">{children}</div>
    </FadeIn>
  );
}
