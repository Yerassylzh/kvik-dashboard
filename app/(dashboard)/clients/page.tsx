import { Suspense } from "react";
import type { Metadata } from "next";
import { ClientsPage } from "@/components/dashboard/clients/ClientsPage";

export const metadata: Metadata = {
  title: "Клиенты и CRM — Kvik.ai",
};

export default function ClientsRoutePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-muted-foreground animate-pulse">Загрузка клиентов...</div>}>
      <ClientsPage />
    </Suspense>
  );
}
