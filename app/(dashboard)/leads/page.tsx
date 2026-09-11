import type { Metadata } from "next";
import { LeadsPage } from "@/components/dashboard/leads/LeadsPage";

export const metadata: Metadata = {
  title: "Лиды (CRM) — Kvik.ai",
};

export default function Page() {
  return <LeadsPage />;
}
