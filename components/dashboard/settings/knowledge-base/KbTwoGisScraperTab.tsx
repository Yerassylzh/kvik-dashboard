"use client";

import React, { useState } from "react";
import useSWR from "swr";
import { MapPin, RefreshCw, Trash2, CheckCircle2, AlertCircle, Play, Eye, ExternalLink } from "lucide-react";
import clsx from "clsx";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ConfirmDeleteModal } from "@/components/dashboard/shared/ConfirmDeleteModal";
import { KbContentInspectorModal } from "./KbContentInspectorModal";
import { knowledgeBaseApi, type TwoGisScraperStatus, type KnowledgeEntryDto } from "@/lib/api/knowledgeBase";

interface KbTwoGisScraperTabProps {
  status?: TwoGisScraperStatus;
  isLoading: boolean;
  onRefresh: () => void;
}

export function KbTwoGisScraperTab({
  status,
  onRefresh,
}: KbTwoGisScraperTabProps) {
  const t = useTranslations("dashboard");
  const tCommon = useTranslations("common");

  const [twoGisInput, setTwoGisInput] = useState(status?.branchId || "");
  const [forceRecrawl, setForceRecrawl] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [isConfirmClearOpen, setIsConfirmClearOpen] = useState(false);
  const [inspectEntry, setInspectEntry] = useState<KnowledgeEntryDto | null>(null);

  // Load actual scraped 2GIS catalog entry
  const {
    data: entriesData,
    mutate: mutateEntries,
  } = useSWR(
    ["knowledge-base/entries", "LOCAL_LISTING"],
    () => knowledgeBaseApi.getEntries({ type: "LOCAL_LISTING", limit: 20 }),
    {
      revalidateOnFocus: true,
      refreshInterval: (data) => {
        const isPending =
          status?.status === "PROCESSING" ||
          status?.status === "QUEUED" ||
          data?.entries?.some((e) => e.processingStatus === "PENDING" || e.processingStatus === "PROCESSING");
        return isPending ? 3000 : 0;
      },
    }
  );

  const isSyncActive = status?.status === "PROCESSING" || status?.status === "QUEUED";
  const syncedEntry = entriesData?.entries?.[0] || null;
  const hasSyncedData = Boolean(syncedEntry) || ((status?.itemsDone ?? 0) > 0);

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

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    try {
      await knowledgeBaseApi.updateEntry(id, { active: !currentActive });
      onRefresh();
      mutateEntries();
    } catch (err) {
      console.error("Failed to toggle entry active status", err);
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
              className="flex-1 text-xs"
            />
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={isSubmitting || isSyncActive}
              leftIcon={<Play className="w-3.5 h-3.5" />}
              className="shrink-0 text-xs font-semibold"
            >
              {isSyncActive ? t("knowledge.syncing") : t("knowledge.start_twogis_sync")}
            </Button>
          </div>
        </div>

        {/* Force recrawl — styled toggle consistent with the rest of the page */}
        <label className="flex items-center gap-2.5 cursor-pointer select-none">
          <button
            type="button"
            role="switch"
            aria-checked={forceRecrawl}
            onClick={() => setForceRecrawl((v) => !v)}
            className={clsx(
              "relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
              forceRecrawl ? "bg-primary" : "bg-muted"
            )}
          >
            <span
              className={clsx(
                "pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                forceRecrawl ? "translate-x-3" : "translate-x-0"
              )}
            />
          </button>
          <span className="text-xs text-muted-foreground">
            {t("knowledge.force_recrawl")}
          </span>
        </label>
      </form>

      {/* Unified Single 2GIS Catalog Card */}
      {hasSyncedData && (
        <div className="p-4 rounded-2xl bg-card border border-border/60 shadow-xs space-y-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 mt-0.5">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-sm font-bold text-foreground">
                    {syncedEntry?.title || `2GIS (${status?.branchId || twoGisInput})`}
                  </h4>
                  {syncedEntry?.processingStatus === "COMPLETED" || status?.status === "COMPLETED" ? (
                    <Badge variant="success" className="text-[10px] px-1.5 py-0.2">
                      <CheckCircle2 className="w-2.5 h-2.5 mr-1" />
                      {tCommon("status_completed")}
                    </Badge>
                  ) : isSyncActive ? (
                    <Badge variant="warning" className="text-[10px] px-1.5 py-0.2">
                      <RefreshCw className="w-2.5 h-2.5 mr-1 animate-spin" />
                      {t("knowledge.syncing")}
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="text-[10px] px-1.5 py-0.2">
                      <AlertCircle className="w-2.5 h-2.5 mr-1" />
                      {tCommon("status_failed")}
                    </Badge>
                  )}
                  {/* Items count inline chip — no redundant grid needed */}
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-muted/60 border border-border/40 text-muted-foreground font-mono">
                    {status?.itemsDone ?? status?.itemsFound ?? 0} {t("knowledge.items_label")}
                  </span>
                </div>

                <div className="flex items-center gap-2 mt-1 text-[11px] text-muted-foreground font-mono">
                  <span>ID: {status?.branchId || syncedEntry?.externalId || twoGisInput}</span>
                  {syncedEntry?.sourceUrl && (
                    <a
                      href={syncedEntry.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary hover:underline flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>{t("knowledge.link_label")}</span>
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Actions: safe actions left, destructive right with separator */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Active toggle */}
              {syncedEntry && (
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={syncedEntry.active}
                    onClick={() => handleToggleActive(syncedEntry.id, syncedEntry.active)}
                    className={clsx(
                      "relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                      syncedEntry.active ? "bg-primary" : "bg-muted"
                    )}
                  >
                    <span
                      className={clsx(
                        "pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                        syncedEntry.active ? "translate-x-3" : "translate-x-0"
                      )}
                    />
                  </button>
                  <span className="text-[11px] text-muted-foreground">
                    {syncedEntry.active ? t("knowledge.active_enabled") : t("knowledge.active_disabled")}
                  </span>
                </label>
              )}

              {syncedEntry && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setInspectEntry(syncedEntry)}
                  leftIcon={<Eye className="w-3.5 h-3.5 text-primary" />}
                  className="text-xs h-7"
                >
                  {t("knowledge.inspect_data_btn")}
                </Button>
              )}

              {/* Separator before destructive action */}
              <div className="w-px h-6 bg-border/50" />

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsConfirmClearOpen(true)}
                loading={isClearing}
                leftIcon={<Trash2 className="w-3.5 h-3.5 text-destructive" />}
                className="text-xs text-destructive hover:bg-destructive/10 h-7"
              >
                {t("knowledge.clear_twogis_data")}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Content Inspector Modal */}
      <KbContentInspectorModal
        isOpen={Boolean(inspectEntry)}
        onClose={() => setInspectEntry(null)}
        entryId={inspectEntry?.id || null}
        initialEntry={inspectEntry}
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
