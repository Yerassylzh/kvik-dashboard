"use client";

import React from "react";
import { ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import clsx from "clsx";

export interface AutomationItem {
  id: string;
  titleKey: string;
  descKey: string;
  triggerText: string;
  delayText: string;
  defaultTemplate: string;
  isEnabled: boolean;
  category: "followup" | "reminder" | "winback";
}

interface AutomationCardProps {
  item: AutomationItem;
  isSelected: boolean;
  onSelect: () => void;
  onToggle: () => void;
}

export function AutomationCard({
  item,
  isSelected,
  onSelect,
  onToggle,
}: AutomationCardProps) {
  const t = useTranslations("dashboard");

  return (
    <div
      onClick={onSelect}
      className={clsx(
        "p-4 rounded-2xl border transition-all cursor-pointer space-y-3",
        isSelected
          ? "bg-card border-primary ring-1 ring-primary shadow-sm"
          : "bg-card/60 hover:bg-card border-border/80 hover:border-border"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-foreground">
              {t(item.titleKey as Parameters<typeof t>[0])}
            </span>
            <Badge
              variant={item.isEnabled ? "success" : "secondary"}
              className="text-[9px] px-1.5 py-0"
            >
              {item.isEnabled
                ? t("automations.status_enabled")
                : t("automations.status_disabled")}
            </Badge>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            {t(item.descKey as Parameters<typeof t>[0])}
          </p>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          className={clsx(
            "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden",
            item.isEnabled ? "bg-primary" : "bg-muted"
          )}
        >
          <span
            className={clsx(
              "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-background shadow-lg ring-0 transition duration-200 ease-in-out",
              item.isEnabled ? "translate-x-4" : "translate-x-0"
            )}
          />
        </button>
      </div>

      <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-2 border-t border-border/40">
        <span className="font-medium">⏱️ {item.delayText}</span>
        <span className="text-primary flex items-center gap-1 font-semibold">
          Настроить <ChevronRight className="w-3 h-3" />
        </span>
      </div>
    </div>
  );
}
