import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { OverviewPage } from "@/components/dashboard/overview/OverviewPage";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("dashboard");
  return {
    title: `${t("nav.overview")} — Kvik.ai`,
  };
}

export default function Page() {
  return <OverviewPage />;
}
