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
        actions={
          <div className="flex items-center gap-2.5">
            {/* Master Toggle Pill */}
            <label
              title={
                config?.enabled !== false
                  ? t("automations.master_switch_active_desc")
                  : t("automations.master_switch_paused_desc")
              }
              className="inline-flex items-center gap-2 cursor-pointer select-none px-3 py-1.5 rounded-lg border border-border/80 bg-card hover:bg-muted/40 transition-colors"
            >
              <span className="text-xs font-medium text-foreground">
                {config?.enabled !== false
                  ? t("automations.switch_active_label")
                  : t("automations.switch_paused_label")}
              </span>
              <input
                type="checkbox"
                checked={config?.enabled !== false}
                onChange={(e) => toggleMasterSwitch(e.target.checked)}
                disabled={isUpdating}
                className="sr-only peer"
              />
              <div className="w-8 h-4 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[1px] after:left-[1px] after:bg-white after:border-border after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-primary" />
            </label>

            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsTestModalOpen(true)}
              leftIcon={<PlayCircle className="w-3.5 h-3.5 text-primary" />}
              className="text-xs"
            >
              {t("automations.test_btn")}
            </Button>
          </div>
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
