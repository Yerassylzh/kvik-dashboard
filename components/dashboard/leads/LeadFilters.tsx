"use client";

import React, { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Filter, LayoutGrid, List, Search, TrendingUp } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ChannelType, LeadLossReason } from "@/lib/api/leads";
import clsx from "clsx";

export type ViewMode = "kanban" | "list" | "funnel";
type SortBy = "lastActivityAt" | "createdAt" | "stageChangedAt" | "score";

interface LeadFiltersProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  search: string;
  onSearchChange: (search: string) => void;
  selectedChannel?: ChannelType;
  onChannelChange: (channel?: ChannelType) => void;
  selectedLossReason?: LeadLossReason;
  onLossReasonChange?: (reason?: LeadLossReason) => void;
  sortBy?: SortBy;
  onSortByChange?: (sort: SortBy) => void;
}

const channels: Array<{ id?: ChannelType; labelKey: string }> = [
  { id: undefined, labelKey: "leads.filter_channel_all" },
  { id: "WHATSAPP", labelKey: "WhatsApp" },
  { id: "INSTAGRAM", labelKey: "Instagram" },
  { id: "TELEGRAM", labelKey: "Telegram" },
];

const sortOptions: Array<{ id: SortBy; labelKey: string }> = [
  { id: "lastActivityAt", labelKey: "leads.sort_last_activity" },
  { id: "createdAt", labelKey: "leads.sort_created_at" },
  { id: "stageChangedAt", labelKey: "leads.sort_stage_changed" },
  { id: "score", labelKey: "leads.sort_score" },
];

const viewOptions: Array<{ id: ViewMode; labelKey: string; icon: React.ElementType }> = [
  { id: "kanban", labelKey: "leads.tab_kanban", icon: LayoutGrid },
  { id: "list", labelKey: "leads.tab_list", icon: List },
  { id: "funnel", labelKey: "leads.tab_funnel", icon: TrendingUp },
];

export function LeadFilters({
  viewMode,
  onViewModeChange,
  search,
  onSearchChange,
  selectedChannel,
  onChannelChange,
  sortBy = "lastActivityAt",
  onSortByChange,
}: LeadFiltersProps) {
  const t = useTranslations("dashboard");
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const selectedChannelLabel = selectedChannel
    ? channels.find((channel) => channel.id === selectedChannel)?.labelKey
    : t("leads.filter_channel_all");
  const activeView = viewOptions.find((option) => option.id === viewMode);
  const ActiveViewIcon = activeView?.icon ?? LayoutGrid;

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setIsOpen(false);
    };
    if (isOpen) document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isOpen]);

  return (
    <div className="flex w-full md:w-auto flex-col sm:flex-row items-stretch sm:items-center gap-2">
      <div className="relative w-full sm:w-56 md:w-64">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={t("leads.search_placeholder")}
          className="w-full bg-card border border-border/80 rounded-lg pl-8 pr-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary transition-all"
        />
      </div>

      <div ref={menuRef} className="relative shrink-0">
        <button
          type="button"
          aria-expanded={isOpen}
          onClick={() => setIsOpen((open) => !open)}
          className={clsx(
            "flex w-full sm:w-auto items-center justify-between gap-2 rounded-lg border bg-card px-3 py-2 text-xs font-semibold transition-colors",
            isOpen ? "border-primary/50 text-foreground" : "border-border/80 text-muted-foreground hover:text-foreground"
          )}
        >
          <Filter className="h-3.5 w-3.5" />
          <span>{t("leads.filter_menu")}</span>
          <ChevronDown className={clsx("h-3.5 w-3.5 transition-transform", isOpen && "rotate-180")} />
        </button>

        {isOpen && (
          <div className="absolute right-0 top-full z-50 mt-2 w-[260px] rounded-xl border border-border bg-card p-2 shadow-xl">
            <div className="px-2 pb-1.5 pt-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              {t("leads.filter_view_label")}
            </div>
            <div className="grid grid-cols-3 gap-1">
              {viewOptions.map(({ id, labelKey, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => onViewModeChange(id)}
                  className={clsx(
                    "flex flex-col items-center gap-1 rounded-lg px-1 py-2 text-[11px] transition-colors",
                    viewMode === id ? "bg-primary/10 text-primary font-semibold" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{t(labelKey)}</span>
                </button>
              ))}
            </div>

            <div className="my-2 border-t border-border/70" />
            <div className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              {t("leads.filter_channel_label")}
            </div>
            <div className="space-y-0.5">
              {channels.map((channel) => {
                const isSelected = selectedChannel === channel.id;
                const label = channel.id ? channel.labelKey : t("leads.filter_channel_all");
                return (
                  <button
                    key={channel.id ?? "all"}
                    type="button"
                    onClick={() => onChannelChange(channel.id)}
                    className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs text-foreground hover:bg-muted"
                  >
                    <span>{label}</span>
                    {isSelected && <Check className="h-3.5 w-3.5 text-primary" />}
                  </button>
                );
              })}
            </div>

            {onSortByChange && viewMode !== "funnel" && (
              <>
                <div className="my-2 border-t border-border/70" />
                <div className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  {t("leads.filter_sort_label")}
                </div>
                <select
                  value={sortBy}
                  onChange={(event) => onSortByChange(event.target.value as SortBy)}
                  className="w-full rounded-lg border border-border/80 bg-card px-2.5 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/15"
                  aria-label={t("leads.sort_by_label")}
                >
                  {sortOptions.map((option) => (
                    <option key={option.id} value={option.id}>{t(option.labelKey)}</option>
                  ))}
                </select>
              </>
            )}

            <div className="mt-2 border-t border-border/70 px-2 pt-2 text-[11px] text-muted-foreground">
              <span>{selectedChannelLabel}</span>
              <span className="mx-1">·</span>
              <span className="inline-flex items-center gap-1"><ActiveViewIcon className="h-3 w-3" />{activeView && t(activeView.labelKey)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
