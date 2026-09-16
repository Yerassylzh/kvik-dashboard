"use client";

import React, { useState } from "react";
import { Bot, Database, Zap, LineChart, HelpCircle, PlayCircle, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { DashboardPageHeader } from "@/components/dashboard/shared/DashboardPageHeader";
import { Badge } from "@/components/ui/badge";
import { KnowledgeBaseManager } from "@/components/dashboard/settings/knowledge-base/KnowledgeBaseManager";
import { AgentConfig } from "@/components/dashboard/settings/ai-agent/AgentConfig";
import { AutomationsPage } from "@/components/dashboard/automations/AutomationsPage";
import { InsightsPage } from "@/components/dashboard/insights/InsightsPage";
import { KbQualificationTab } from "@/components/dashboard/settings/knowledge-base/KbQualificationTab";
import { AiSandboxDrawer } from "@/components/dashboard/settings/ai-agent/AiSandboxDrawer";
import { BusinessContextManager } from "@/components/dashboard/settings/business-context/BusinessContextManager";
import { useKnowledgeBase } from "@/hooks/useKnowledgeBase";

import { Button } from "@/components/ui/button";

type StudioTab = "sources" | "persona" | "automations" | "insights" | "qualification" | "context";

export function AiStudioPage() {
  const t = useTranslations("dashboard");
  const [activeTab, setActiveTab] = useState<StudioTab>("sources");
  const [isSandboxOpen, setIsSandboxOpen] = useState(false);
  const { qualificationData, isQualificationLoading, mutateQualification } = useKnowledgeBase();

  return (
    <div className="space-y-4 sm:space-y-5">
      <DashboardPageHeader
        title={t("ai_studio.title")}
        description={t("ai_studio.desc")}
        badge={<Badge variant="success">Gemini 2.0</Badge>}
        actions={
          <Button
            size="sm"
            onClick={() => setIsSandboxOpen(true)}
            leftIcon={<PlayCircle className="w-3.5 h-3.5" />}
            className="text-xs"
          >
            {t("ai_studio.tab_sandbox")}
          </Button>
        }
        tabs={[
          {
            id: "sources",
            label: t("ai_studio.tab_sources"),
            icon: Database,
            active: activeTab === "sources",
            onClick: () => setActiveTab("sources"),
          },
          {
            id: "persona",
            label: t("ai_studio.tab_persona"),
            icon: Bot,
            active: activeTab === "persona",
            onClick: () => setActiveTab("persona"),
          },
          {
            id: "automations",
            label: t("ai_studio.tab_automations"),
            icon: Zap,
            active: activeTab === "automations",
            onClick: () => setActiveTab("automations"),
          },
          {
            id: "insights",
            label: t("ai_studio.tab_insights"),
            icon: LineChart,
            active: activeTab === "insights",
            onClick: () => setActiveTab("insights"),
          },
          {
            id: "qualification",
            label: t("ai_studio.tab_qualification"),
            icon: HelpCircle,
            active: activeTab === "qualification",
            onClick: () => setActiveTab("qualification"),
          },
          {
            id: "context",
            label: t("ai_studio.tab_context"),
            icon: Sparkles,
            active: activeTab === "context",
            onClick: () => setActiveTab("context"),
          },
        ]}
      />

      {/* Tab Content Canvas */}
      <div className="pt-2">
        {activeTab === "sources" && <KnowledgeBaseManager />}
        {activeTab === "persona" && <AgentConfig />}
        {activeTab === "automations" && <AutomationsPage />}
        {activeTab === "insights" && <InsightsPage />}
        {activeTab === "qualification" && (
          <KbQualificationTab
            initialData={qualificationData}
            isLoading={isQualificationLoading}
            onRefresh={mutateQualification}
          />
        )}
        {activeTab === "context" && <BusinessContextManager />}
      </div>

      {/* Live AI Sandbox Simulator Drawer */}
      <AiSandboxDrawer
        isOpen={isSandboxOpen}
        onClose={() => setIsSandboxOpen(false)}
      />
    </div>
  );
}
