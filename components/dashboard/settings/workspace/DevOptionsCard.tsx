"use client";

import React from "react";
import { Terminal, FlaskConical, AlertTriangle } from "lucide-react";
import { useTranslations } from "next-intl";
import { SectionCard } from "@/components/dashboard/shared/SectionCard";
import { Button } from "@/components/ui/button";
import { useDevMode, isDevEnvironment } from "@/hooks/useDevMode";

/**
 * Developer Options card — only rendered when NODE_ENV === "development".
 * Toggles the dev mode flag in localStorage which reveals the mock messaging
 * simulator in the sidebar navigation.
 */
export function DevOptionsCard() {
  const t = useTranslations("dashboard");
  const { isDevMode, toggle } = useDevMode();

  // Hard-gate: never render outside development
  if (!isDevEnvironment()) return null;

  return (
    <SectionCard
      title={t("settings.dev_options_title")}
      description={t("settings.dev_options_desc")}
      className="max-w-2xl border-amber-500/30 bg-amber-500/5"
    >
      {/* Warning banner */}
      <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 mb-4">
        <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
        <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">
          {t("settings.dev_options_warning")}
        </p>
      </div>

      {/* Status indicator + toggle */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className={`h-8 w-8 rounded-lg flex items-center justify-center transition-colors ${
              isDevMode
                ? "bg-emerald-500/15 text-emerald-500"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {isDevMode ? (
              <FlaskConical className="w-4 h-4" />
            ) : (
              <Terminal className="w-4 h-4" />
            )}
          </div>
          <div>
            <p className="text-xs font-semibold text-foreground">
              {isDevMode ? t("settings.dev_options_disable") : t("settings.dev_options_enable")}
            </p>
            {isDevMode && (
              <p className="text-[10px] text-emerald-500 font-medium mt-0.5">
                {t("dev_messaging.warning_banner")}
              </p>
            )}
          </div>
        </div>

        <Button
          type="button"
          size="sm"
          variant={isDevMode ? "destructive" : "outline"}
          onClick={toggle}
          leftIcon={<FlaskConical className="w-3.5 h-3.5" />}
          className="shrink-0 text-xs font-semibold"
        >
          {isDevMode ? t("settings.dev_options_disable") : t("settings.dev_options_enable")}
        </Button>
      </div>
    </SectionCard>
  );
}
