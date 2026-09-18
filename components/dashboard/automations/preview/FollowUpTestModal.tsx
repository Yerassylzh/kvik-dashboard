"use client";

import React, { useState, useEffect } from "react";
import { PlayCircle, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useFollowUpPreview } from "@/hooks/useFollowUps";
import { useConversations } from "@/hooks/useConversations";

interface FollowUpTestModalProps {
  workspaceId?: string;
  isOpen: boolean;
  onClose: () => void;
}

export function FollowUpTestModal({
  workspaceId,
  isOpen,
  onClose,
}: FollowUpTestModalProps) {
  const t = useTranslations("dashboard");
  const [conversationId, setConversationId] = useState("");
  const [stepIndex, setStepIndex] = useState(1);

  const { conversations } = useConversations();
  const { result, isGenerating, generatePreview, clearResult } =
    useFollowUpPreview(workspaceId);

  // Auto-select first conversation if available
  useEffect(() => {
    if (conversations.length > 0 && !conversationId) {
      setConversationId(conversations[0].id);
    }
  }, [conversations, conversationId]);

  const handleRunTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!conversationId.trim()) return;

    await generatePreview({
      conversationId: conversationId.trim(),
      stepIndex,
    });
  };

  const handleClose = () => {
    clearResult();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <PlayCircle className="w-4 h-4" />
            </div>
            <div>
              <DialogTitle className="text-sm font-semibold">
                {t("automations.test_dialog_title")}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                {t("automations.test_dialog_desc")}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleRunTest} className="space-y-4 pt-1">
          {/* Conversation Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground flex items-center justify-between">
              <span>{t("automations.test_conv_label")}</span>
              {conversations.length > 0 && (
                <span className="text-[10px] text-muted-foreground">
                  {t("automations.test_conv_loaded", { count: conversations.length })}
                </span>
              )}
            </label>

            {conversations.length > 0 ? (
              <select
                value={conversationId}
                onChange={(e) => setConversationId(e.target.value)}
                className="w-full text-xs bg-background border border-border/80 rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary font-medium"
              >
                {conversations.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.lead?.name || t("automations.logs_lead_default")} ({c.channelType || t("automations.test_chat_fallback")}
                    {c.lead?.phone ? ` • ${c.lead.phone}` : ""})
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                required
                placeholder={t("automations.test_conv_id_placeholder")}
                value={conversationId}
                onChange={(e) => setConversationId(e.target.value)}
                className="w-full text-xs bg-background border border-border/80 rounded-lg px-3 py-2 text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              />
            )}
          </div>

          {/* Step Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              {t("automations.test_step_label")}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { step: 1, hours: 2 },
                { step: 2, hours: 20 },
                { step: 3, hours: 48 },
              ].map((s) => (
                <button
                  type="button"
                  key={s.step}
                  onClick={() => setStepIndex(s.step)}
                  className={`p-2 rounded-lg border text-xs font-medium transition-all ${
                    stepIndex === s.step
                      ? "border-primary bg-primary/10 text-primary font-semibold"
                      : "border-border/80 bg-card text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t("automations.test_step_option", { step: s.step, hours: s.hours })}
                </button>
              ))}
            </div>
          </div>

          {/* Trigger Button */}
          <Button
            type="submit"
            loading={isGenerating}
            disabled={!conversationId.trim() || isGenerating}
            className="w-full text-xs"
            leftIcon={<Sparkles className="w-3.5 h-3.5" />}
          >
            {t("automations.test_run_btn")}
          </Button>

          {/* Test Result Inspection */}
          {result && (
            <div className="p-4 rounded-xl border border-border/80 bg-card space-y-3 animate-in fade-in duration-200">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                  {t("automations.test_generated_label")}
                </span>
                <Badge
                  variant={result.withinMeta24hWindow ? "success" : "warning"}
                  className="text-[10px]"
                >
                  {result.withinMeta24hWindow
                    ? t("automations.test_meta_window_ok")
                    : t("automations.test_meta_window_expired")}
                </Badge>
              </div>

              {/* Message Bubble */}
              <div className="p-3 rounded-lg border border-border/70 bg-muted/20 text-xs text-foreground leading-relaxed whitespace-pre-wrap">
                {result.generatedMessage}
              </div>

              {/* Diagnostics metadata */}
              <div className="grid grid-cols-2 gap-2 text-[11px] text-muted-foreground pt-1 border-t border-border/50 font-mono">
                <div>
                  {t("automations.test_latency_label")}{" "}
                  <strong className="text-foreground">{result.latencyMs} ms</strong>
                </div>
                <div>
                  {t("automations.test_tokens_label")}{" "}
                  <strong className="text-foreground">{result.tokensUsed}</strong>
                </div>
                <div>
                  {t("automations.test_channel_label")}{" "}
                  <strong className="text-foreground uppercase">
                    {result.channelType}
                  </strong>
                </div>
                <div>
                  {t("automations.test_mode_label")}{" "}
                  <strong className="text-foreground">{result.dispatchMode}</strong>
                </div>
              </div>
            </div>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
