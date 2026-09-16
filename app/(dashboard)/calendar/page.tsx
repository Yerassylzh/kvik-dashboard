import { Suspense } from "react";
import type { Metadata } from "next";
import { CalendarPage } from "@/components/dashboard/calendar/CalendarPage";

export const metadata: Metadata = {
  title: "Календарь и записи — Kvik.ai",
};

export default function CalendarRoutePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-muted-foreground animate-pulse">Загрузка календаря...</div>}>
      <CalendarPage />
    </Suspense>
  );
}
