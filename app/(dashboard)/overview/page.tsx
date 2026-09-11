import type { Metadata } from "next";
import { OverviewPage } from "@/components/dashboard/overview/OverviewPage";

export const metadata: Metadata = {
  title: "Обзор — Kvik.ai",
};

export default function Page() {
  return <OverviewPage />;
}
