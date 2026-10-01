import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { NotificationsPage } from "@/components/dashboard/notifications/NotificationsPage";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("dashboard");
  return {
    title: `${t("notifications.title")} — Kvik.ai`,
  };
}

export default function Page() {
  return <NotificationsPage />;
}
