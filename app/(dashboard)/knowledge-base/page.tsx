import { Suspense } from "react";
import type { Metadata } from "next";
import { KnowledgeBaseManager } from "@/components/dashboard/settings/knowledge-base/KnowledgeBaseManager";

export const metadata: Metadata = {
  title: "База знаний и ИИ — Kvik.ai",
};

export default function KnowledgeBaseMainPage() {
  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
      <Suspense fallback={<div className="p-8 text-center text-xs text-muted-foreground animate-pulse">Загрузка базы знаний...</div>}>
        <KnowledgeBaseManager />
      </Suspense>
    </div>
  );
}
