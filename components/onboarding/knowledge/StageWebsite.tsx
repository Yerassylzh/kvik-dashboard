"use client";

import React, { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { startWebsiteScraping, getScrapingStatus } from "@/lib/api/onboarding";
import { useToast } from "@/components/ui/toast/ToastContext";
import { FadeIn } from "@/components/ui/motion/FadeIn";

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
  onPrev: () => void;
}

export function StageWebsite({
  inputUrl,
  defaultProfileUrl,
  status = "IDLE",
  parsedCount = 0,
  onChangeUrl,
  onStatusChange,
  onNext,
  onPrev,
}: StageWebsiteProps) {
  const t = useTranslations("onboarding");
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const polledRef = useRef(false);

  const effectiveUrl = inputUrl || defaultProfileUrl || "";

  // Auto-polling for Website scraping status when STARTED
  useEffect(() => {
    if (status !== "STARTED") return;

    let cancelled = false;
    let interval: ReturnType<typeof setInterval> | null = null;

    const poll = async () => {
      try {
        const res = await getScrapingStatus("website");
        if (cancelled) return;

        const isDone =
          res.status === "COMPLETED" ||
          res.status === "DONE" ||
          res.parsingStatus === "DONE" ||
          (res.parsedCount ?? 0) > 0;

        const isFailed =
          res.status === "FAILED" || res.parsingStatus === "FAILED";

        if (isDone) {
          const count = res.parsedCount ?? parsedCount ?? 0;
          onStatusChange("COMPLETED", count);
          if (!polledRef.current) {
            polledRef.current = true;
            toast.success(
              count > 0
                ? `Веб-сайт успешно обработан! Найдено ${count} страниц/услуг.`
                : "Веб-сайт успешно обработан!",
            );
          }
          if (interval) clearInterval(interval);
        } else if (isFailed) {
          onStatusChange("FAILED");
          toast.error(res.error || "Ошибка при сканировании веб-сайта");
          if (interval) clearInterval(interval);
        }
      } catch {
        // Background poll error ignored
      }
    };

    poll();
    interval = setInterval(poll, 2500);

    return () => {
      cancelled = true;
      if (interval) clearInterval(interval);
    };
  }, [status, parsedCount, onStatusChange, toast]);

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
      polledRef.current = false;
      await startWebsiteScraping({ websiteUrl: trimmed });
      onStatusChange("STARTED");
      setIsEditing(false);
      toast.info("Сканирование сайта запущено. Переходим к документам...");
      // Seamlessly advance to next stage
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
      {/* Short Header */}
      <div className="space-y-1">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <span>🌐</span>
          <span>{t("knowledge.website.title")}</span>
        </h3>
        <p className="text-xs text-muted-foreground">
          {t("knowledge.website.desc")}
        </p>
      </div>

      {/* Error alert */}
      {error && (
        <FadeIn className="p-3 rounded-xl alert-destructive border text-xs font-medium flex items-center gap-2 shadow-xs">
          <span>⚠️</span>
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

            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20 text-[10px] font-bold">
              Подключено
            </span>
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
                <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20 text-[10px] font-bold">
                  Идёт анализ
                </span>
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

      {/* Input Form (When IDLE, FAILED, or isEditing) */}
      {(!isConnected || isEditing) && (
        <FadeIn delay={0.05}>
          <form onSubmit={handleStartImport} className="space-y-3">
            <div>
              <input
                type="url"
                value={effectiveUrl}
                onChange={(e) => onChangeUrl(e.target.value)}
                placeholder={t("knowledge.website.input_placeholder")}
                className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-xs sm:text-sm transition-all"
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                {t("knowledge.website.input_help")}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={loading || !effectiveUrl.trim()}
                className="py-3 px-5 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs sm:text-sm rounded-xl shadow-sm transition-all disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    <span>{t("knowledge.website.status_loading")}</span>
                  </>
                ) : (
                  <span>
                    {isEditing
                      ? "Обновить и перезапустить →"
                      : t("knowledge.website.btn_connect")}
                  </span>
                )}
              </button>

              {isEditing && (
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="py-3 px-4 text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  Отмена
                </button>
              )}
            </div>
          </form>
        </FadeIn>
      )}

      {/* Stage Step Actions */}
      <div className="pt-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3">
        <button
          type="button"
          onClick={onPrev}
          className="w-full sm:w-auto text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer py-2 px-3 rounded-lg hover:bg-muted/60 transition-colors"
        >
          ← Назад к 2GIS
        </button>

        <button
          type="button"
          onClick={onNext}
          className="w-full sm:w-auto py-2.5 px-5 rounded-xl font-bold text-xs bg-muted hover:bg-muted/80 text-foreground border border-border transition-colors cursor-pointer flex items-center justify-center gap-1.5"
        >
          <span>{isConnected ? "Далее (к документам) →" : "Пропустить (к документам) →"}</span>
        </button>
      </div>
    </div>
  );
}
