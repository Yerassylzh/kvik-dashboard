"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import {
  addKnowledgeNote,
  getKnowledgeNotes,
  KnowledgeNoteStatus,
} from "@/lib/api/onboarding";
import { useToast } from "@/components/ui/toast/ToastContext";
import { FadeIn } from "@/components/ui/motion/FadeIn";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { usePolling } from "@/hooks/usePolling";

interface StageNotesProps {
  savedNotes: string[];
  onAddNote: (note: string) => void;
  onRemoveNote?: (index: number) => void;
  onNext: () => void;
  hasAnySource: boolean;
  loading?: boolean;
}

const NOTE_SUGGESTIONS = [
  "Предоплата 2000 ₸ обязательна для записей длительностью более 2 часов.",
  "Отмена или перенос записи принимаются минимум за 3 часа до визита.",
  "Бесплатная парковка для клиентов с обратной стороны здания.",
  "Перед сложным окрашиванием требуется очная консультация мастера.",
];

export function StageNotes({
  savedNotes,
  onAddNote,
  onRemoveNote,
  onNext,
  hasAnySource,
  loading = false,
}: StageNotesProps) {
  const t = useTranslations("onboarding");
  const toast = useToast();
  const [currentNote, setCurrentNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Track live processing statuses of submitted notes
  const [noteStatuses, setNoteStatuses] = useState<
    Record<string, KnowledgeNoteStatus>
  >({});

  const hasPending = Object.values(noteStatuses).some(
    (n) => n.processingStatus === "PENDING" || n.processingStatus === "PROCESSING"
  );

  // Polling for notes status
  const { start: startPolling } = usePolling({
    enabled: hasPending,
    fetcher: () => getKnowledgeNotes(),
    intervalMs: 3000,
    maxAttempts: 20,
    onSuccess: (notes) => {
      setNoteStatuses((prev) => {
        const next = { ...prev };
        for (const n of notes) {
          if (next[n.id]) {
            next[n.id] = n;
          }
        }
        return next;
      });
    },
    shouldStop: (notes) =>
      !notes.some(
        (n) =>
          n.processingStatus === "PENDING" || n.processingStatus === "PROCESSING"
      ),
  });

  const saveSingleNote = async (text: string): Promise<boolean> => {
    const trimmed = text.trim();
    if (!trimmed) return true;

    try {
      const res = await addKnowledgeNote({ notes: [trimmed] });
      onAddNote(trimmed);
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
      return true;
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : t("knowledge.notes.error_save")
      );
      return false;
    }
  };

  const handleSaveNote = async () => {
    const trimmed = currentNote.trim();
    if (!trimmed) {
      toast.error("Пожалуйста, введите текст заметки");
      return;
    }

    setSubmitting(true);
    try {
      const ok = await saveSingleNote(trimmed);
      if (ok) {
        setCurrentNote("");
        toast.success("Заметка сохранена! ИИ обрабатывает её в фоне.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleProceed = async () => {
    const trimmed = currentNote.trim();
    if (trimmed) {
      setSubmitting(true);
      try {
        const ok = await saveSingleNote(trimmed);
        if (ok) {
          setCurrentNote("");
          toast.success("Заметка сохранена! ИИ обрабатывает её в фоне.");
          onNext();
        }
      } finally {
        setSubmitting(false);
      }
    } else {
      onNext();
    }
  };

  const handleUseSuggestion = (suggestion: string) => {
    setCurrentNote((prev) => (prev ? `${prev}\n${suggestion}` : suggestion));
  };

  const hasNotes = savedNotes.length > 0;
  const hasTypedNote = Boolean(currentNote.trim());

  const pendingCount = Object.values(noteStatuses).filter(
    (n) => n.processingStatus === "PENDING" || n.processingStatus === "PROCESSING"
  ).length;

  return (
    <div className="space-y-5">
      {/* Header */}
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
        <Textarea
          rows={3}
          value={currentNote}
          onChange={(e) => setCurrentNote(e.target.value)}
          placeholder={t("knowledge.notes.input_placeholder")}
        />

        <Button
          type="button"
          onClick={handleSaveNote}
          loading={submitting}
          disabled={!currentNote.trim()}
          size="sm"
        >
          {t("knowledge.notes.btn_add_note")}
        </Button>
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
      <div className="pt-4 border-t border-border flex items-center justify-end">
        <Button
          type="button"
          onClick={handleProceed}
          loading={submitting || loading}
          disabled={loading}
          variant={hasAnySource || hasNotes || hasTypedNote ? "primary" : "secondary"}
          size="md"
        >
          {hasTypedNote
            ? t("knowledge.notes.btn_save_and_proceed")
            : hasAnySource || hasNotes
            ? t("knowledge.notes.btn_check_kb")
            : t("knowledge.notes.btn_skip_to_check")}
        </Button>
      </div>
    </div>
  );
}
