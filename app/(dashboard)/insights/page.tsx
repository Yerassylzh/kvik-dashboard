import { Suspense } from "react";
import type { Metadata } from "next";
import { InsightsPage } from "@/components/dashboard/insights/InsightsPage";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("dashboard");
  return {
    title: `${t("nav.insights")} — Kvik.ai`,
  };
}

export default async function InsightsRoutePage() {
  const t = await getTranslations("insights");
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-muted-foreground animate-pulse">{t("loading")}</div>}>
      <InsightsPage />
    </Suspense>
  );
}
