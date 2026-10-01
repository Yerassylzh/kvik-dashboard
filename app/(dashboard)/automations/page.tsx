import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AutomationsPage } from "@/components/dashboard/automations/AutomationsPage";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("dashboard");
  return {
    title: `${t("nav.automations")} — Kvik.ai`,
  };
}

export default async function AutomationsRoutePage() {
  const t = await getTranslations("dashboard");
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-muted-foreground animate-pulse">{t("common.loading")}</div>}>
      <AutomationsPage />
    </Suspense>
  );
}
