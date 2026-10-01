import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { LeadsPage } from "@/components/dashboard/leads/LeadsPage";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("dashboard");
  return {
    title: `${t("nav.leads")} — Kvik.ai`,
  };
}

interface Props {
  params: Promise<{ leadId: string }>;
}

export default async function Page({ params }: Props) {
  const { leadId } = await params;
  return <LeadsPage initialLeadId={leadId} />;
}
