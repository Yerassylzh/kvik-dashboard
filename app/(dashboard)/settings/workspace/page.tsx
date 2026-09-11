import type { Metadata } from "next";
import { SettingsPageWrapper } from "@/components/dashboard/settings/SettingsPageWrapper";
import { WorkspaceForm } from "@/components/dashboard/settings/workspace/WorkspaceForm";
import { DevOptionsCard } from "@/components/dashboard/settings/workspace/DevOptionsCard";

export const metadata: Metadata = {
  title: "Бизнес-профиль — Kvik.ai",
};

export default function WorkspaceSettingsPage() {
  return (
    <SettingsPageWrapper>
      <WorkspaceForm />
      <DevOptionsCard />
    </SettingsPageWrapper>
  );
}
