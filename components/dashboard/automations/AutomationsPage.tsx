"use client";

import React, { useState } from "react";
import { Zap, LineChart, Clock, PlayCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { DashboardPageHeader } from "@/components/dashboard/shared/DashboardPageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useFollowUpConfig } from "@/hooks/useFollowUps";
import { FollowUpRulesTab } from "./rules/FollowUpRulesTab";
import { FollowUpStatsTab } from "./stats/FollowUpStatsTab";
import { FollowUpLogsTab } from "./logs/FollowUpLogsTab";
import { FollowUpTestModal } from "./preview/FollowUpTestModal";

type AutomationTab = "rules" | "stats" | "logs";

export function AutomationsPage() {
  const t = useTranslations("dashboard");
  const { user } = useAuth();
  const workspaceId = user?.workspace?.id;

  const [activeTab, setActiveTab] = useState<AutomationTab>("rules");
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);

  const {
    config,
    isLoading: isConfigLoading,
    isUpdating,
    updateConfig,
    toggleMasterSwitch,
  } = useFollowUpConfig(workspaceId);

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title={t("automations.title")}
        description={t("automations.desc")}
        badge={<Badge variant="success">{t("automations.badge_engine")}</Badge>}
        actions={
          <Button
            size="sm"
            onClick={() => setIsTestModalOpen(true)}
            leftIcon={<PlayCircle className="w-3.5 h-3.5" />}
            className="text-xs"
          >
            {t("automations.test_btn")}
          </Button>
        }
        tabs={[
          {
            id: "rules",
            label: t("automations.tab_rules"),
            icon: Zap,
            active: activeTab === "rules",
            onClick: () => setActiveTab("rules"),
          },
          {
            id: "stats",
            label: t("automations.tab_stats"),
            icon: LineChart,
            active: activeTab === "stats",
            onClick: () => setActiveTab("stats"),
          },
          {
            id: "logs",
            label: t("automations.tab_logs"),
            icon: Clock,
            active: activeTab === "logs",
            onClick: () => setActiveTab("logs"),
          },
        ]}
      />

      {/* Main Tab Views */}
      <div className="pt-1">
        {activeTab === "rules" && (
          <>
            {isConfigLoading && !config ? (
              <div className="p-12 text-center text-xs text-muted-foreground animate-pulse">
                {t("automations.loading_config")}
              </div>
            ) : config ? (
              <FollowUpRulesTab
                config={config}
                updateConfig={updateConfig}
                toggleMasterSwitch={toggleMasterSwitch}
                isUpdating={isUpdating}
              />
            ) : null}
          </>
        )}

        {activeTab === "stats" && <FollowUpStatsTab workspaceId={workspaceId} />}

        {activeTab === "logs" && <FollowUpLogsTab workspaceId={workspaceId} />}
      </div>

      {/* Live AI Simulation Modal */}
      <FollowUpTestModal
        workspaceId={workspaceId}
        isOpen={isTestModalOpen}
        onClose={() => setIsTestModalOpen(false)}
      />
    </div>
  );
}
