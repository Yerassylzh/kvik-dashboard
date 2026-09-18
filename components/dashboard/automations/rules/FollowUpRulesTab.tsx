"use client";

import React from "react";
import { Zap } from "lucide-react";
import { useTranslations } from "next-intl";
import { AbandonmentStepCard } from "./AbandonmentStepCard";
import { QuietHoursCard } from "./QuietHoursCard";
import { AdaptiveRemindersCard } from "./AdaptiveRemindersCard";
import { ReviewRetentionCard } from "./ReviewRetentionCard";
import { ChannelPolicyStatusCard } from "./ChannelPolicyStatusCard";
import type {
  FollowUpConfigDto,
  UpdateFollowUpConfigPayload,
} from "@/lib/api/followUps";

interface FollowUpRulesTabProps {
  config: FollowUpConfigDto;
  updateConfig: (
    payload: UpdateFollowUpConfigPayload,
    successMessage?: string
  ) => Promise<any>;
  toggleMasterSwitch: (enabled: boolean) => Promise<any>;
  isUpdating?: boolean;
}

export function FollowUpRulesTab({
  config,
  updateConfig,
  toggleMasterSwitch,
  isUpdating = false,
}: FollowUpRulesTabProps) {
  const t = useTranslations("dashboard");

  return (
    <div className="space-y-6">
      {/* Master Toggle Banner */}
      <div className="p-4 rounded-xl border border-border/80 bg-card flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              {config?.enabled
                ? t("automations.master_switch_enabled")
                : t("automations.master_switch_disabled")}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {config?.enabled
                ? t("automations.worker_active_desc")
                : t("automations.worker_paused_desc")}
            </p>
          </div>
        </div>

        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={config?.enabled ?? true}
            onChange={(e) => toggleMasterSwitch(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
        </label>
      </div>

      {/* 2-Column Rules Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Sequences & Reminders */}
        <div className="lg:col-span-7 space-y-6">
          <AbandonmentStepCard
            config={config?.abandonmentSequence}
            onSave={(abandonmentSequence) =>
              updateConfig({ abandonmentSequence }, t("automations.save_success"))
            }
            isUpdating={isUpdating}
          />

          <AdaptiveRemindersCard
            config={config?.appointmentReminders}
            onSave={(appointmentReminders) =>
              updateConfig({ appointmentReminders }, t("automations.save_success"))
            }
            isUpdating={isUpdating}
          />
        </div>

        {/* Right Column: Quiet Hours, 2GIS, Channel Policies */}
        <div className="lg:col-span-5 space-y-6">
          <QuietHoursCard
            config={config?.quietHours}
            onSave={(quietHours) =>
              updateConfig({ quietHours }, t("automations.save_success"))
            }
            isUpdating={isUpdating}
          />

          <ReviewRetentionCard
            config={config?.postVisitRetention}
            onSave={(postVisitRetention) =>
              updateConfig({ postVisitRetention }, t("automations.save_success"))
            }
            isUpdating={isUpdating}
          />

          <ChannelPolicyStatusCard channels={config?.channels} />
        </div>
      </div>
    </div>
  );
}
