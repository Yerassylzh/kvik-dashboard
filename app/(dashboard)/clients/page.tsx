import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ClientsPage } from "@/components/dashboard/clients/ClientsPage";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("dashboard");
  return {
    title: `${t("nav.clients")} — Kvik.ai`,
  };
}

export default async function ClientsRoutePage() {
  const t = await getTranslations("dashboard");
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-muted-foreground animate-pulse">{t("common.loading")}</div>}>
      <ClientsPage />
    </Suspense>
  );
}
