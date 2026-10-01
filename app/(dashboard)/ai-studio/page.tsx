import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AiStudioPage } from "@/components/dashboard/ai-studio/AiStudioPage";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("dashboard");
  return {
    title: `${t("nav.ai_studio")} — Kvik.ai`,
  };
}

export default async function AiStudioRoutePage() {
  const t = await getTranslations("dashboard");
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-muted-foreground animate-pulse">{t("common.loading")}</div>}>
      <AiStudioPage />
    </Suspense>
  );
}
