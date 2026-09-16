import { Suspense } from "react";
import type { Metadata } from "next";
import { IntegrationsPage } from "@/components/dashboard/integrations/IntegrationsPage";

export const metadata: Metadata = {
  title: "Каналы связи и Интеграции — Kvik.ai",
};

export default function IntegrationsRoutePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-muted-foreground animate-pulse">Загрузка интеграций...</div>}>
      <IntegrationsPage />
    </Suspense>
  );
}
