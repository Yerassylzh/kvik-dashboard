import { Suspense } from "react";
import type { Metadata } from "next";
import { SchedulePage } from "@/components/dashboard/schedule/SchedulePage";

export const metadata: Metadata = {
  title: "График работы филиала — Kvik.ai",
};

export default function ScheduleRoutePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-muted-foreground animate-pulse">Загрузка графика...</div>}>
      <SchedulePage />
    </Suspense>
  );
}
