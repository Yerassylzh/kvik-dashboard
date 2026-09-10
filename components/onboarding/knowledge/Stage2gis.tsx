"use client";

import React, { useState, useRef } from "react";
import { useTranslations } from "next-intl";
import { start2gisScraping, getScrapingStatus } from "@/lib/api/onboarding";
import { useToast } from "@/components/ui/toast/ToastContext";
import { FadeIn } from "@/components/ui/motion/FadeIn";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usePolling } from "@/hooks/usePolling";

interface Stage2gisProps {
  inputUrl: string;
  status?: "IDLE" | "STARTED" | "COMPLETED" | "FAILED" | "SKIPPED";
  parsedCount?: number;
  onChangeUrl: (val: string) => void;
  onStatusChange: (
    status: "IDLE" | "STARTED" | "COMPLETED" | "FAILED" | "SKIPPED",
    count?: number,
  ) => void;
  onNext: () => void;
}

export function Stage2gis({
  inputUrl,
  status = "IDLE",
  parsedCount = 0,
  onChangeUrl,
  onStatusChange,
  onNext,
}: Stage2gisProps) {
  const t = useTranslations("onboarding");
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const notifiedDoneRef = useRef(false);

  // Declarative Polling for 2GIS status
  usePolling({
    enabled: status === "STARTED",
    fetcher: () => getScrapingStatus("2gis"),
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
              ? `2GIS каталог успешно импортирован! Загружено ${count} услуг.`
              : "2GIS каталог успешно импортирован!"
          );
        }
      } else if (isFailed) {
        onStatusChange("FAILED");
        toast.error(res.error || "Ошибка обработки 2GIS каталога");
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
    const trimmed = inputUrl.trim();
    if (!trimmed) {
      setError(t("knowledge.twogis.input_help"));
      toast.error(t("knowledge.twogis.input_help"));
      return;
    }

    try {
      setLoading(true);
      setError(null);
      notifiedDoneRef.current = false;
      await start2gisScraping({ input: trimmed });
      onStatusChange("STARTED");
      setIsEditing(false);
      toast.info("Импорт 2GIS запущен. Переходим к веб-сайту...");
      setTimeout(() => {
        onNext();
      }, 600);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : t("knowledge.twogis.error_import");
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
    toast.info("Подключение 2GIS сброшено");
  };

  const isCompleted = status === "COMPLETED" && !isEditing;
  const isStarted = status === "STARTED" && !isEditing;
  const isConnected = isCompleted || isStarted;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="space-y-1">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <span>📍</span>
          <span>{t("knowledge.twogis.title")}</span>
        </h3>
        <p className="text-xs text-muted-foreground">
          {t("knowledge.twogis.desc")}
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
              <div className="h-9 w-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-sm">
                ✓
              </div>
              <div>
                <span className="font-bold text-sm text-foreground">
                  2GIS подключён
                </span>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {parsedCount > 0
                    ? `Каталог и ${parsedCount} услуг распознаны.`
                    : "Каталог и услуги распознаны ИИ."}
                </p>
              </div>
            </div>

            <Badge variant="success">Подключено</Badge>
          </div>

          <div className="p-2.5 rounded-xl bg-muted/40 border border-border flex items-center justify-between gap-3 text-xs">
            <span className="text-muted-foreground truncate font-mono text-[11px]">
              {inputUrl}
            </span>
            <div className="flex items-center gap-3 flex-shrink-0">
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="text-xs text-accent-brand font-semibold hover:underline cursor-pointer"
              >
                {t("knowledge.twogis.btn_change_url")}
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
            <div className="h-9 w-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
              <div className="h-4 w-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-foreground">
                  2GIS подключён
                </span>
                <Badge variant="success" pulse>
                  Идёт обработка
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t("knowledge.twogis.status_loading_desc")}
              </p>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-muted/40 border border-border flex items-center justify-between gap-3 text-xs">
            <span className="text-muted-foreground truncate font-mono text-[11px]">
              {inputUrl}
            </span>
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="text-xs text-accent-brand font-semibold hover:underline cursor-pointer flex-shrink-0"
            >
              {t("knowledge.twogis.btn_change_url")}
            </button>
          </div>
        </FadeIn>
      )}

      {/* Input Form */}
      {(!isConnected || isEditing) && (
        <FadeIn delay={0.05}>
          <form onSubmit={handleStartImport} className="space-y-3">
            <Input
              value={inputUrl}
              onChange={(e) => onChangeUrl(e.target.value)}
              placeholder={t("knowledge.twogis.input_placeholder")}
              helperText={t("knowledge.twogis.input_help")}
            />

            <div className="flex items-center gap-2">
              <Button
                type="submit"
                loading={loading}
                disabled={!inputUrl.trim()}
              >
                {isEditing
                  ? "Обновить и перезапустить →"
                  : t("knowledge.twogis.btn_connect")}
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
          {isConnected ? "Далее (к сайту) →" : "Пропустить (к сайту) →"}
        </Button>
      </div>
    </div>
  );
}
