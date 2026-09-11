import type { Metadata } from "next";
import { SettingsPageWrapper } from "@/components/dashboard/settings/SettingsPageWrapper";
import { ChannelsManager } from "@/components/dashboard/settings/channels/ChannelsManager";

export const metadata: Metadata = {
  title: "Каналы связи — Kvik.ai",
};

export default function ChannelsSettingsPage() {
  return (
    <SettingsPageWrapper>
      <ChannelsManager />
    </SettingsPageWrapper>
  );
}
