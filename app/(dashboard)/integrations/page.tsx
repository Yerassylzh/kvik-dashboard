import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { IntegrationsPage } from "@/components/dashboard/integrations/IntegrationsPage";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("dashboard");
  return {
    title: `${t("nav.integrations")} — Kvik.ai`,
  };
}

export default async function IntegrationsRoutePage() {
  const t = await getTranslations("dashboard");
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-muted-foreground animate-pulse">{t("common.loading")}</div>}>
      <IntegrationsPage />
    </Suspense>
  );
}
