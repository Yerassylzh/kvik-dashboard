"use client";

import React from "react";
import { Search, LayoutGrid, List, TrendingUp, ArrowUpDown, Filter } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ChannelType, LeadLossReason } from "@/lib/api/leads";
import clsx from "clsx";

export type ViewMode = "kanban" | "list" | "funnel";

interface LeadFiltersProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  search: string;
  onSearchChange: (search: string) => void;
  selectedChannel?: ChannelType;
  onChannelChange: (channel?: ChannelType) => void;
  selectedLossReason?: LeadLossReason;
  onLossReasonChange?: (reason?: LeadLossReason) => void;
  sortBy?: "lastActivityAt" | "createdAt" | "stageChangedAt" | "score";
  onSortByChange?: (sort: "lastActivityAt" | "createdAt" | "stageChangedAt" | "score") => void;
}

const channels: Array<{ id?: ChannelType; labelKey: string }> = [
  { id: undefined, labelKey: "leads.filter_channel_all" },
  { id: "WHATSAPP", labelKey: "WhatsApp" },
  { id: "INSTAGRAM", labelKey: "Instagram" },
  { id: "TELEGRAM", labelKey: "Telegram" },
];

const lossReasons: LeadLossReason[] = [
  "DISQUALIFIED_BY_POLICY",
  "OUT_OF_SERVICE_AREA",
  "PRICE_TOO_HIGH",
  "UNSUPPORTED_SERVICE",
  "CLIENT_DECLINED",
  "UNRESPONSIVE_AFTER_FOLLOWUP",
  "CANCELLED_WITHOUT_REBOOK",
  "SPAM",
  "OTHER",
];

export function LeadFilters({
  viewMode,
  onViewModeChange,
  search,
  onSearchChange,
  selectedChannel,
  onChannelChange,
  selectedLossReason,
  onLossReasonChange,
  sortBy = "lastActivityAt",
  onSortByChange,
}: LeadFiltersProps) {
  const t = useTranslations("dashboard");

  return (
    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5">
      {/* Search & Sort */}
      <div className="flex items-center gap-2 flex-1 max-w-md">
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

        {onSortByChange && viewMode !== "funnel" && (
          <select
            value={sortBy}
            onChange={(e) => onSortByChange(e.target.value as any)}
            className="bg-card border border-border/80 rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary cursor-pointer shrink-0"
            title={t("leads.sort_by_label")}
          >
            <option value="lastActivityAt">{t("leads.sort_last_activity")}</option>
            <option value="createdAt">{t("leads.sort_created_at")}</option>
            <option value="stageChangedAt">{t("leads.sort_stage_changed")}</option>
            <option value="score">{t("leads.sort_score")}</option>
          </select>
        )}
      </div>

      {/* Channel Filters & View Mode Toggles */}
      <div className="flex items-center gap-2 shrink-0 flex-wrap">
        {viewMode !== "funnel" && (
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
        )}

        {/* View Mode Segment */}
        <div className="flex items-center gap-0.5 bg-muted/50 p-0.5 rounded-lg border border-border/70">
          <button
            type="button"
            onClick={() => onViewModeChange("kanban")}
            className={clsx(
              "flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-all cursor-pointer",
              viewMode === "kanban"
                ? "bg-card text-foreground shadow-2xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            )}
            title={t("leads.tab_kanban")}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t("leads.tab_kanban")}</span>
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange("list")}
            className={clsx(
              "flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-all cursor-pointer",
              viewMode === "list"
                ? "bg-card text-foreground shadow-2xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            )}
            title={t("leads.tab_list")}
          >
            <List className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t("leads.tab_list")}</span>
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange("funnel")}
            className={clsx(
              "flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-all cursor-pointer",
              viewMode === "funnel"
                ? "bg-card text-foreground shadow-2xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            )}
            title={t("leads.tab_funnel")}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t("leads.tab_funnel")}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

