import type { Metadata } from "next";
import { NotificationsPage } from "@/components/dashboard/notifications/NotificationsPage";

export const metadata: Metadata = {
  title: "Уведомления — Kvik.ai",
};

export default function Page() {
  return <NotificationsPage />;
}
