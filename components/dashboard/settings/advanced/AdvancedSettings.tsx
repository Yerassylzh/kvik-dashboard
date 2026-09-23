"use client";

import React, { useState } from "react";
import {
  Server,
  Activity,
  Copy,
  Check,
  Radio,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { SectionCard } from "@/components/dashboard/shared/SectionCard";
import { Button } from "@/components/ui/button";
import { DevOptionsCard } from "@/components/dashboard/settings/workspace/DevOptionsCard";
import { useBusinessContext } from "@/hooks/useBusinessContext";

export function AdvancedSettings() {
  const t = useTranslations("dashboard");
  const { context } = useBusinessContext();
  const [copied, setCopied] = useState(false);

  const rawJsonString = context ? JSON.stringify(context, null, 2) : "{}";

  const handleCopy = () => {
    navigator.clipboard.writeText(rawJsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Dev Mode toggle card */}
      <DevOptionsCard />

      {/* System Status Card */}
      <SectionCard
        title={t("settings.adv_env_title")}
        description={t("settings.adv_env_desc")}
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {/* Status item 1 */}
          <div className="p-3.5 rounded-xl bg-card border border-border/60 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-emerald-500" />
                <span>{t("settings.adv_system_status")}</span>
              </span>
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
            </div>
            <p className="text-xs font-semibold text-foreground">
              {t("settings.adv_system_status_ok")}
            </p>
          </div>

          {/* Status item 2 */}
          <div className="p-3.5 rounded-xl bg-card border border-border/60 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-primary" />
                <span>{t("settings.adv_api_endpoint")}</span>
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold">
                {t("settings.adv_status_active")}
              </span>
            </div>
            <p className="text-xs font-semibold text-foreground">
              {t("settings.adv_connected")}
            </p>
          </div>

          {/* Status item 3 */}
          <div className="p-3.5 rounded-xl bg-card border border-border/60 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-primary" />
                <span>{t("settings.adv_socket_status")}</span>
              </span>
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
            </div>
            <p className="text-xs font-semibold text-foreground">
              {t("settings.adv_connected")}
            </p>
          </div>
        </div>
      </SectionCard>

      {/* Business Context Data Inspector */}
      <SectionCard
        title={t("settings.adv_raw_json")}
        description={t("settings.adv_raw_json_desc")}
        action={
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="gap-1.5 text-xs border-border/60"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-emerald-500 font-medium">
                  {t("settings.adv_copied")}
                </span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                <span>{t("settings.adv_copy_json")}</span>
              </>
            )}
          </Button>
        }
      >
        <div className="pt-2">
          <pre className="p-4 rounded-xl bg-muted/40 border border-border/50 text-[11px] font-mono text-muted-foreground overflow-x-auto max-h-72 themed-scroll">
            <code>{rawJsonString}</code>
          </pre>
        </div>
      </SectionCard>
    </div>
  );
}
