"use client";

import React, { useState, useEffect } from "react";
import { Star, ExternalLink, RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";
import { SectionCard } from "@/components/dashboard/shared/SectionCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { PostVisitRetentionConfig } from "@/lib/api/followUps";

interface ReviewRetentionCardProps {
  config: PostVisitRetentionConfig;
  onSave: (config: {
    enabled?: boolean;
    send2GisReviewRequest?: boolean;
    sendReviewRequestAfterMinutes?: number;
    direct2GisReviewUrl?: string | null;
    sendRepeatRecallAfterDays?: number;
  }) => Promise<void>;
  isUpdating?: boolean;
}

export function ReviewRetentionCard({
  config,
  onSave,
  isUpdating = false,
}: ReviewRetentionCardProps) {
  const t = useTranslations("dashboard");
  const [enabled, setEnabled] = useState(config?.enabled ?? true);
  const [send2Gis, setSend2Gis] = useState(config?.send2GisReviewRequest ?? true);
  const [delayMinutes, setDelayMinutes] = useState(
    config?.sendReviewRequestAfterMinutes ?? 120
  );
  const [reviewUrl, setReviewUrl] = useState(config?.direct2GisReviewUrl || "");
  const [repeatRecallDays, setRepeatRecallDays] = useState(
    config?.sendRepeatRecallAfterDays ?? 30
  );
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setEnabled(config?.enabled ?? true);
    setSend2Gis(config?.send2GisReviewRequest ?? true);
    setDelayMinutes(config?.sendReviewRequestAfterMinutes ?? 120);
    setReviewUrl(config?.direct2GisReviewUrl || "");
    setRepeatRecallDays(config?.sendRepeatRecallAfterDays ?? 30);
    setHasChanges(false);
  }, [config]);

  const handleToggle = () => {
    setEnabled(!enabled);
    setHasChanges(true);
  };

  const handleSave = async () => {
    await onSave({
      enabled,
      send2GisReviewRequest: send2Gis,
      sendReviewRequestAfterMinutes: delayMinutes,
      direct2GisReviewUrl: reviewUrl || null,
      sendRepeatRecallAfterDays: repeatRecallDays,
    });
    setHasChanges(false);
  };

  return (
    <SectionCard
      title={t("automations.review_title")}
      description={t("automations.review_desc")}
      action={
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={enabled}
            onChange={handleToggle}
            className="sr-only peer"
          />
          <div className="w-9 h-5 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
        </label>
      }
    >
      <div className="space-y-4">
        {/* 2GIS Review Request */}
        <div className="p-3.5 rounded-xl border border-border/70 bg-card space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span className="text-xs font-semibold text-foreground">
                  {t("automations.review_feature_title")}
                </span>
                <Badge variant="default" className="text-[10px]">
                  {t("automations.review_badge_time")}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {t("automations.review_feature_desc")}
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5">
              <input
                type="checkbox"
                disabled={!enabled}
                checked={send2Gis}
                onChange={() => {
                  setSend2Gis(!send2Gis);
                  setHasChanges(true);
                }}
                className="sr-only peer"
              />
              <div className="w-8 h-4 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[1px] after:left-[1px] after:bg-white after:border-border after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-primary disabled:opacity-50"></div>
            </label>
          </div>

          {/* 2GIS URL Input */}
          <div className="space-y-1.5 pt-1">
            <label className="text-[11px] font-medium text-muted-foreground">
              {t("automations.review_url_label")}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="url"
                disabled={!enabled || !send2Gis}
                placeholder={t("automations.review_url_placeholder")}
                value={reviewUrl}
                onChange={(e) => {
                  setReviewUrl(e.target.value);
                  setHasChanges(true);
                }}
                className="w-full text-xs bg-background border border-border/80 rounded-lg px-2.5 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary disabled:opacity-50 font-mono text-[11px]"
              />
              {reviewUrl && (
                <a
                  href={reviewUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 rounded-lg border border-border/80 text-muted-foreground hover:text-foreground hover:bg-muted/50 shrink-0"
                  title={t("automations.review_url_open")}
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Repeat Visit Recall */}
        <div className="p-3.5 rounded-xl border border-border/70 bg-card space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-semibold text-foreground">
                {t("automations.winback_title")}
              </span>
            </div>
            <select
              disabled={!enabled}
              value={repeatRecallDays}
              onChange={(e) => {
                setRepeatRecallDays(Number(e.target.value));
                setHasChanges(true);
              }}
              className="text-xs bg-background border border-border/80 rounded-md px-2 py-1 text-foreground font-semibold tabular-nums"
            >
              <option value={21}>{t("automations.winback_21d")}</option>
              <option value={30}>{t("automations.winback_30d")}</option>
              <option value={45}>{t("automations.winback_45d")}</option>
              <option value={60}>{t("automations.winback_60d")}</option>
            </select>
          </div>
          <p className="text-xs text-muted-foreground">
            {t("automations.winback_desc")}
          </p>
        </div>

        {/* Save Button */}
        {hasChanges && (
          <div className="pt-2 flex justify-end">
            <Button
              size="sm"
              onClick={handleSave}
              loading={isUpdating}
              className="text-xs"
            >
              {t("automations.save_retention_btn")}
            </Button>
          </div>
        )}
      </div>
    </SectionCard>
  );
}
