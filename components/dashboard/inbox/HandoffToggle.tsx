"use client";

import React from "react";
import { Bot, UserCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ConversationStatus } from "@/lib/api/conversations";

interface HandoffToggleProps {
  status: ConversationStatus;
  onStatusChange: (status: ConversationStatus) => void;
  disabled?: boolean;
}

export function HandoffToggle({
  status,
  onStatusChange,
  disabled,
}: HandoffToggleProps) {
  const t = useTranslations("dashboard");
  const isBotActive = status === "BOT_ACTIVE";

  const toggle = () => {
    if (disabled) return;
    onStatusChange(isBotActive ? "MANAGER_INTERCEPTED" : "BOT_ACTIVE");
  };

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={disabled}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
        isBotActive
          ? "bg-primary/10 border-primary/30 text-primary hover:bg-primary/20"
          : "bg-amber-500/10 border-amber-500/30 text-amber-500 hover:bg-amber-500/20"
      }`}
    >
      {isBotActive ? (
        <>
          <Bot className="w-3.5 h-3.5" />
          <span>{t("inbox.handoff_bot")}</span>
        </>
      ) : (
        <>
          <UserCheck className="w-3.5 h-3.5" />
          <span>{t("inbox.handoff_manager")}</span>
        </>
      )}
    </button>
  );
}
