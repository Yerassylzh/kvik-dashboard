import { Suspense } from "react";
import type { Metadata } from "next";
import { AutomationsPage } from "@/components/dashboard/automations/AutomationsPage";

export const metadata: Metadata = {
  title: "Автоматизации и дожим — Kvik.ai",
};

export default function AutomationsRoutePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-muted-foreground animate-pulse">Загрузка автоматизаций...</div>}>
      <AutomationsPage />
    </Suspense>
  );
}
