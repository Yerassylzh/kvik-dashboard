import type { Metadata } from "next";
import { SettingsPageWrapper } from "@/components/dashboard/settings/SettingsPageWrapper";
import { AgentConfig } from "@/components/dashboard/settings/ai-agent/AgentConfig";

export const metadata: Metadata = {
  title: "ИИ-Агент и промпт — Kvik.ai",
};

export default function AiAgentSettingsPage() {
  return (
    <SettingsPageWrapper>
      <AgentConfig />
    </SettingsPageWrapper>
  );
}
