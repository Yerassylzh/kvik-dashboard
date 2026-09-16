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
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
      <div className="flex items-center gap-2 flex-1 max-w-sm">
        <div className="relative w-full">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t("leads.search_placeholder")}
            className="w-full bg-card border border-border/80 rounded-lg pl-8 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <div className="flex items-center gap-0.5 bg-muted/50 p-0.5 rounded-lg border border-border/70">
          {channels.map((ch) => {
            const isSelected = selectedChannel === ch.id;
            const label = ch.id ? ch.labelKey : t("leads.filter_channel_all");

            return (
              <button
                key={ch.id || "all"}
                type="button"
                onClick={() => onChannelChange(ch.id)}
                className={clsx(
                  "px-2 py-1 rounded-md text-xs font-medium transition-all cursor-pointer",
                  isSelected
                    ? "bg-card text-foreground shadow-2xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-0.5 bg-muted/50 p-0.5 rounded-lg border border-border/70">
          <button
            type="button"
            onClick={() => onViewModeChange("kanban")}
            className={clsx(
              "p-1.5 rounded-md text-xs transition-all cursor-pointer",
              viewMode === "kanban"
                ? "bg-card text-foreground shadow-2xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            )}
            title={t("leads.tab_kanban")}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange("list")}
            className={clsx(
              "p-1.5 rounded-md text-xs transition-all cursor-pointer",
              viewMode === "list"
                ? "bg-card text-foreground shadow-2xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            )}
            title={t("leads.tab_list")}
          >
            <List className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
