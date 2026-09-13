import { redirect } from "next/navigation";

export default function AiAgentSettingsPage() {
  redirect("/knowledge-base?tab=ai-agent");
}
