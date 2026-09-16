import { Suspense } from "react";
import type { Metadata } from "next";
import { InsightsPage } from "@/components/dashboard/insights/InsightsPage";

export const metadata: Metadata = {
  title: "Анализ диалогов и ИИ-Инсайты — Kvik.ai",
};

export default function InsightsRoutePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-muted-foreground animate-pulse">Загрузка аналитики диалогов...</div>}>
      <InsightsPage />
    </Suspense>
  );
}
