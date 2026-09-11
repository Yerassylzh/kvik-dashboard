import type { Metadata } from "next";
import { DevMessagingPage } from "@/components/dashboard/dev-messaging/DevMessagingPage";

export const metadata: Metadata = {
  title: "Dev: Mock Messaging — Kvik.ai",
};

export default function DevMessagingRoute() {
  return <DevMessagingPage />;
}
