import type { Metadata } from "next";
import { InboxPage } from "@/components/dashboard/inbox/InboxPage";

export const metadata: Metadata = {
  title: "Диалоги — Kvik.ai",
};

export default function Page() {
  return <InboxPage />;
}
