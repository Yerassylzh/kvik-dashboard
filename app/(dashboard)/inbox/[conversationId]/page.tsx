import type { Metadata } from "next";
import { InboxPage } from "@/components/dashboard/inbox/InboxPage";

export const metadata: Metadata = {
  title: "Диалог — Kvik.ai",
};

interface Props {
  params: Promise<{ conversationId: string }>;
}

export default async function Page({ params }: Props) {
  const { conversationId } = await params;
  return <InboxPage initialConversationId={conversationId} />;
}
