"use client";

import React, { useState } from "react";
import useSWR from "swr";
import { MapPin, RefreshCw, Trash2, CheckCircle2, AlertCircle, Play } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ConfirmDeleteModal } from "@/components/dashboard/shared/ConfirmDeleteModal";
import { KbScrapedEntriesTable } from "./scrapers/KbScrapedEntriesTable";
import { knowledgeBaseApi, type TwoGisScraperStatus } from "@/lib/api/knowledgeBase";

interface KbTwoGisScraperTabProps {
  status?: TwoGisScraperStatus;
  isLoading: boolean;
  onRefresh: () => void;
}

export function KbTwoGisScraperTab({
  status,
  isLoading,
  onRefresh,
}: KbTwoGisScraperTabProps) {
  const t = useTranslations("dashboard");
  const tCommon = useTranslations("common");

  const [twoGisInput, setTwoGisInput] = useState(status?.branchId || "");
  const [forceRecrawl, setForceRecrawl] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [isConfirmClearOpen, setIsConfirmClearOpen] = useState(false);

  // Load actual scraped 2GIS catalog entries
  const {
    data: entriesData,
    isLoading: isEntriesLoading,
    mutate: mutateEntries,
  } = useSWR(
    ["knowledge-base/entries", "LOCAL_LISTING"],
    () => knowledgeBaseApi.getEntries({ type: "LOCAL_LISTING", limit: 100 }),
    { revalidateOnFocus: true }
  );

  const isSyncActive = status?.status === "PROCESSING" || status?.status === "QUEUED";

  const handleStartSync = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!twoGisInput.trim()) return;
    setIsSubmitting(true);
    try {
      await knowledgeBaseApi.triggerTwoGisScrape(twoGisInput.trim(), forceRecrawl);
      onRefresh();
      mutateEntries();
    } catch (err) {
      console.error("Failed to start 2GIS scrape", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmClear = async () => {
    setIsClearing(true);
    try {
      await knowledgeBaseApi.clearScrapedData("2gis");
      onRefresh();
      mutateEntries();
    } catch (err) {
      console.error("Failed to clear 2GIS data", err);
    } finally {
      setIsClearing(false);
      setIsConfirmClearOpen(false);
    }
  };

  const handleRefreshAll = () => {
    onRefresh();
    mutateEntries();
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <MapPin className="w-4 h-4 text-emerald-500" />
          {t("knowledge.twogis_title")}
        </h3>
        <p className="text-xs text-muted-foreground">
          {t("knowledge.twogis_description")}
        </p>
      </div>

      {/* Sync Starter Form */}
      <form onSubmit={handleStartSync} className="p-4 rounded-2xl bg-card border border-border/60 shadow-xs space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground">
            {t("knowledge.twogis_input_label")}
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              required
              value={twoGisInput}
              onChange={(e) => setTwoGisInput(e.target.value)}
              placeholder={t("knowledge.twogis_input_placeholder")}
              className="flex-1"
            />
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={isSubmitting || isSyncActive}
              leftIcon={<Play className="w-3.5 h-3.5" />}
              className="shrink-0"
            >
              {isSyncActive ? t("knowledge.syncing") : t("knowledge.start_twogis_sync")}
            </Button>
          </div>
        </div>

        <label className="flex items-center gap-2 cursor-pointer select-none text-xs">
          <input
            type="checkbox"
            checked={forceRecrawl}
            onChange={(e) => setForceRecrawl(e.target.checked)}
            className="w-3.5 h-3.5 rounded text-primary accent-primary"
          />
          <span className="text-muted-foreground">
            {t("knowledge.force_recrawl")}
          </span>
        </label>
      </form>

      {/* Status & Results Card */}
      {status && status.status !== "IDLE" && (
        <div className="p-4 rounded-2xl bg-muted/20 border border-border/60 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <span>{t("knowledge.status_sync_label")}</span>
              {status.status === "COMPLETED" && (
                <Badge variant="success" className="text-[10px] px-2 py-0.5">
                  <CheckCircle2 className="w-2.5 h-2.5 mr-1" />
                  {tCommon("status_completed")}
                </Badge>
              )}
              {isSyncActive && (
                <Badge variant="warning" className="text-[10px] px-2 py-0.5">
                  <RefreshCw className="w-2.5 h-2.5 mr-1 animate-spin" />
                  {t("knowledge.syncing")}
                </Badge>
              )}
              {status.status === "FAILED" && (
                <Badge variant="destructive" className="text-[10px] px-2 py-0.5">
                  <AlertCircle className="w-2.5 h-2.5 mr-1" />
                  {tCommon("status_failed")}
                </Badge>
              )}
            </div>

            {((status.itemsDone !== undefined && status.itemsDone > 0) || (entriesData?.entries?.length || 0) > 0) && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsConfirmClearOpen(true)}
                loading={isClearing}
                leftIcon={<Trash2 className="w-3 h-3 text-destructive" />}
                className="text-xs text-destructive hover:bg-destructive/10 h-7"
              >
                {t("knowledge.clear_twogis_data")}
              </Button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-card border border-border/40">
              <div className="text-muted-foreground text-[11px]">{t("knowledge.twogis_branch_label")}</div>
              <div className="font-semibold text-foreground truncate mt-0.5">
                {status.branchId || "—"}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-card border border-border/40">
              <div className="text-muted-foreground text-[11px]">
                {t("knowledge.synced_items")}:
              </div>
              <div className="font-bold text-foreground font-mono mt-0.5">
                {status.itemsDone ?? entriesData?.entries?.length ?? 0}{" "}
                {status.itemsFound ? `/ ${status.itemsFound}` : ""}
              </div>
            </div>
          </div>

          {status.error && (
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs">
              {status.error}
            </div>
          )}
        </div>
      )}

      {/* Scraped 2GIS Catalog Items List */}
      <KbScrapedEntriesTable
        entries={entriesData?.entries || []}
        isLoading={isEntriesLoading}
        type="LOCAL_LISTING"
        onRefresh={handleRefreshAll}
      />

      {/* Clear Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={isConfirmClearOpen}
        onClose={() => setIsConfirmClearOpen(false)}
        onConfirm={handleConfirmClear}
        isLoading={isClearing}
        title={t("knowledge.confirm_clear_twogis_title")}
        description={t("knowledge.confirm_clear_twogis_desc")}
      />
    </div>
  );
}
