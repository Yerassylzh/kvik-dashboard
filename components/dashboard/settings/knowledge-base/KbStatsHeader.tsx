"use client";

import React from "react";
import { Database, Layers, HardDrive, CheckCircle2, RefreshCw, Search, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import type { KnowledgeBaseStatsDto } from "@/types/knowledgeBase";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-card border border-border/60 shadow-xs">
      <div className="space-y-1">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Database className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-base font-bold text-foreground">
              {t("knowledge.title")}
            </h1>
            <p className="text-xs text-muted-foreground">
              {t("knowledge.description")}
            </p>
          </div>
        </div>

        {/* Compact stats chips inline */}
        <div className="flex flex-wrap items-center gap-2 pt-2 text-xs">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted/40 border border-border/40 text-muted-foreground font-mono text-[11px]">
            <span className="font-semibold text-foreground">{isLoading ? "…" : stats?.totalEntries ?? 0}</span>
            <span>источников</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted/40 border border-border/40 text-muted-foreground font-mono text-[11px]">
            <Layers className="w-3 h-3 text-sky-500" />
            <span className="font-semibold text-foreground">{isLoading ? "…" : stats?.totalChunks ?? 0}</span>
            <span>векторных чанков</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted/40 border border-border/40 text-muted-foreground font-mono text-[11px]">
            <HardDrive className="w-3 h-3 text-amber-500" />
            <span className="font-semibold text-foreground">{isLoading ? "…" : formatBytes(stats?.storageUsageBytes)}</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted/40 border border-border/40 text-[11px]">
            {isPending ? (
              <>
                <RefreshCw className="w-3 h-3 text-amber-500 animate-spin" />
                <span className="text-amber-500 font-medium">Индексация...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                <span className="text-emerald-500 font-medium">Синхронизировано</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 self-start md:self-center">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onOpenSearchTester}
          leftIcon={<Search className="w-3.5 h-3.5" />}
          className="text-xs border-primary/30 text-primary hover:bg-primary/10"
        >
          {t("knowledge.test_search_button")}
        </Button>
      </div>
    </div>
  );
}
