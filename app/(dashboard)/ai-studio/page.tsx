import { Suspense } from "react";
import type { Metadata } from "next";
import { AiStudioPage } from "@/components/dashboard/ai-studio/AiStudioPage";

export const metadata: Metadata = {
  title: "ИИ-Студия и База знаний — Kvik.ai",
};

export default function AiStudioRoutePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-muted-foreground animate-pulse">Загрузка ИИ-Студии...</div>}>
      <AiStudioPage />
    </Suspense>
  );
}
