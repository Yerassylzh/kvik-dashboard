"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { FadeIn } from "@/components/ui/motion/FadeIn";
import { motion } from "motion/react";

interface StepCompleteTestProps {
  onComplete: () => void;
  onBack?: () => void;
  loading: boolean;
}

export function StepCompleteTest({
  onComplete,
  onBack,
  loading,
}: StepCompleteTestProps) {
  const t = useTranslations("onboarding");
  const [messages, setMessages] = useState<
    Array<{ role: "user" | "bot"; text: string }>
  >([{ role: "bot", text: t("complete.bot_welcome") }]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    const userMsg = inputText.trim();
    setInputText("");
    setMessages((prev) => [...prev, { role: "user", text: userMsg }]);
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: t("complete.bot_response", { query: userMsg }) },
      ]);
    }, 900);
  };

  return (
    <div className="space-y-6">
      {/* Interactive Chat Window */}
      <FadeIn
        delay={0.05}
        className="rounded-2xl border border-border bg-card p-4 space-y-3 h-72 overflow-y-auto themed-scroll shadow-xs"
      >
        {messages.map((m, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] p-3.5 rounded-2xl text-xs leading-relaxed shadow-xs ${
                m.role === "user"
                  ? "bg-primary text-primary-foreground rounded-br-none"
                  : "bg-muted/70 border border-border text-foreground rounded-bl-none"
              }`}
            >
              {m.text}
            </div>
          </motion.div>
        ))}

        {isTyping && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="p-3 rounded-2xl bg-muted/70 border border-border text-foreground rounded-bl-none flex items-center gap-1.5 shadow-xs">
              <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce" />
              <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:0.2s]" />
              <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:0.4s]" />
            </div>
          </motion.div>
        )}
      </FadeIn>

      {/* Input Message Form */}
      <FadeIn delay={0.1}>
        <form onSubmit={handleSend} className="flex gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={t("complete.input_placeholder")}
            className="flex-1 px-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-xs sm:text-sm transition-all"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="px-5 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs rounded-xl shadow-xs transition-all disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
          >
            {t("complete.btn_send")}
          </button>
        </form>
      </FadeIn>

      {/* Finish CTA & Back button */}
      <FadeIn delay={0.15} className="pt-2 flex flex-col sm:flex-row items-center gap-3">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="w-full sm:w-auto py-3.5 px-5 bg-muted hover:bg-muted/80 text-foreground border border-border font-semibold text-xs sm:text-sm rounded-xl transition-all cursor-pointer"
          >
            ← Назад
          </button>
        )}
        <button
          onClick={onComplete}
          disabled={loading}
          className="w-full sm:flex-1 py-4 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white font-bold text-xs sm:text-sm rounded-xl hover:from-emerald-600 hover:to-cyan-600 shadow-lg shadow-emerald-500/25 transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>{t("complete.btn_finishing")}</span>
            </>
          ) : (
            <span>{t("complete.btn_finish")}</span>
          )}
        </button>
      </FadeIn>
    </div>
  );
}
