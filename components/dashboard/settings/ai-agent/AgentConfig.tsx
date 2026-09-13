"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, Check, Play, Save, Eye, Clock, MessageSquare } from "lucide-react";
import { useTranslations } from "next-intl";
import { SectionCard } from "@/components/dashboard/shared/SectionCard";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AiSandboxDrawer } from "./AiSandboxDrawer";
import { AiPromptInspectorModal } from "./AiPromptInspectorModal";
import { useAiEngine } from "@/hooks/useAiEngine";

export function AgentConfig() {
  const t = useTranslations("dashboard");
  const { config, updateConfig, isLoading } = useAiEngine();

  const [customInstructions, setCustomInstructions] = useState("");
  const [overflowTimeout, setOverflowTimeout] = useState(30);
  const [followUp24h, setFollowUp24h] = useState(true);
  const [followUp72h, setFollowUp72h] = useState(true);

  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSandboxOpen, setIsSandboxOpen] = useState(false);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);

  useEffect(() => {
    if (config) {
      if (config.customInstructions !== undefined) {
        setCustomInstructions(config.customInstructions || "");
      }
      if (config.liveOverflowTimeoutSeconds !== undefined) {
        setOverflowTimeout(config.liveOverflowTimeoutSeconds);
      }
      if (config.followUp24hEnabled !== undefined) {
        setFollowUp24h(config.followUp24hEnabled);
      }
      if (config.followUp72hEnabled !== undefined) {
        setFollowUp72h(config.followUp72hEnabled);
      }
    }
  }, [config]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateConfig({
        customInstructions,
        liveOverflowTimeoutSeconds: overflowTimeout,
        followUp24hEnabled: followUp24h,
        followUp72hEnabled: followUp72h,
      });
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (err) {
      console.error("Failed to update AI config", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Action Header Card */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-card border border-primary/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <h3 className="font-bold text-sm text-foreground">
              Поведение и инструкции ИИ-Ассистента
            </h3>
          </div>
          <p className="text-xs text-muted-foreground max-w-xl leading-relaxed">
            Настройка дополнительных инструкций к промпту, логики перехвата диалога менеджером и автоматических дожимов
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsInspectorOpen(true)}
            leftIcon={<Eye className="w-3.5 h-3.5" />}
            className="text-xs"
          >
            {t("ai.prompt_inspector_button")}
          </Button>

          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => setIsSandboxOpen(true)}
            leftIcon={<Play className="w-3.5 h-3.5" />}
            className="text-xs font-semibold"
          >
            {t("overview.ai_test_dialogue")}
          </Button>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Card 1: Custom Instructions */}
        <SectionCard
          title={t("settings.ai_instructions")}
          description="Специфические правила, приветствие, скидки и формулировки для вашего бизнеса"
        >
          <div className="space-y-2 pt-2">
            <Textarea
              rows={4}
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              placeholder={t("settings.ai_instructions_placeholder")}
              className="text-xs leading-relaxed"
            />
            <p className="text-[11px] text-muted-foreground">
              {t("dashboard.ai.custom_instructions_hint")}
            </p>
          </div>
        </SectionCard>

        {/* Card 2: Live Overflow Timeout */}
        <SectionCard
          title="Автоматический возврат диалога ИИ (Live Overflow)"
          description="Если оператор перехватил диалог, но не отвечает клиенту"
        >
          <div className="p-4 rounded-2xl bg-muted/20 border border-border/50 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <label className="font-semibold text-foreground flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-primary" />
                <span>{t("settings.ai_overflow_label")}</span>
              </label>
              <span className="font-mono font-bold text-primary bg-card px-2 py-0.5 rounded-lg border border-border/40">
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
              {t("dashboard.ai.overflow_hint")}
            </p>
          </div>
        </SectionCard>

        {/* Card 3: Automated Follow-up Toggles */}
        <SectionCard
          title="Автоматические дожимы (Follow-up)"
          description="Автоматические сообщения клиентам при отсутствии активности"
        >
          <div className="space-y-3 pt-2">
            <label className="flex items-center gap-3 p-3.5 rounded-xl bg-card border border-border/50 cursor-pointer hover:border-border transition-colors">
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
                <span className="text-muted-foreground text-[11px]">
                  {t("dashboard.ai.followup_24h_desc")}
                </span>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3.5 rounded-xl bg-card border border-border/50 cursor-pointer hover:border-border transition-colors">
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
                <span className="text-muted-foreground text-[11px]">
                  {t("dashboard.ai.followup_72h_desc")}
                </span>
              </div>
            </label>
          </div>
        </SectionCard>

        {/* Save Bar */}
        <div className="flex items-center justify-between p-4 rounded-2xl bg-card border border-border/60 sticky bottom-4 shadow-md backdrop-blur-md">
          {isSaved ? (
            <span className="text-xs font-semibold text-emerald-500 flex items-center gap-1.5">
              <Check className="w-4 h-4" />
              <span>{t("settings.saved_success")}</span>
            </span>
          ) : (
            <div className="text-[11px] text-muted-foreground">
              Все настройки сохраняются на уровне рабочего пространства
            </div>
          )}

          <Button
            type="submit"
            size="sm"
            disabled={isLoading}
            loading={isSaving}
            leftIcon={<Save className="w-4 h-4" />}
            className="text-xs font-semibold"
          >
            {t("settings.save_changes")}
          </Button>
        </div>
      </form>

      {/* Modals & Drawers */}
      <AiPromptInspectorModal
        isOpen={isInspectorOpen}
        onClose={() => setIsInspectorOpen(false)}
      />

      <AiSandboxDrawer
        isOpen={isSandboxOpen}
        onClose={() => setIsSandboxOpen(false)}
      />
    </div>
  );
}
