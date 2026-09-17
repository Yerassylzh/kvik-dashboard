"use client";

import React, { useState } from "react";
import { Pin, Trash2, User, Clock, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useLeadNotes } from "@/hooks/useLeads";
import type { LeadNoteDto } from "@/lib/api/leads";

interface LeadNotesProps {
  leadId: string;
  notes?: LeadNoteDto[];
  onNoteChange?: () => void;
}

export function LeadNotes({ leadId, notes = [], onNoteChange }: LeadNotesProps) {
  const t = useTranslations("dashboard");
  const [content, setContent] = useState("");
  const [isPinned, setIsPinned] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { addNote, deleteNote, isSubmitting } = useLeadNotes(leadId, onNoteChange);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    await addNote(content, isPinned);
    setContent("");
    setIsPinned(false);
  };

  const handleDelete = async (noteId: string) => {
    if (!window.confirm(t("leads.notes_delete_confirm"))) return;
    setDeletingId(noteId);
    try {
      await deleteNote(noteId);
    } finally {
      setDeletingId(null);
    }
  };

  // Sort notes: pinned first, then newest first
  const sortedNotes = [...notes].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className="space-y-4 py-1">
      {/* Create note form */}
      <form onSubmit={handleCreate} className="p-3.5 rounded-xl bg-card border border-border/60 shadow-xs space-y-3">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={t("leads.notes_placeholder")}
          rows={2}
          className="text-xs resize-none"
        />

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isPinned}
              onChange={(e) => setIsPinned(e.target.checked)}
              className="rounded border-input text-primary focus:ring-primary/20 h-3.5 w-3.5"
            />
            <Pin className={`w-3.5 h-3.5 ${isPinned ? "text-primary" : "text-muted-foreground"}`} />
            <span>{t("leads.notes_pin_label")}</span>
          </label>

          <Button
            type="submit"
            size="sm"
            disabled={!content.trim() || isSubmitting}
            loading={isSubmitting}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
            className="text-xs font-semibold"
          >
            {t("leads.notes_add_btn")}
          </Button>
        </div>
      </form>

      {/* Notes list */}
      <div className="space-y-2.5">
        {sortedNotes.length === 0 ? (
          <div className="text-center py-6 text-xs text-muted-foreground">
            {t("leads.notes_empty")}
          </div>
        ) : (
          sortedNotes.map((note) => {
            const dateStr = new Date(note.createdAt).toLocaleDateString("ru-RU", {
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <div
                key={note.id}
                className={`p-3.5 rounded-xl border transition-all ${
                  note.isPinned
                    ? "bg-primary/5 border-primary/30 shadow-xs"
                    : "bg-card border-border/60 shadow-xs"
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="flex items-center gap-1 text-xs font-semibold text-foreground truncate">
                      <User className="w-3 h-3 text-muted-foreground" />
                      {note.author?.name || t("leads.timeline_actor_manager")}
                    </span>

                    {note.isPinned && (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-semibold bg-primary/10 text-primary">
                        <Pin className="w-2.5 h-2.5" />
                        {t("leads.notes_pin_label")}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 text-[11px] text-muted-foreground font-mono">
                      <Clock className="w-3 h-3" />
                      {dateStr}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleDelete(note.id)}
                      disabled={deletingId === note.id}
                      className="p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-foreground/90 leading-relaxed whitespace-pre-wrap">
                  {note.content}
                </p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
