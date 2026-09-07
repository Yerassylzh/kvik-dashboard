"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useTranslations } from "next-intl";
import { connectTelegram } from "@/lib/api/channels";
import { TelegramChannelMetadata } from "@/types/channels";

interface TelegramFlowProps {
  onSuccess: (metadata: TelegramChannelMetadata) => void;
  onCancel: () => void;
}

const STEPS = [
  { key: "step1" as const, icon: "💬" },
  { key: "step2" as const, icon: "🤖" },
  { key: "step3" as const, icon: "🔑" },
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
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ type: "spring", stiffness: 300, damping: 28 }}
      className="mt-4 p-5 rounded-2xl bg-sky-500/[0.04] border border-sky-500/20"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <span className="text-xl">✈️</span>
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
      <div className="space-y-3 mb-5">
        {STEPS.map((step, i) => (
          <motion.div
            key={step.key}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06 }}
            className="flex items-start gap-3"
          >
            <div className="shrink-0 w-7 h-7 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-xs font-bold text-sky-600 dark:text-sky-400">
              {i + 1}
            </div>
            <div className="flex-1 pt-0.5">
              <p className="text-xs text-foreground leading-relaxed">
                {t(`telegram_flow_${step.key}` as Parameters<typeof t>[0])}
              </p>
            </div>
            <span className="text-lg leading-none shrink-0">{step.icon}</span>
          </motion.div>
        ))}
      </div>

      {/* Token input */}
      <div className="space-y-2">
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
            placeholder={t("telegram_flow_token_placeholder")}
            className="flex-1 px-3 py-2.5 text-xs rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-sky-400 transition-colors font-mono"
            disabled={loading}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleConnect();
            }}
          />
          <button
            type="button"
            onClick={handlePaste}
            disabled={loading}
            className="px-3 py-2.5 text-xs font-semibold rounded-xl border border-border text-muted-foreground hover:text-foreground hover:border-sky-400/50 transition-colors cursor-pointer disabled:opacity-50"
            title="Вставить из буфера"
          >
            📋
          </button>
        </div>
      </div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 px-3 py-2 rounded-xl alert-destructive border text-xs"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* CTA */}
      <motion.button
        type="button"
        onClick={handleConnect}
        disabled={loading || !token.trim()}
        whileTap={{ scale: 0.97 }}
        className="mt-4 w-full py-2.5 text-xs font-bold rounded-xl bg-sky-500 hover:bg-sky-600 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            <span>{t("telegram_flow_connecting")}</span>
          </>
        ) : (
          t("telegram_flow_btn")
        )}
      </motion.button>
    </motion.div>
  );
}
