import type { Metadata } from "next";
import { LeadsPage } from "@/components/dashboard/leads/LeadsPage";

export const metadata: Metadata = {
  title: "Лид — Kvik.ai",
};

interface Props {
  params: Promise<{ leadId: string }>;
}

export default async function Page({ params }: Props) {
  const { leadId } = await params;
  return <LeadsPage initialLeadId={leadId} />;
}
