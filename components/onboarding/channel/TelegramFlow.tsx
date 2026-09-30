"use client";

import React, { useState } from "react";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import { MessageSquare, Bot, Key, ExternalLink, Send, Clipboard } from "lucide-react";
import { connectTelegram } from "@/lib/api/channels";
import { TelegramChannelMetadata } from "@/types/channels";

interface TelegramFlowProps {
  onSuccess: (metadata: TelegramChannelMetadata) => void;
  onCancel: () => void;
}

const STEPS = [
  { key: "step1" as const, icon: MessageSquare },
  { key: "step2" as const, icon: Bot },
  { key: "step3" as const, icon: Key },
];

export function TelegramFlow({ onSuccess, onCancel }: TelegramFlowProps) {
  const t = useTranslations("onboarding.channel");
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    const trimmed = token.trim();
    if (!trimmed) return;
    try {
      setLoading(true);
      setError(null);
      const res = await connectTelegram({ botToken: trimmed });
      onSuccess(res.channel.metadata as TelegramChannelMetadata);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("telegram_flow_error"));
    } finally {
      setLoading(false);
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setToken(text.trim());
    } catch {
      // clipboard API not available
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ type: "spring", stiffness: 300, damping: 28 }}
      className="p-4 sm:p-5 rounded-2xl bg-sky-500/[0.04] border border-sky-500/20 space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-sky-500/10">
        <div className="flex items-center gap-2">
          <Send className="w-4 h-4 text-sky-600 dark:text-sky-400" />
          <h5 className="font-bold text-foreground text-sm">
            {t("telegram_flow_title")}
          </h5>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="text-muted-foreground hover:text-foreground text-xs transition-colors cursor-pointer"
        >
          ✕
        </button>
      </div>

      {/* Step-by-step guide */}
      <div className="space-y-2.5">
        {STEPS.map((step, i) => {
          const StepIcon = step.icon;
          return (
            <motion.div
              key={step.key}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-start gap-2.5"
            >
              <div className="shrink-0 w-6 h-6 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-xs font-bold text-sky-600 dark:text-sky-400">
                {i + 1}
              </div>
              <div className="flex-1 pt-0.5">
                <p className="text-xs text-foreground leading-relaxed">
                  {t(`telegram_flow_${step.key}` as Parameters<typeof t>[0])}
                </p>
                {step.key === "step1" && (
                  <a
                    href="https://t.me/BotFather"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 mt-0.5 text-[11px] font-semibold text-sky-600 dark:text-sky-400 hover:underline"
                  >
                    <span>{t("telegram_open_botfather")}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
              <StepIcon className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
            </motion.div>
          );
        })}
      </div>

      {/* Token input */}
      <div className="space-y-1.5 pt-1">
        <label className="text-xs font-semibold text-foreground">
          {t("telegram_flow_token_label")}
        </label>
        <div className="flex gap-2">
          <input
            id="telegram-bot-token"
            type="text"
            value={token}
            onChange={(e) => {
              setToken(e.target.value);
              setError(null);
            }}
            placeholder={t("telegram_flow_placeholder")}
            className="flex-1 px-3.5 py-2.5 rounded-xl text-xs bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 font-mono transition-all"
            autoComplete="off"
            spellCheck={false}
          />
          <button
            type="button"
            onClick={handlePaste}
            className="px-3 py-2 rounded-xl text-xs font-semibold border border-border bg-card hover:bg-muted/60 text-foreground transition-colors cursor-pointer shrink-0 flex items-center gap-1.5"
          >
            <Clipboard className="w-3.5 h-3.5" />
            <span>{t("telegram_paste_btn")}</span>
          </button>
        </div>
      </div>

      {error && (
        <p className="text-xs font-medium text-destructive">{error}</p>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2.5 rounded-xl text-xs font-semibold border border-border bg-card hover:bg-muted/50 text-foreground transition-colors cursor-pointer"
        >
          {t("telegram_cancel_btn")}
        </button>
        <button
          type="button"
          onClick={handleConnect}
          disabled={!token.trim() || loading}
          className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-500 text-white shadow-xs transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <span>{t("telegram_submit_btn")}</span>
          )}
        </button>
      </div>
    </motion.div>
  );
}
