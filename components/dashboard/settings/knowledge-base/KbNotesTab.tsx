"use client";

import React, { useState } from "react";
import { Plus, StickyNote } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { KbNoteCard } from "./notes/KbNoteCard";
import { KbNoteEditModal } from "./KbNoteEditModal";
import { ConfirmDeleteModal } from "@/components/dashboard/shared/ConfirmDeleteModal";
import { knowledgeBaseApi, type ManualNoteDto } from "@/lib/api/knowledgeBase";

interface KbNotesTabProps {
  notes: ManualNoteDto[];
  isLoading: boolean;
  onRefresh: () => void;
}

export function KbNotesTab({ notes, isLoading, onRefresh }: KbNotesTabProps) {
  const t = useTranslations("dashboard");
  const tCommon = useTranslations("common");

  const [isAdding, setIsAdding] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [editingNote, setEditingNote] = useState<ManualNoteDto | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [deletingNoteId, setDeletingNoteId] = useState<string | null>(null);

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteContent.trim()) return;
    setIsSubmitting(true);
    try {
      await knowledgeBaseApi.createNotes([newNoteContent.trim()]);
      setNewNoteContent("");
      setIsAdding(false);
      onRefresh();
    } catch (err) {
      console.error("Failed to save note", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (note: ManualNoteDto) => {
    try {
      await knowledgeBaseApi.updateEntry(note.id, { active: !note.active });
      onRefresh();
    } catch (err) {
      console.error("Failed to toggle note active state", err);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingNoteId) return;
    try {
      await knowledgeBaseApi.deleteNote(deletingNoteId);
      onRefresh();
    } catch (err) {
      console.error("Failed to delete note", err);
    } finally {
      setDeletingNoteId(null);
    }
  };

  const handleSaveEdit = async (id: string, payload: { title?: string; note: string }) => {
    setIsSavingEdit(true);
    try {
      await knowledgeBaseApi.updateNote(id, payload);
      onRefresh();
    } finally {
      setIsSavingEdit(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-foreground">
            {t("knowledge.notes_title")}
          </h3>
          <p className="text-xs text-muted-foreground">
            {t("knowledge.notes_description")}
          </p>
        </div>

        {!isAdding && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsAdding(true)}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
            className="text-xs"
          >
            {t("knowledge.add_note")}
          </Button>
        )}
      </div>

      {/* Add New Note Card */}
      {isAdding && (
        <form
          onSubmit={handleCreateNote}
          className="p-4 rounded-2xl bg-card border border-primary/30 shadow-xs space-y-3"
        >
          <div className="text-xs font-semibold text-foreground flex items-center justify-between">
            <span>{t("knowledge.add_note")}</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsAdding(false)}
              className="h-6 text-xs px-2"
            >
              {tCommon("cancel")}
            </Button>
          </div>

          <Textarea
            rows={4}
            required
            autoFocus
            value={newNoteContent}
            onChange={(e) => setNewNoteContent(e.target.value)}
            placeholder={t("knowledge.note_content_placeholder")}
          />

          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={isSubmitting}
              disabled={!newNoteContent.trim()}
            >
              {tCommon("save")}
            </Button>
          </div>
        </form>
      )}

      {/* Notes List */}
      {notes.length === 0 && !isAdding ? (
        <div className="p-8 text-center rounded-2xl bg-muted/20 border border-dashed border-border/60">
          <StickyNote className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
          <p className="text-xs font-medium text-muted-foreground">
            {t("knowledge.no_notes")}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {notes.map((note) => (
            <KbNoteCard
              key={note.id}
              note={note}
              onToggleActive={handleToggleActive}
              onEdit={(n) => setEditingNote(n)}
              onDelete={(id) => setDeletingNoteId(id)}
            />
          ))}
        </div>
      )}

      {/* Edit Modal */}
      <KbNoteEditModal
        isOpen={Boolean(editingNote)}
        note={editingNote}
        isSaving={isSavingEdit}
        onClose={() => setEditingNote(null)}
        onSave={handleSaveEdit}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={Boolean(deletingNoteId)}
        onClose={() => setDeletingNoteId(null)}
        onConfirm={handleConfirmDelete}
        title={t("knowledge.confirm_delete_note_title")}
        description={t("knowledge.confirm_delete_note_desc")}
      />
    </div>
  );
}
