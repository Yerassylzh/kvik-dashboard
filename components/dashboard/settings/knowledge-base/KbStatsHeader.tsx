"use client";

import React from "react";
import { Database, Layers, HardDrive, CheckCircle2, RefreshCw, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import clsx from "clsx";
import type { KnowledgeBaseStatsDto } from "@/types/knowledgeBase";
import { Button } from "@/components/ui/button";

interface KbStatsHeaderProps {
  stats?: KnowledgeBaseStatsDto;
  isLoading?: boolean;
  onOpenSearchTester: () => void;
}

function formatBytes(bytes?: number): string {
  if (!bytes || bytes === 0) return "0 KB";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function KbStatsHeader({ stats, isLoading, onOpenSearchTester }: KbStatsHeaderProps) {
  const t = useTranslations("dashboard");

  const isPending =
    (stats?.statusSummary?.PENDING ?? 0) > 0 || (stats?.statusSummary?.PROCESSING ?? 0) > 0;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-card border border-border/60 shadow-xs">
      {/* Left: title + description */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <Database className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-sm font-bold text-foreground leading-tight">
            {t("knowledge.title")}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t("knowledge.description")}
          </p>
        </div>
      </div>

      {/* Right: metric cards + action */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Sources count */}
        <div className="flex flex-col items-center px-3.5 py-2 rounded-xl bg-muted/30 border border-border/50 min-w-[64px]">
          <span className={clsx("text-base font-bold text-foreground leading-none", isLoading && "animate-pulse")}>
            {isLoading ? "—" : (stats?.totalEntries ?? 0)}
          </span>
          <span className="text-[10px] text-muted-foreground mt-1 whitespace-nowrap">
            {t("knowledge.stat_sources")}
          </span>
        </div>

        {/* Vector chunks */}
        <div className="flex flex-col items-center px-3.5 py-2 rounded-xl bg-sky-500/5 border border-sky-500/20 min-w-[64px]">
          <div className="flex items-center gap-1">
            <Layers className="w-3 h-3 text-sky-500" />
            <span className={clsx("text-base font-bold text-foreground leading-none", isLoading && "animate-pulse")}>
              {isLoading ? "—" : (stats?.totalChunks ?? 0)}
            </span>
          </div>
          <span className="text-[10px] text-muted-foreground mt-1 whitespace-nowrap">
            {t("knowledge.stat_chunks")}
          </span>
        </div>

        {/* Storage */}
        <div className="flex flex-col items-center px-3.5 py-2 rounded-xl bg-amber-500/5 border border-amber-500/20 min-w-[64px]">
          <div className="flex items-center gap-1">
            <HardDrive className="w-3 h-3 text-amber-500" />
            <span className={clsx("text-base font-bold text-foreground leading-none", isLoading && "animate-pulse")}>
              {isLoading ? "—" : formatBytes(stats?.storageUsageBytes)}
            </span>
          </div>
          <span className="text-[10px] text-muted-foreground mt-1 whitespace-nowrap">
            {t("knowledge.stat_storage")}
          </span>
        </div>

        {/* Sync status */}
        <div
          className={clsx(
            "flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-medium",
            isPending
              ? "bg-amber-500/5 border-amber-500/20 text-amber-500"
              : "bg-emerald-500/5 border-emerald-500/20 text-emerald-600"
          )}
        >
          {isPending ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <CheckCircle2 className="w-3.5 h-3.5" />
          )}
          <span>{isPending ? t("knowledge.stat_indexing") : t("knowledge.stat_synced")}</span>
        </div>

        <div className="w-px h-8 bg-border/50 hidden sm:block" />

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onOpenSearchTester}
          leftIcon={<Search className="w-3.5 h-3.5" />}
          className="text-xs border-primary/30 text-primary hover:bg-primary/10 shrink-0"
        >
          {t("knowledge.test_search_button")}
        </Button>
      </div>
    </div>
  );
}
