import type { Metadata } from "next";
import { SettingsPageWrapper } from "@/components/dashboard/settings/SettingsPageWrapper";
import { AdvancedSettings } from "@/components/dashboard/settings/advanced/AdvancedSettings";

export const metadata: Metadata = {
  title: "Продвинутые настройки — Kvik.ai",
};

export default function AdvancedSettingsPage() {
  return (
    <SettingsPageWrapper>
      <AdvancedSettings />
    </SettingsPageWrapper>
  );
}
