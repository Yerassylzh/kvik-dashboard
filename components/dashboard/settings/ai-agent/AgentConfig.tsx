"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, Check, Play, Save, Eye } from "lucide-react";
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
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSandboxOpen, setIsSandboxOpen] = useState(false);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);

  useEffect(() => {
    if (config && config.customInstructions !== undefined) {
      const instructions = config.customInstructions || "";
      queueMicrotask(() => {
        setCustomInstructions(instructions);
      });
    }
  }, [config]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateConfig({
        customInstructions,
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
            Настройка дополнительных инструкций, правил общения и тестирование диалога в интерактивной песочнице
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
          description="Специфические правила, приветствие, скидки, тон общения и формулировки для вашего бизнеса"
        >
          <div className="space-y-2 pt-2">
            <Textarea
              rows={6}
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              placeholder={t("settings.ai_instructions_placeholder")}
              className="text-xs leading-relaxed"
            />
            <p className="text-[11px] text-muted-foreground">
              Инструкции динамически компилируются в системный промпт ИИ и влияют на все входящие обращения клиентов
            </p>
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
