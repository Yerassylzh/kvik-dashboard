"use client";

import React, { useState } from "react";
import { Bot, Database, HelpCircle, PlayCircle, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { DashboardPageHeader } from "@/components/dashboard/shared/DashboardPageHeader";
import { Button } from "@/components/ui/button";
import { KnowledgeBaseManager } from "@/components/dashboard/settings/knowledge-base/KnowledgeBaseManager";
import { AgentConfig } from "@/components/dashboard/settings/ai-agent/AgentConfig";
import { KbQualificationTab } from "@/components/dashboard/settings/knowledge-base/KbQualificationTab";
import { AiSandboxDrawer } from "@/components/dashboard/settings/ai-agent/AiSandboxDrawer";
import { BusinessContextManager } from "@/components/dashboard/settings/business-context/BusinessContextManager";
import { useKnowledgeBase } from "@/hooks/useKnowledgeBase";

type StudioTab = "sources" | "persona" | "qualification" | "context";

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
