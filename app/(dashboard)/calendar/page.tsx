import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { CalendarPage } from "@/components/dashboard/calendar/CalendarPage";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("dashboard");
  return {
    title: `${t("nav.calendar")} — Kvik.ai`,
  };
}

export default async function CalendarRoutePage() {
  const t = await getTranslations("dashboard");
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-muted-foreground animate-pulse">{t("common.loading")}</div>}>
      <CalendarPage />
    </Suspense>
  );
}
