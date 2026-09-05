"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useTranslations } from "next-intl";
import {
  addKnowledgeNote,
  getKnowledgeNotes,
  KnowledgeNoteStatus,
} from "@/lib/api/onboarding";
import { useToast } from "@/components/ui/toast/ToastContext";
import { FadeIn } from "@/components/ui/motion/FadeIn";

interface StageNotesProps {
  savedNotes: string[];
  onAddNote: (note: string) => void;
  onRemoveNote?: (index: number) => void;
  onNext: () => void;
  onPrev: () => void;
  hasAnySource: boolean;
}

const NOTE_SUGGESTIONS = [
  "Предоплата 2000 ₸ обязательна для записей длительностью более 2 часов.",
  "Отмена или перенос записи принимаются минимум за 3 часа до визита.",
  "Бесплатная парковка для клиентов с обратной стороны здания.",
  "Перед сложным окрашиванием требуется очная консультация мастера.",
];

const POLL_INTERVAL_MS = 3000;
const MAX_POLL_ATTEMPTS = 20;

export function StageNotes({
  savedNotes,
  onAddNote,
  onRemoveNote,
  onNext,
  onPrev,
  hasAnySource,
}: StageNotesProps) {
  const t = useTranslations("onboarding");
  const toast = useToast();
  const [currentNote, setCurrentNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Track live processing statuses of recently submitted notes
  const [noteStatuses, setNoteStatuses] = useState<
    Record<string, KnowledgeNoteStatus>
  >({});
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollAttemptsRef = useRef(0);
  const pollActiveRef = useRef(false);

  const hasPending = Object.values(noteStatuses).some(
    (n) => n.processingStatus === "PENDING" || n.processingStatus === "PROCESSING"
  );

  const startPolling = useCallback(() => {
    if (pollActiveRef.current) return;
    pollActiveRef.current = true;
    pollAttemptsRef.current = 0;

    const poll = async () => {
      if (!pollActiveRef.current) return;
      if (pollAttemptsRef.current >= MAX_POLL_ATTEMPTS) {
        pollActiveRef.current = false;
        return;
      }
      pollAttemptsRef.current += 1;

      try {
        const notes = await getKnowledgeNotes();
        setNoteStatuses((prev) => {
          const next = { ...prev };
          for (const n of notes) {
            if (next[n.id]) {
              next[n.id] = n;
            }
          }
          return next;
        });

        // Check if all pending are done
        const stillPending = notes.some(
          (n) =>
            n.processingStatus === "PENDING" ||
            n.processingStatus === "PROCESSING"
        );
        if (!stillPending) {
          pollActiveRef.current = false;
          return;
        }
      } catch {
        // Silently continue polling
      }

      pollTimerRef.current = setTimeout(poll, POLL_INTERVAL_MS);
    };

    pollTimerRef.current = setTimeout(poll, POLL_INTERVAL_MS);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      pollActiveRef.current = false;
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    };
  }, []);

  const handleSaveNote = async () => {
    const trimmed = currentNote.trim();
    if (!trimmed) {
      toast.error("Пожалуйста, введите текст заметки");
      return;
    }

    setSubmitting(true);
    try {
      const res = await addKnowledgeNote({ notes: [trimmed] });

      // Immediately add to parent state (optimistic)
      onAddNote(trimmed);
      setCurrentNote("");
      toast.success("Заметка сохранена! ИИ обрабатывает её в фоне.");

      // Register returned notes for status tracking
      if (res?.notes?.length) {
        setNoteStatuses((prev) => {
          const next = { ...prev };
          for (const n of res.notes) {
            next[n.id] = n;
          }
          return next;
        });
        startPolling();
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : t("knowledge.notes.error_save")
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleUseSuggestion = (suggestion: string) => {
    setCurrentNote((prev) => (prev ? `${prev}\n${suggestion}` : suggestion));
  };

  const hasNotes = savedNotes.length > 0;

  const pendingCount = Object.values(noteStatuses).filter(
    (n) => n.processingStatus === "PENDING" || n.processingStatus === "PROCESSING"
  ).length;

  return (
    <div className="space-y-5">
      {/* Short Header */}
      <div className="space-y-1">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <span>📝</span>
          <span>{t("knowledge.notes.title")}</span>
        </h3>
        <p className="text-xs text-muted-foreground">
          {t("knowledge.notes.desc")}
        </p>
      </div>

      {/* Quick Suggestion Chips */}
      <div className="space-y-1.5">
        <span className="text-[11px] font-semibold text-muted-foreground">
          Быстрые подсказки:
        </span>
        <div className="flex flex-wrap gap-1.5">
          {NOTE_SUGGESTIONS.map((sug, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleUseSuggestion(sug)}
              className="text-[11px] px-2.5 py-1 rounded-lg bg-muted/70 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/80 transition-colors text-left cursor-pointer"
            >
              + {sug}
            </button>
          ))}
        </div>
      </div>

      {/* Note Input */}
      <div className="space-y-2">
        <textarea
          rows={3}
          value={currentNote}
          onChange={(e) => setCurrentNote(e.target.value)}
          placeholder={t("knowledge.notes.input_placeholder")}
          className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-xs sm:text-sm transition-all"
        />

        <button
          type="button"
          onClick={handleSaveNote}
          disabled={submitting || !currentNote.trim()}
          className="py-2.5 px-5 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs rounded-xl shadow-xs transition-all disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {submitting ? (
            <>
              <div className="h-3.5 w-3.5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              <span>{t("knowledge.notes.btn_saving")}</span>
            </>
          ) : (
            <span>{t("knowledge.notes.btn_add_note")}</span>
          )}
        </button>
      </div>

      {/* Background processing indicator */}
      {hasPending && (
        <FadeIn className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary/5 border border-primary/20 text-xs text-muted-foreground">
          <div className="h-3 w-3 border-2 border-primary/30 border-t-primary rounded-full animate-spin flex-shrink-0" />
          <span>
            ИИ обрабатывает {pendingCount > 1 ? `${pendingCount} заметки` : "заметку"}… Вы можете продолжить
          </span>
        </FadeIn>
      )}

      {/* Saved Notes List */}
      {hasNotes && (
        <FadeIn
          delay={0.05}
          className="space-y-1.5 pt-2 border-t border-border"
        >
          <span className="text-[11px] font-semibold text-muted-foreground">
            {t("knowledge.notes.saved_title", { count: savedNotes.length })}
          </span>
          <div className="space-y-1.5 max-h-36 overflow-y-auto themed-scroll">
            {savedNotes.map((noteText, idx) => {
              // Find matching status entry by note text
              const statusEntry = Object.values(noteStatuses).find(
                (n) => n.note === noteText
              );
              const isPending =
                statusEntry?.processingStatus === "PENDING" ||
                statusEntry?.processingStatus === "PROCESSING";
              const isFailed = statusEntry?.processingStatus === "FAILED";

              return (
                <div
                  key={idx}
                  className="p-2.5 rounded-xl bg-card border border-border flex items-start justify-between gap-2 text-xs shadow-xs"
                >
                  <div className="flex items-start gap-2 flex-1 min-w-0">
                    {isPending ? (
                      <div className="h-3.5 w-3.5 border-2 border-primary/30 border-t-primary rounded-full animate-spin flex-shrink-0 mt-0.5" />
                    ) : isFailed ? (
                      <span className="text-destructive font-bold mt-0.5 text-xs flex-shrink-0">
                        ✕
                      </span>
                    ) : (
                      <span className="text-emerald-600 font-bold mt-0.5 text-xs flex-shrink-0">
                        ✓
                      </span>
                    )}
                    <p className="text-foreground leading-relaxed text-xs">
                      {noteText}
                    </p>
                  </div>
                  {onRemoveNote && !isPending && (
                    <button
                      type="button"
                      onClick={() => onRemoveNote(idx)}
                      className="text-muted-foreground hover:text-destructive cursor-pointer p-0.5 text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </FadeIn>
      )}

      {/* Stage Step Actions */}
      <div className="pt-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3">
        <button
          type="button"
          onClick={onPrev}
          className="w-full sm:w-auto text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer py-2 px-3 rounded-lg hover:bg-muted/60 transition-colors"
        >
          ← Назад к документам
        </button>

        <button
          type="button"
          onClick={onNext}
          className={`w-full sm:w-auto py-3.5 px-6 font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 ${
            hasAnySource || hasNotes
              ? "bg-primary hover:bg-primary/90 text-primary-foreground"
              : "bg-muted hover:bg-muted/80 text-foreground border border-border"
          }`}
        >
          <span>
            {hasAnySource || hasNotes
              ? "Проверить базу знаний →"
              : "Пропустить и перейти к проверке →"}
          </span>
        </button>
      </div>
    </div>
  );
}
