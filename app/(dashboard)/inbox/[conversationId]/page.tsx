import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { InboxPage } from "@/components/dashboard/inbox/InboxPage";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("dashboard");
  return {
    title: `${t("nav.inbox")} — Kvik.ai`,
  };
}

interface Props {
  params: Promise<{ conversationId: string }>;
}

export default async function Page({ params }: Props) {
  const { conversationId } = await params;
  return <InboxPage initialConversationId={conversationId} />;
}
