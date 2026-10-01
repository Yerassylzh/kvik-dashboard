import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { SettingsPageWrapper } from "@/components/dashboard/settings/SettingsPageWrapper";
import { WorkspaceForm } from "@/components/dashboard/settings/workspace/WorkspaceForm";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("dashboard");
  return {
    title: `${t("settings.company_profile_title")} — Kvik.ai`,
  };
}

export default function WorkspaceSettingsPage() {
  return (
    <SettingsPageWrapper>
      <WorkspaceForm />
    </SettingsPageWrapper>
  );
}
