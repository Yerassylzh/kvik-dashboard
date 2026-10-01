import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { SettingsPageWrapper } from "@/components/dashboard/settings/SettingsPageWrapper";
import { ChangePasswordForm } from "@/components/dashboard/settings/account/ChangePasswordForm";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("dashboard");
  return {
    title: `${t("settings.account_title")} — Kvik.ai`,
  };
}

export default function AccountSettingsPage() {
  return (
    <SettingsPageWrapper>
      <ChangePasswordForm />
    </SettingsPageWrapper>
  );
}
