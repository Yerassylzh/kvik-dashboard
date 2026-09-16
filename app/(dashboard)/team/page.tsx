import { Suspense } from "react";
import type { Metadata } from "next";
import { TeamPage } from "@/components/dashboard/team/TeamPage";

export const metadata: Metadata = {
  title: "Команда и специалисты — Kvik.ai",
};

export default function TeamRoutePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-muted-foreground animate-pulse">Загрузка команды...</div>}>
      <TeamPage />
    </Suspense>
  );
}
