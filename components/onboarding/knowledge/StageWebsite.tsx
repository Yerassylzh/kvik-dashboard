"use client";

import React, { useState, useRef } from "react";
import { useTranslations } from "next-intl";
import { Globe, AlertCircle } from "lucide-react";
import { startWebsiteScraping, getScrapingStatus } from "@/lib/api/onboarding";
import { useToast } from "@/components/ui/toast/ToastContext";
import { FadeIn } from "@/components/ui/motion/FadeIn";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usePolling } from "@/hooks/usePolling";

interface StageWebsiteProps {
  inputUrl: string;
  defaultProfileUrl?: string;
  status?: "IDLE" | "STARTED" | "COMPLETED" | "FAILED" | "SKIPPED";
  parsedCount?: number;
  onChangeUrl: (val: string) => void;
  onStatusChange: (
    status: "IDLE" | "STARTED" | "COMPLETED" | "FAILED" | "SKIPPED",
    count?: number,
  ) => void;
  onNext: () => void;
}

export function StageWebsite({
  inputUrl,
  defaultProfileUrl,
  status = "IDLE",
  parsedCount = 0,
  onChangeUrl,
  onStatusChange,
  onNext,
}: StageWebsiteProps) {
  const t = useTranslations("onboarding");
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const notifiedDoneRef = useRef(false);

  const effectiveUrl = inputUrl || defaultProfileUrl || "";

  // Declarative Polling for Website status
  usePolling({
    enabled: status === "STARTED",
    fetcher: () => getScrapingStatus("website"),
    intervalMs: 2500,
    onSuccess: (res) => {
      const isDone =
        res.status === "COMPLETED" ||
        res.status === "DONE" ||
        res.parsingStatus === "DONE" ||
        (res.parsedCount ?? 0) > 0;

      const isFailed = res.status === "FAILED" || res.parsingStatus === "FAILED";

      if (isDone) {
        const count = res.parsedCount ?? parsedCount ?? 0;
        onStatusChange("COMPLETED", count);
        if (!notifiedDoneRef.current) {
          notifiedDoneRef.current = true;
          toast.success(
            count > 0
              ? `Веб-сайт успешно обработан! Найдено ${count} страниц/услуг.`
              : "Веб-сайт успешно обработан!"
          );
        }
      } else if (isFailed) {
        onStatusChange("FAILED");
        toast.error(res.error || "Ошибка при сканировании веб-сайта");
      }
    },
    shouldStop: (res) =>
      res.status === "COMPLETED" ||
      res.status === "DONE" ||
      res.parsingStatus === "DONE" ||
      res.status === "FAILED" ||
      res.parsingStatus === "FAILED",
  });

  const handleStartImport = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = effectiveUrl.trim();
    if (!trimmed) {
      setError(t("knowledge.website.input_help"));
      toast.error(t("knowledge.website.input_help"));
      return;
    }

    try {
      setLoading(true);
      setError(null);
      notifiedDoneRef.current = false;
      await startWebsiteScraping({ websiteUrl: trimmed });
      onStatusChange("STARTED");
      setIsEditing(false);
      toast.info("Сканирование сайта запущено. Переходим к документам...");
      setTimeout(() => {
        onNext();
      }, 600);
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : t("knowledge.website.error_import");
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    onChangeUrl("");
    onStatusChange("IDLE");
    setIsEditing(false);
    toast.info("Подключение веб-сайта сброшено");
  };

  const isCompleted = status === "COMPLETED" && !isEditing;
  const isStarted = status === "STARTED" && !isEditing;
  const isConnected = isCompleted || isStarted;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="space-y-1">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <Globe className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span>{t("knowledge.website.title")}</span>
        </h3>
        <p className="text-xs text-muted-foreground">
          {t("knowledge.website.desc")}
        </p>
      </div>

      {/* Error alert */}
      {error && (
        <FadeIn className="p-3 rounded-xl alert-destructive border text-xs font-medium flex items-center gap-2 shadow-xs">
          <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
          <span>{error}</span>
        </FadeIn>
      )}

      {/* Completed State */}
      {isCompleted && (
        <FadeIn className="p-5 rounded-2xl bg-card border border-border space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm">
                ✓
              </div>
              <div>
                <span className="font-bold text-sm text-foreground">
                  Веб-сайт успешно подключён
                </span>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {parsedCount > 0
                    ? `Сайт и ${parsedCount} записей обработаны.`
                    : "Страницы сайта обработаны ИИ."}
                </p>
              </div>
            </div>

            <Badge variant="info">Подключено</Badge>
          </div>

          <div className="p-2.5 rounded-xl bg-muted/40 border border-border flex items-center justify-between gap-3 text-xs">
            <span className="text-muted-foreground truncate font-mono text-[11px]">
              {effectiveUrl}
            </span>
            <div className="flex items-center gap-3 flex-shrink-0">
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="text-xs text-accent-brand font-semibold hover:underline cursor-pointer"
              >
                {t("knowledge.website.btn_change_url")}
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="text-xs text-destructive hover:underline cursor-pointer"
              >
                Удалить
              </button>
            </div>
          </div>
        </FadeIn>
      )}

      {/* Started / Scraping Active State */}
      {isStarted && (
        <FadeIn className="p-5 rounded-2xl bg-card border border-border space-y-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0">
              <div className="h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-foreground">
                  Веб-сайт подключён
                </span>
                <Badge variant="info" pulse>
                  Идёт анализ
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t("knowledge.website.status_loading_desc")}
              </p>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-muted/40 border border-border flex items-center justify-between gap-3 text-xs">
            <span className="text-muted-foreground truncate font-mono text-[11px]">
              {effectiveUrl}
            </span>
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="text-xs text-accent-brand font-semibold hover:underline cursor-pointer flex-shrink-0"
            >
              {t("knowledge.website.btn_change_url")}
            </button>
          </div>
        </FadeIn>
      )}

      {/* Input Form */}
      {(!isConnected || isEditing) && (
        <FadeIn delay={0.05}>
          <form onSubmit={handleStartImport} className="space-y-3">
            <Input
              type="url"
              value={effectiveUrl}
              onChange={(e) => onChangeUrl(e.target.value)}
              placeholder={t("knowledge.website.input_placeholder")}
              helperText={t("knowledge.website.input_help")}
            />

            <div className="flex items-center gap-2">
              <Button
                type="submit"
                loading={loading}
                disabled={!effectiveUrl.trim()}
              >
                {isEditing
                  ? "Обновить и перезапустить →"
                  : t("knowledge.website.btn_connect")}
              </Button>

              {isEditing && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsEditing(false)}
                >
                  Отмена
                </Button>
              )}
            </div>
          </form>
        </FadeIn>
      )}

      {/* Stage Step Actions */}
      <div className="pt-4 border-t border-border flex items-center justify-end">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={onNext}
        >
          {isConnected ? "Далее (к документам) →" : "Пропустить (к документам) →"}
        </Button>
      </div>
    </div>
  );
}
