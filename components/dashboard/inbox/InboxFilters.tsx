"use client";

import React from "react";
import { useTranslations } from "next-intl";
import type { ConversationStatus } from "@/lib/api/conversations";
import clsx from "clsx";

interface InboxFiltersProps {
  status: "ALL" | ConversationStatus;
  onStatusChange: (status: "ALL" | ConversationStatus) => void;
}

const statusFilters: Array<{ id: "ALL" | ConversationStatus; labelKey: string }> = [
  { id: "ALL", labelKey: "inbox.filter_all" },
  { id: "BOT_ACTIVE", labelKey: "inbox.filter_bot" },
  { id: "MANAGER_INTERCEPTED", labelKey: "inbox.filter_intercepted" },
  { id: "CLOSED", labelKey: "inbox.filter_closed" },
];

export function InboxFilters({ status, onStatusChange }: InboxFiltersProps) {
  const t = useTranslations("dashboard");

  return (
    <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-xl border border-border/50 overflow-x-auto">
      {statusFilters.map((tab) => {
        const isSelected = status === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onStatusChange(tab.id)}
            className={clsx(
              "px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all",
              isSelected
                ? "bg-background text-foreground shadow-xs border border-border/50"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t(tab.labelKey as any)}
          </button>
        );
      })}
    </div>
  );
}
