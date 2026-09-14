"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Check, Cpu, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { useAiEngine } from "@/hooks/useAiEngine";

interface AiPromptInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AiPromptInspectorModal({ isOpen, onClose }: AiPromptInspectorModalProps) {
  const t = useTranslations("dashboard");
  const tCommon = useTranslations("common");
  const { config, isLoading } = useAiEngine();
  const [isCopied, setIsCopied] = useState(false);

  const promptText = config?.systemPromptPreview || "";
  const niche = config?.nicheProfile || "GENERAL";
  const estimatedTokens = Math.round(promptText.length / 3.5);

  const handleCopy = async () => {
    if (!promptText) return;
    await navigator.clipboard.writeText(promptText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t("ai.prompt_inspector_title")}
      description={t("ai.prompt_inspector_desc")}
      width="lg"
    >
      <div className="space-y-4 pt-1">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          {/* Dynamic Context Pills */}
          <div className="flex items-center gap-2">
            <Badge variant="primary" className="text-[10px] font-mono py-0.5 px-2">
              <Sparkles className="w-3 h-3 mr-1" />
              {niche}
            </Badge>
            {promptText && (
              <Badge variant="muted" className="text-[10px] font-mono py-0.5 px-2">
                <Cpu className="w-3 h-3 mr-1" />
                ~{estimatedTokens} {t("ai.prompt_tokens_label")}
              </Badge>
            )}
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCopy}
            disabled={!promptText}
            leftIcon={isCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            className="text-xs h-7"
          >
            {isCopied ? t("ai.copied") : t("ai.copy_prompt")}
          </Button>
        </div>

        {/* Compiled Prompt Text Box */}
        <div className="relative rounded-2xl border border-border/60 bg-muted/40 p-4 font-mono text-[11px] text-foreground leading-relaxed overflow-x-auto max-h-[440px] overflow-y-auto whitespace-pre-wrap selection:bg-primary/20">
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground font-sans">
              {t("ai.prompt_loading")}
            </div>
          ) : promptText ? (
            promptText
          ) : (
            <div className="text-center py-12 text-muted-foreground font-sans">
              {t("ai.prompt_empty")}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-border/40">
          <Button type="button" variant="outline" size="sm" onClick={onClose} className="text-xs">
            {tCommon("close")}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
