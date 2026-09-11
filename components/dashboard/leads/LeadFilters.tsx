"use client";

import React from "react";
import { Search, LayoutGrid, List, Filter } from "lucide-react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import type { ChannelType, LeadStatus } from "@/lib/api/leads";
import clsx from "clsx";

interface LeadFiltersProps {
  viewMode: "kanban" | "list";
  onViewModeChange: (mode: "kanban" | "list") => void;
  search: string;
  onSearchChange: (search: string) => void;
  selectedChannel?: ChannelType;
  onChannelChange: (channel?: ChannelType) => void;
}

const channels: Array<{ id?: ChannelType; labelKey: string }> = [
  { id: undefined, labelKey: "leads.filter_channel_all" },
  { id: "WHATSAPP", labelKey: "WhatsApp" },
  { id: "INSTAGRAM", labelKey: "Instagram" },
  { id: "TELEGRAM", labelKey: "Telegram" },
];

export function LeadFilters({
  viewMode,
  onViewModeChange,
  search,
  onSearchChange,
  selectedChannel,
  onChannelChange,
}: LeadFiltersProps) {
  const t = useTranslations("dashboard");

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
      <div className="flex items-center gap-2 flex-1 max-w-md">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t("leads.search_placeholder")}
            className="w-full bg-card border border-border/60 rounded-xl pl-9 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl border border-border/50">
          {channels.map((ch) => {
            const isSelected = selectedChannel === ch.id;
            const label = ch.id ? ch.labelKey : t("leads.filter_channel_all");

            return (
              <button
                key={ch.id || "all"}
                type="button"
                onClick={() => onChannelChange(ch.id)}
                className={clsx(
                  "px-2.5 py-1 rounded-lg text-xs font-semibold transition-all",
                  isSelected
                    ? "bg-background text-foreground shadow-sm border border-border/50"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl border border-border/50">
          <button
            type="button"
            onClick={() => onViewModeChange("kanban")}
            className={clsx(
              "p-1.5 rounded-lg text-xs transition-all",
              viewMode === "kanban"
                ? "bg-background text-foreground shadow-sm border border-border/50"
                : "text-muted-foreground hover:text-foreground"
            )}
            title={t("leads.tab_kanban")}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange("list")}
            className={clsx(
              "p-1.5 rounded-lg text-xs transition-all",
              viewMode === "list"
                ? "bg-background text-foreground shadow-sm border border-border/50"
                : "text-muted-foreground hover:text-foreground"
            )}
            title={t("leads.tab_list")}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
