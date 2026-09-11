"use client";

import React, { useState } from "react";
import { Bot, Sparkles, Check, Play, Save } from "lucide-react";
import { useTranslations } from "next-intl";
import { SectionCard } from "@/components/dashboard/shared/SectionCard";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AiSandboxDrawer } from "./AiSandboxDrawer";
import { useAiEngine } from "@/hooks/useAiEngine";

export function AgentConfig() {
  const t = useTranslations("dashboard");
  const { config, updateConfig } = useAiEngine();

  const [customInstructions, setCustomInstructions] = useState(
    "Приветствуй клиентов с заботой, предлагай скидку 10% на первый визит и всегда уточняй удобное время для записи."
  );
  const [overflowTimeout, setOverflowTimeout] = useState(30);
  const [followUp24h, setFollowUp24h] = useState(true);
  const [followUp72h, setFollowUp72h] = useState(true);

  const [isSaved, setIsSaved] = useState(false);
  const [isSandboxOpen, setIsSandboxOpen] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateConfig({
      customInstructions,
      liveOverflowTimeoutSeconds: overflowTimeout,
      followUp24hEnabled: followUp24h,
      followUp72hEnabled: followUp72h,
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <SectionCard
        title="Поведение и инструкции ИИ-Агента"
        description="Настройка промпта, логики перехвата менеджером и автоматических дожимов"
        action={
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsSandboxOpen(true)}
            className="gap-1.5 text-xs border-primary/30 text-primary hover:bg-primary/10"
          >
            <Play className="w-3.5 h-3.5" />
            <span>{t("overview.ai_test_dialogue")}</span>
          </Button>
        }
      >
        <form onSubmit={handleSave} className="space-y-5 pt-2">
          {/* Custom Instructions */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground flex items-center justify-between">
              <span>{t("settings.ai_instructions")}</span>
              <span className="text-[11px] text-muted-foreground font-normal">
                Внедряется в системный промпт ИИ
              </span>
            </label>
            <Textarea
              rows={4}
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              placeholder={t("settings.ai_instructions_placeholder")}
            />
          </div>

          {/* Live Overflow Timeout */}
          <div className="p-4 rounded-2xl bg-muted/30 border border-border/50 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <label className="font-semibold text-foreground">
                {t("settings.ai_overflow_label")}
              </label>
              <span className="font-mono font-bold text-primary">
                {overflowTimeout} {t("settings.ai_overflow_seconds")}
              </span>
            </div>

            <input
              type="range"
              min={15}
              max={120}
              step={5}
              value={overflowTimeout}
              onChange={(e) => setOverflowTimeout(Number(e.target.value))}
              className="w-full accent-primary h-2 bg-muted rounded-lg cursor-pointer"
            />
            <p className="text-[11px] text-muted-foreground">
              Если менеджер перехватил диалог, но не отвечает клиенту дольше указанного времени, ИИ автоматически возобновит диалог.
            </p>
          </div>

          {/* Automated Follow-up Toggles */}
          <div className="space-y-3 pt-2 border-t border-border/40">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Автоматические дожимы (Follow-up)
            </h4>

            <div className="space-y-2">
              <label className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/50 cursor-pointer hover:border-border transition-colors">
                <input
                  type="checkbox"
                  checked={followUp24h}
                  onChange={(e) => setFollowUp24h(e.target.checked)}
                  className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                />
                <div className="text-xs">
                  <span className="font-semibold text-foreground block">
                    {t("settings.ai_followup_24h")}
                  </span>
                  <span className="text-muted-foreground">
                    Мягкое напоминание о записи клиентам без активности в течение суток
                  </span>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/50 cursor-pointer hover:border-border transition-colors">
                <input
                  type="checkbox"
                  checked={followUp72h}
                  onChange={(e) => setFollowUp72h(e.target.checked)}
                  className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                />
                <div className="text-xs">
                  <span className="font-semibold text-foreground block">
                    {t("settings.ai_followup_72h")}
                  </span>
                  <span className="text-muted-foreground">
                    Финальное спецпредложение клиенту перед архивацией сделки
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-border/40">
            {isSaved ? (
              <span className="text-xs font-semibold text-emerald-500 flex items-center gap-1">
                <Check className="w-4 h-4" />
                <span>{t("settings.saved_success")}</span>
              </span>
            ) : (
              <div />
            )}

            <Button type="submit" size="sm" className="gap-1.5">
              <Save className="w-4 h-4" />
              <span>{t("settings.save_changes")}</span>
            </Button>
          </div>
        </form>
      </SectionCard>

      <AiSandboxDrawer
        isOpen={isSandboxOpen}
        onClose={() => setIsSandboxOpen(false)}
      />
    </div>
  );
}
