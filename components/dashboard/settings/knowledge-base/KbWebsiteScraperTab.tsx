"use client";

import React, { useState } from "react";
import useSWR from "swr";
import { Globe, RefreshCw, Trash2, CheckCircle2, AlertCircle, Play } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ConfirmDeleteModal } from "@/components/dashboard/shared/ConfirmDeleteModal";
import { KbScrapedEntriesTable } from "./scrapers/KbScrapedEntriesTable";
import { knowledgeBaseApi, type WebsiteScraperStatus } from "@/lib/api/knowledgeBase";

interface KbWebsiteScraperTabProps {
  status?: WebsiteScraperStatus;
  isLoading: boolean;
  onRefresh: () => void;
}

export function KbWebsiteScraperTab({
  status,
  onRefresh,
}: KbWebsiteScraperTabProps) {
  const t = useTranslations("dashboard");
  const tCommon = useTranslations("common");

  const [websiteUrl, setWebsiteUrl] = useState(status?.targetUrl || "");
  const [forceRecrawl, setForceRecrawl] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [isConfirmClearOpen, setIsConfirmClearOpen] = useState(false);

  // Load actual crawled website entries
  const {
    data: entriesData,
    isLoading: isEntriesLoading,
    mutate: mutateEntries,
  } = useSWR(
    ["knowledge-base/entries", "WEBSITE_CONTENT"],
    () => knowledgeBaseApi.getEntries({ type: "WEBSITE_CONTENT", limit: 100 }),
    { revalidateOnFocus: true }
  );

  const isScrapingActive = status?.status === "PROCESSING" || status?.status === "QUEUED";

  const handleStartCrawl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!websiteUrl.trim()) return;
    setIsSubmitting(true);
    try {
      await knowledgeBaseApi.triggerWebsiteScrape(websiteUrl.trim(), forceRecrawl);
      onRefresh();
      mutateEntries();
    } catch (err) {
      console.error("Failed to start website crawl", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmClear = async () => {
    setIsClearing(true);
    try {
      await knowledgeBaseApi.clearScrapedData("website");
      onRefresh();
      mutateEntries();
    } catch (err) {
      console.error("Failed to clear website data", err);
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
          <Globe className="w-4 h-4 text-primary" />
          {t("knowledge.website_title")}
        </h3>
        <p className="text-xs text-muted-foreground">
          {t("knowledge.website_description")}
        </p>
      </div>

      {/* Crawl Starter Form */}
      <form onSubmit={handleStartCrawl} className="p-4 rounded-2xl bg-card border border-border/60 shadow-xs space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground">
            {t("knowledge.website_url_label")}
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              type="url"
              required
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder={t("knowledge.website_url_placeholder")}
              className="flex-1"
            />
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={isSubmitting || isScrapingActive}
              leftIcon={<Play className="w-3.5 h-3.5" />}
              className="shrink-0"
            >
              {isScrapingActive ? t("knowledge.scanning") : t("knowledge.start_scan")}
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
              <span>{t("knowledge.status_crawl_label")}</span>
              {status.status === "COMPLETED" && (
                <Badge variant="success" className="text-[10px] px-2 py-0.5">
                  <CheckCircle2 className="w-2.5 h-2.5 mr-1" />
                  {tCommon("status_completed")}
                </Badge>
              )}
              {isScrapingActive && (
                <Badge variant="warning" className="text-[10px] px-2 py-0.5">
                  <RefreshCw className="w-2.5 h-2.5 mr-1 animate-spin" />
                  {t("knowledge.scanning")}
                </Badge>
              )}
              {status.status === "FAILED" && (
                <Badge variant="destructive" className="text-[10px] px-2 py-0.5">
                  <AlertCircle className="w-2.5 h-2.5 mr-1" />
                  {tCommon("status_failed")}
                </Badge>
              )}
            </div>

            {((status.pagesDone !== undefined && status.pagesDone > 0) || (entriesData?.entries?.length || 0) > 0) && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsConfirmClearOpen(true)}
                loading={isClearing}
                leftIcon={<Trash2 className="w-3 h-3 text-destructive" />}
                className="text-xs text-destructive hover:bg-destructive/10 h-7"
              >
                {t("knowledge.clear_website_data")}
              </Button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-card border border-border/40">
              <div className="text-muted-foreground text-[11px]">{t("knowledge.target_site_label")}</div>
              <div className="font-semibold text-foreground truncate mt-0.5">
                {status.targetUrl || "—"}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-card border border-border/40">
              <div className="text-muted-foreground text-[11px]">
                {t("knowledge.scanned_pages")}:
              </div>
              <div className="font-bold text-foreground font-mono mt-0.5">
                {status.pagesDone ?? entriesData?.entries?.length ?? 0}{" "}
                {status.pagesFound ? `/ ${status.pagesFound}` : ""}
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

      {/* Scraped Pages List */}
      <KbScrapedEntriesTable
        entries={entriesData?.entries || []}
        isLoading={isEntriesLoading}
        type="WEBSITE_CONTENT"
        onRefresh={handleRefreshAll}
      />

      {/* Clear Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={isConfirmClearOpen}
        onClose={() => setIsConfirmClearOpen(false)}
        onConfirm={handleConfirmClear}
        isLoading={isClearing}
        title={t("knowledge.confirm_clear_website_title")}
        description={t("knowledge.confirm_clear_website_desc")}
      />
    </div>
  );
}
