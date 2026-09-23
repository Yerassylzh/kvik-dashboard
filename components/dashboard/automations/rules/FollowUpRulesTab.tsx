"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { AbandonmentStepCard } from "./AbandonmentStepCard";
import { QuietHoursCard } from "./QuietHoursCard";
import { AdaptiveRemindersCard } from "./AdaptiveRemindersCard";
import { ReviewRetentionCard } from "./ReviewRetentionCard";
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
  toggleMasterSwitch?: (enabled: boolean) => Promise<any>;
  isUpdating?: boolean;
}

export function FollowUpRulesTab({
  config,
  updateConfig,
  isUpdating = false,
}: FollowUpRulesTabProps) {
  const t = useTranslations("dashboard");

  return (
    <div className="space-y-5">
      {/* 2-Column Rules Grid: Balanced Customer Lifecycle */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Lead Conversion & Reminders (Before & Up to Visit) */}
        <div className="lg:col-span-7 space-y-5">
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

        {/* Right Column: Retention & System Rules (After Visit & Night Hours) */}
        <div className="lg:col-span-5 space-y-5">
          <ReviewRetentionCard
            config={config?.postVisitRetention}
            onSave={(postVisitRetention) =>
              updateConfig({ postVisitRetention }, t("automations.save_success"))
            }
            isUpdating={isUpdating}
          />

          <QuietHoursCard
            config={config?.quietHours}
            onSave={(quietHours) =>
              updateConfig({ quietHours }, t("automations.save_success"))
            }
            isUpdating={isUpdating}
          />
        </div>
      </div>
    </div>
  );
}
